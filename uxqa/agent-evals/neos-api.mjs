// NEOS REST side of the evals: a cookie-holding client per persona, fixtures built through the real API,
// observations for state checks, and teardown. Never logs a header or cookie. See uxqa/agent-evals/AGENTS.md sec. Fixtures.
import { collectTurn, readEvents } from './stream.mjs';

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);
const REQUEST_SECONDS = 30;
export const CHAT_SECONDS = 180;
export const ACTIVE_EMERGENCY = new Set(['open', 'half_open']);

/** Refuses any base URL that is not this machine (the study never talks to a deployed stack). */
export function assertLocal(baseUrl) {
	const host = new URL(baseUrl).hostname;
	if (!LOCAL_HOSTS.has(host)) throw new Error(`REFUSED base url host ${host} is not local`);
}

/** REST + chat client. cookies: handle -> neos_session value (held in memory only). */
export function createClient(baseUrl, cookies) {
	assertLocal(baseUrl);
	const cookieHeader = (handle, scopeIds) => {
		if (!cookies.has(handle)) throw new Error(`no session for ${handle}`);
		const scope = scopeIds?.length ? `; neos_selected_ecosystems=${encodeURIComponent(JSON.stringify(scopeIds))}` : '';
		return `neos_session=${cookies.get(handle)}${scope}`;
	};
	const stats = { requests: 0 };

	async function call(handle, method, path, body, { scopeIds } = {}) {
		const response = await fetch(baseUrl + path, {
			method,
			headers: { accept: 'application/json', cookie: cookieHeader(handle, scopeIds), ...(body ? { 'content-type': 'application/json' } : {}) },
			body: body ? JSON.stringify(body) : undefined,
			signal: AbortSignal.timeout(REQUEST_SECONDS * 1000),
		});
		const data = await response.json().catch(() => null);
		return { status: response.status, data };
	}

	/** Like call(), but a non-2xx answer throws "<METHOD> <path> -> <status> <error>". */
	async function must(handle, method, path, body, options) {
		const { status, data } = await call(handle, method, path, body, options);
		if (status >= 300) throw new Error(`${method} ${path.split('?')[0]} -> ${status} ${String(data?.error || '').slice(0, 120)}`);
		return data;
	}

	/** One user turn through the real chat endpoint; returns the collected turn (text, trace, tokens, session). */
	async function chat(handle, payload, { scopeIds } = {}) {
		stats.requests++;
		const response = await fetch(`${baseUrl}/api/v1/chat/send`, {
			method: 'POST',
			headers: { 'content-type': 'application/json', accept: 'text/event-stream', cookie: cookieHeader(handle, scopeIds) },
			body: JSON.stringify(payload),
			signal: AbortSignal.timeout(CHAT_SECONDS * 1000),
		});
		if (!response.ok) {
			const data = await response.json().catch(() => null);
			throw new Error(`chat HTTP ${response.status} ${String(data?.error || '').slice(0, 120)}`);
		}
		return collectTurn(await readEvents(response.body));
	}

	return { call, must, chat, stats };
}

/** Who each persona is on the server: member id, display name, ecosystems by name (from /auth/me). */
export async function loadPeople(client, personas) {
	const people = new Map();
	for (const persona of personas) {
		const me = await client.must(persona.handle, 'GET', '/api/v1/auth/me');
		const ecosystems = Object.fromEntries((me.ecosystems || []).map((e) => [e.name, e.id]));
		const primary = (me.ecosystems || []).find((e) => e.id === me.member?.ecosystem_id)?.name;
		const memberships = persona.seed?.memberships || [];
		people.set(persona.handle, { handle: persona.handle, short: persona.handle.replace('qa-agent-', ''), name: me.member?.display_name || persona.name, memberId: me.member?.id, primary, ecosystems, memberships });
	}
	return people;
}

/** Task/repeat namespace retained inside the seed-compatible agent-eval marker. */
export function fixtureNamespace(runId, taskId, runIndex) {
	if (!/^r[0-9a-f]+$/i.test(runId) || !/^[A-Z]\d+$/.test(taskId) || !Number.isSafeInteger(runIndex) || runIndex < 1) {
		throw new Error('Invalid agent-eval fixture namespace');
	}
	return `${runId}-${taskId}-${runIndex}`;
}

/** Fixture title with the marker the seed's retire step matches. */
export const fixtureTitle = (stem, marker, runId) => `${stem} (${marker} agent-eval ${runId})`;

/** Builds a task's fixtures through REST as their owners into refs { P1: { kind, id, key, stem, title, path, owner } }, one by one so a failure still tears down the earlier ones. */
export async function buildFixtures(client, task, people, marker, runId, refs = {}, runIndex = 1) {
	const person = (short) => people.get(`qa-agent-${short}`);
	const namespace = fixtureNamespace(runId, task.id, runIndex);
	for (const [name, spec] of Object.entries(task.fixtures || {})) {
		if (spec.proposal) refs[name] = await buildProposal(client, spec, person, fixtureTitle(spec.proposal, marker, namespace));
		else if (spec.domain) refs[name] = await buildDomain(client, spec, person, fixtureTitle(spec.domain, marker, namespace));
		else if (spec.agreement) refs[name] = await buildAgreement(client, spec, person, fixtureTitle(spec.agreement, marker, namespace));
		else throw new Error(`fixture ${name}: unknown kind`);
	}
	return refs;
}

async function buildProposal(client, spec, person, title) {
	const author = person(spec.author);
	const ecosystem = spec.ecosystem || author.primary;
	const created = await client.must(author.handle, 'POST', '/api/v1/proposals', {
		ecosystem_id: author.ecosystems[ecosystem], type: 'operational', title,
		proposed_change: spec.change || `${spec.proposal}: a small change for the community to try.`,
		rationale: spec.rationale || 'Members asked for it at the last gathering.',
		act_policy: { min_advice_rounds: spec.rounds ?? 1, ...(spec.quorum ? { consent_quorum: spec.quorum } : {}) },
	});
	const path = `/api/v1/proposals/${created.id}`;
	if (spec.stage !== 'draft') await client.must(author.handle, 'POST', `${path}/status`, { status: 'advice' });
	for (const advisor of spec.advisedBy || []) {
		await client.must(person(advisor).handle, 'POST', `${path}/advice`, { content: `Sounds workable; please keep it simple. (${title.slice(title.lastIndexOf('(') + 1, -1)})` });
	}
	// Owner decision 2026-10-31: advice never advances by itself; the proposer closes it.
	if (spec.stage === 'consent') await client.must(author.handle, 'POST', `${path}/status`, { status: 'consent' });
	const now = await client.must(author.handle, 'GET', path);
	if (now.status !== spec.stage) throw new Error(`fixture "${spec.proposal}" is ${now.status}, expected ${spec.stage}`);
	return { kind: 'proposal', id: created.id, key: created.proposal_id, stem: spec.proposal, title, path: `/proposals/${created.id}`, owner: author.handle };
}

async function buildDomain(client, spec, person, title) {
	const steward = person(spec.steward);
	const created = await client.must(steward.handle, 'POST', '/api/v1/domains', {
		ecosystem_id: steward.ecosystems[steward.primary], name: title, purpose: spec.purpose,
		current_steward: steward.name, steward_id: steward.memberId, created_by: steward.name,
	});
	return { kind: 'domain', id: created.id, key: created.domain_id, stem: spec.domain, title, path: `/domains/${created.id}`, owner: steward.handle };
}

async function buildAgreement(client, spec, person, title) {
	const steward = person(spec.steward);
	const created = await client.must(steward.handle, 'POST', '/api/v1/agreements', {
		ecosystem_id: steward.ecosystems[steward.primary], type: 'operational', title, proposer: steward.name,
		text: spec.text || `${spec.agreement}: members keep the workshop quiet after 9pm.`,
	});
	return { kind: 'agreement', id: created.id, key: created.agreement_id, stem: spec.agreement, title, path: `/agreements/${created.id}`, owner: steward.handle };
}

/** First persona with a steward role (mod+) in the ecosystem; it reads emergencies there and resolves any the assistant opened. */
export function stewardIn(people, ecosystem) {
	return [...people.values()].find((p) => p.memberships.some((m) => m.ecosystem === ecosystem && ['mod', 'admin', 'owner'].includes(m.role)));
}

/**
 * Reads what one state check looks at. Row kinds return every candidate row with an id (the runner keeps those created
 * after the task started); value kinds return { value }. cache memoises proposal reads within one evaluation point.
 */
export async function observe(client, check, { refs, task, people, ecosystemNames, cache }) {
	const reader = people.get(`qa-agent-${task.persona}`);
	const proposalDetail = (ref) => cache.get(ref.id) ?? cache.set(ref.id, client.must(ref.owner, 'GET', `/api/v1/proposals/${ref.id}`)).get(ref.id);
	const ref = refs[check.args[0]];
	switch (check.kind) {
		case 'status':
			if (ref.kind === 'agreement') return { value: (await client.must(ref.owner, 'GET', `/api/v1/agreements/${ref.id}`)).status };
			return { value: (await proposalDetail(ref)).status };
		case 'objections':
			return { value: (await proposalDetail(ref)).gates?.consent?.open_objections };
		case 'participant': {
			const who = people.get(`qa-agent-${check.args[1]}`);
			return { value: (await client.must(who.handle, 'GET', `/api/v1/domains/${ref.id}`)).caller_is_participant === true };
		}
		case 'advice':
			return { rows: (await proposalDetail(ref)).advice_logs.flatMap((log) => log.entries).map((e) => ({ id: e.id, name: e.advisor, text: e.content })) };
		case 'consent':
			return { rows: (await proposalDetail(ref)).consent_records.flatMap((r) => r.participants).map((p) => ({ id: p.id, name: p.member_name, position: p.position, text: p.objection_text })) };
		case 'proposal': {
			const ids = Object.values(reader.ecosystems).join(',');
			const firstWord = check.args[0].split(/\s+/)[0];
			const list = await client.must(reader.handle, 'GET', `/api/v1/proposals?q=${encodeURIComponent(firstWord)}&ecosystem_ids=${ids}&per_page=50`);
			const authors = new Map([...people.values()].map((p) => [p.memberId, p.name]));
			return { rows: list.items.map((p) => ({ id: p.id, title: p.title, ecosystem: ecosystemNames.get(p.ecosystem_id), author: authors.get(p.proposer_member_id) || p.proposer, status: p.status })) };
		}
		case 'emergency': {
			const steward = stewardIn(people, check.args[0]);
			const list = await client.must(steward.handle, 'GET', `/api/v1/emergency/?ecosystem_ids=${steward.ecosystems[check.args[0]]}&per_page=50`);
			return { rows: list.items.map((e) => ({ id: e.id, state: e.state, declaredBy: e.declared_by })) };
		}
		case 'exit': {
			const target = people.get(`qa-agent-${check.args[0]}`);
			const list = await client.must(reader.handle, 'GET', `/api/v1/exit/?ecosystem_ids=${Object.values(reader.ecosystems).join(',')}&per_page=50`);
			return { rows: list.items.filter((x) => x.member_id === target.memberId).map((x) => ({ id: x.id, status: x.status })) };
		}
		default:
			throw new Error(`not a state check: ${check.source}`);
	}
}

/** Read back assistant-created proposals before teardown so judges can inspect persisted commitments. */
export async function captureCreatedProposals(client, handle, ids) {
	const evidence = [];
	for (const id of new Set(ids)) {
		if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(id))) {
			evidence.push({ id, error: 'invalid created proposal id' });
			continue;
		}
		try {
			const { status, data } = await client.call(handle, 'GET', `/api/v1/proposals/${id}`);
			evidence.push(status >= 200 && status < 300 && data && typeof data === 'object' && data.id === id
				? { id, httpStatus: status, data }
				: { id, httpStatus: status, error: 'created proposal could not be read back' });
		} catch (error) {
			evidence.push({ id, error: String(error.message || error).slice(0, 200) });
		}
	}
	return evidence;
}

/** Puts back what a run created: fixture proposals withdrawn, fixture domains archived, assistant-made proposals and exits retired. */
export async function teardown(client, refs, created, taskPersonaHandle) {
	const problems = [];
	const attempt = async (what, fn) => fn().catch((error) => problems.push(`${what}: ${error.message}`));
	for (const ref of Object.values(refs)) {
		if (ref.kind === 'proposal') await attempt(`withdraw ${ref.stem}`, () => client.must(ref.owner, 'POST', `/api/v1/proposals/${ref.id}/status`, { status: 'withdrawn' }));
		if (ref.kind === 'domain') await attempt(`archive ${ref.stem}`, () => client.must(ref.owner, 'PUT', `/api/v1/domains/${ref.id}`, { status: 'archived' }));
	}
	for (const id of created.proposals) await attempt(`withdraw created proposal`, () => client.must(taskPersonaHandle, 'POST', `/api/v1/proposals/${id}/status`, { status: 'withdrawn' }));
	for (const id of created.exits) await attempt(`cancel created exit`, () => client.must(taskPersonaHandle, 'POST', `/api/v1/exit/${id}/status`, { new_status: 'cancelled' }));
	return problems;
}
