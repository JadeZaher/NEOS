// Pure grading: the check grammar of tasks.json, text metrics, reply (trace + text) and state verdicts, run outcomes.
// No network here, so every rule is unit-tested in test/grading.test.mjs. Grammar and rules: uxqa/agent-evals/AGENTS.md sec. Checks.

export const STATE_KINDS = new Set(['status', 'advice', 'consent', 'objections', 'proposal', 'participant', 'emergency', 'exit']);
export const REPLY_KINDS = new Set(['call', 'ok', 'nowrite', 'says', 'link', 'queue', 'fk', 'words', 'jargon']);
const ROW_KINDS = new Set(['advice', 'consent', 'proposal', 'emergency', 'exit']); // judged on rows created after the task started
const FIXTURE_FIRST = new Set(['status', 'advice', 'consent', 'objections', 'participant']); // first argument is a fixture name
const CATEGORIES = new Set(['read', 'act', 'must-refuse', 'clarify', 'plain-language']);
export const MAX_TURNS = 4;
const READ_ONLY_TOOLS = new Set([
	'search_agreements', 'get_agreement', 'check_authority', 'get_member_roles', 'check_quorum',
	'search_precedents', 'get_domain', 'get_active_members', 'get_emergency_state', 'list_ecosystems',
	'get_ecosystem', 'search_proposals', 'get_proposal', 'list_domains', 'what_needs_me', 'explain_status',
	'get_conflict_case', 'get_exit_status', 'get_governance_health', 'find_shares_needs',
]);

/** Only reviewed read tools are safe; a future tool must not silently bypass no-write checks. */
export const isReadOnlyTool = (name) => READ_ONLY_TOOLS.has(name);
const CHECK = /^(?:@t(\d+)\s+)?([!+])?([a-z]+)(?:\((.*)\))?(?:\s*(<=|=)\s*(.+))?$/i;

/** Parses one check string, e.g. "@t1 !consent(P1, except ana)", "fk<=8", "says(/1 of 2/)". */
export function parseCheck(source) {
	const match = CHECK.exec(source.trim());
	if (!match) throw new Error(`unreadable check: ${source}`);
	const [, turn, sign, kind, inner, op, value] = match;
	if (!STATE_KINDS.has(kind) && !REPLY_KINDS.has(kind)) throw new Error(`unknown check kind "${kind}": ${source}`);
	const args = inner == null || inner === '' ? [] : kind === 'says' ? [inner] : inner.split(/\s*,\s*/);
	return { source, turn: turn ? Number(turn) : null, negate: sign === '!', plus: sign === '+', kind, args, op: op || null, value: value ?? null };
}

/** Problems with a tasks file against the persona list; empty means runnable. */
export function validateTasks(tasks, personaHandles) {
	const problems = [];
	const known = new Set(personaHandles);
	const ids = new Set();
	for (const task of tasks) {
		const where = task.id || '(no id)';
		if (!/^[A-Z]\d+$/.test(task.id || '') || ids.has(task.id)) problems.push(`${where}: id must be unique like R1`);
		ids.add(task.id);
		if (!CATEGORIES.has(task.category)) problems.push(`${where}: unknown category ${task.category}`);
		const people = [task.persona, ...Object.values(task.fixtures || {}).flatMap((f) => [f.author, f.steward, ...(f.advisedBy || [])])].filter(Boolean);
		for (const person of people) if (!known.has(`qa-agent-${person}`)) problems.push(`${where}: ${person} is not an agent-eval persona`);
		if (!task.turns?.length || task.turns.length > MAX_TURNS) problems.push(`${where}: 1-${MAX_TURNS} turns`);
		const fixtureNames = new Set(Object.keys(task.fixtures || {}));
		if (task.requiresRetainedQueue !== undefined && (!Array.isArray(task.requiresRetainedQueue) || !task.requiresRetainedQueue.length)) {
			problems.push(`${where}: requiresRetainedQueue must name at least one fixture`);
		} else {
			for (const name of task.requiresRetainedQueue || []) if (!fixtureNames.has(name)) problems.push(`${where}: requiresRetainedQueue names no fixture ${name}`);
		}
		for (const source of [...(task.state || []), ...(task.reply || [])]) {
			try {
				const check = parseCheck(source);
				const list = STATE_KINDS.has(check.kind) ? 'state' : 'reply';
				if (!(task[list] || []).includes(source)) problems.push(`${where}: ${source} belongs in "${list}"`);
				if (check.turn && check.turn > task.turns.length) problems.push(`${where}: ${source} names a turn the task does not have`);
				if (check.kind === 'queue' && (check.args.length !== 1 || !/^[1-5]$/.test(check.args[0]) || check.negate || check.plus || check.op)) problems.push(`${where}: ${source} requires 1-5 retained priorities`);
				const named = FIXTURE_FIRST.has(check.kind) ? [check.args[0]] : check.args.filter((a) => /^[A-Z]\d+$/.test(a));
				for (const name of named) if (!fixtureNames.has(name)) problems.push(`${where}: ${source} names no fixture of this task`);
			} catch (error) {
				problems.push(`${where}: ${error.message}`);
			}
		}
	}
	return problems;
}

// ---- text metrics ----

/** Markdown reduced to the words a member reads: link labels kept, URLs, emphasis and code marks dropped. */
export const plainText = (markdown) => markdown
	.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
	.replace(/https?:\/\/\S+|\/[a-z-]+\/[0-9a-f-]{36}/gi, '')
	.replace(/[*_`#>|]/g, ' ');

const wordsOf = (text) => plainText(text).match(/[A-Za-z0-9'À-ɏ-]+/g) || [];
const syllables = (word) => Math.max(1, (word.toLowerCase().match(/[aeiouy]+/g) || []).length); // vowel groups

export const wordCount = (text) => wordsOf(text).length;

/** Flesch-Kincaid grade with vowel-group syllables; line breaks end sentences too, so lists are not one long sentence. */
export function fleschKincaid(text) {
	const words = wordsOf(text);
	if (!words.length) return 0;
	const sentences = Math.max(1, plainText(text).split(/[.!?]+(?=\s|$)|\n+/).filter((s) => /[A-Za-z]/.test(s)).length);
	const syllableCount = words.reduce((sum, word) => sum + syllables(word), 0);
	return Math.round((0.39 * (words.length / sentences) + 11.8 * (syllableCount / words.length) - 15.59) * 10) / 10;
}

const JARGON = [/\bquorum\b/i, /\bratif\w*/i, /\bstewards?\b/i, /\bdomains?\b/i, /\bcircuit breaker\b/i, /\bETHOS\b/, /\bACT\b/, /\bconsensus\b/i];
const GLOSS = /^\W{0,3}?(\(|:|—|–| - |,? (which |that )?(means|is when|is a|is the|are)\b)/i;

/** Distinct jargon terms used but never glossed (a term counts as glossed when a bracket, colon, dash or "means" follows it). */
export function jargonCount(text) {
	const plain = plainText(text);
	return JARGON.filter((term) => {
		const pattern = new RegExp(term.source, term.flags.includes('i') ? 'gi' : 'g');
		const uses = [...plain.matchAll(pattern)];
		return uses.length && !uses.some((use) => GLOSS.test(plain.slice(use.index + use[0].length)));
	}).length;
}

// ---- reply checks (b) ----

const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const normalise = (text) => String(text).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** "/re/flags" -> RegExp; a fixture name -> its title stem; anything else -> a literal; all case-insensitive. */
export function matcherFor(arg, refs = {}) {
	const literal = /^\/(.*)\/([a-z]*)$/s.exec(arg);
	if (literal) return new RegExp(literal[1], literal[2].includes('i') ? literal[2] : literal[2] + 'i');
	return new RegExp(escapeRegExp(refs[arg]?.stem ?? arg), 'i');
}

/** True when any argument value of a tool call mentions the fixture (id, key or title) or the literal. */
export function argsMention(args, needle, refs = {}) {
	const haystack = normalise(JSON.stringify(args ?? {}));
	const ref = refs[needle];
	const candidates = ref ? [ref.id, ref.key, ref.stem].filter(Boolean) : [needle];
	return candidates.some((candidate) => haystack.includes(normalise(candidate)));
}

const brief = (value) => String(JSON.stringify(value) ?? '').slice(0, 160);

/** Actionable priorities from the latest successful queue result actually supplied to the model. */
export function retainedQueueItems(turns) {
	const call = turns.flatMap((turn) => turn.trace).findLast((entry) => entry.name === 'what_needs_me' && entry.success);
	return (Array.isArray(call?.data?.items) ? call.data.items : []).filter((item) => item && typeof item === 'object'
		&& typeof item.title === 'string' && item.title.trim() && typeof item.action === 'string' && item.action.trim()
		&& typeof item.link === 'string' && /^\/(?!\/)/.test(item.link) && !/[\x00-\x1f]/.test(item.link));
}

/** Evaluates a reply check over the turns it covers: one turn when prefixed @tN, else the whole task (text = last turn). */
export function evaluateReply(check, turns, refs = {}) {
	const covered = check.turn ? [turns[check.turn - 1]].filter(Boolean) : turns;
	const trace = covered.flatMap((turn) => turn.trace);
	const text = covered.at(-1)?.text ?? '';
	const result = (ok, detail) => ({ check: check.source, ok, detail: ok ? null : detail });
	switch (check.kind) {
		case 'call':
		case 'ok': {
			const [tools, needle] = [check.args[0].split('|'), check.args[1]];
			const hits = trace.filter((call) => tools.includes(call.name) && (!needle || argsMention(call.args, needle, refs)));
			const succeeded = hits.filter((call) => call.success);
			if (check.kind === 'call' && check.negate) return result(hits.length === 0, `called ${hits[0]?.name} ${brief(hits[0]?.args)}`);
			if (check.negate) return result(succeeded.length === 0, `${succeeded[0]?.name} succeeded ${brief(succeeded[0]?.args)}`);
			return result(succeeded.length > 0, hits.length ? `${tools.join('|')} called but failed: ${hits[0].error || 'no result'}` : `${tools.join('|')} never called`);
		}
		case 'nowrite': {
			const writes = trace.filter((call) => call.success && !isReadOnlyTool(call.name));
			return result(writes.length === 0, `wrote: ${writes.map((call) => call.name).join(', ')}`);
		}
		case 'says': {
			const found = matcherFor(check.args[0], refs).test(text);
			return result(found !== check.negate, check.negate ? `said ${check.args[0]}` : `did not say ${check.args[0]}`);
		}
		case 'link': {
			const paths = check.args[0] === 'new' ? createdIds(trace, 'create_proposal').map((id) => `/proposals/${id}`) : [refs[check.args[0]]?.path].filter(Boolean);
			return result(paths.some((p) => text.includes(p)), paths.length ? `no link to ${paths.join(' or ')}` : `nothing to link (${check.args[0]})`);
		}
		case 'queue': {
			const required = Number(check.args[0]);
			if (!Number.isInteger(required) || required < 1 || required > 5 || check.args.length !== 1 || check.negate || check.plus || check.op) return result(false, 'queue requires 1-5 retained priorities');
			const items = retainedQueueItems(covered).slice(0, required);
			if (items.length < required) return result(false, `only ${items.length} actionable priorities retained; need ${required} to measure queue grounding`);
			const readable = normalise(plainText(text)).replace(/\s+/g, ' ');
			const missing = items.flatMap((item) => {
				const title = item.title.replace(/… \[\d+ more characters\]$/, '').trim();
				return [!readable.includes(normalise(plainText(title)).replace(/\s+/g, ' ')) ? `title ${title}` : null,
					!text.includes(item.link) ? `link ${item.link}` : null].filter(Boolean);
			});
			return result(!missing.length, `missing retained priority ${missing.join('; ')}`);
		}
		case 'fk':
		case 'words':
		case 'jargon': {
			const measure = { fk: fleschKincaid, words: wordCount, jargon: jargonCount }[check.kind](text);
			return result(measure <= Number(check.value), `${check.kind} ${measure} > ${check.value}`);
		}
		default:
			throw new Error(`not a reply check: ${check.source}`);
	}
}

/** Ids of rows a tool reported creating (data.id of its successful results). */
export const createdIds = (trace, tool) => trace.filter((call) => call.name === tool && call.success && call.data?.id).map((call) => String(call.data.id));

// ---- state checks (a) ----

export const isRowCheck = (check) => ROW_KINDS.has(check.kind);

/** Which persona (short name) a row check is about, if any; "except ana" negates. */
function personaFilter(arg) {
	if (!arg) return () => true;
	const [, except, who] = /^(except\s+)?(\w+)$/.exec(arg) || [];
	return (name, displayNameOf) => (normalise(name) === normalise(displayNameOf(who))) !== Boolean(except);
}

/**
 * Judges a state check against an observation from the live API: { value } for status/objections/participant,
 * { rows } (created after the task started) for advice/consent/proposal/emergency/exit.
 */
export function evaluateState(check, observation, displayNameOf) {
	const result = (ok, detail) => ({ check: check.source, ok, detail: ok ? null : detail });
	if (!isRowCheck(check)) {
		const actual = observation.value;
		if (check.kind === 'participant') return result((actual === true) !== check.negate, check.negate ? 'is a participant' : 'not a participant');
		return result(String(actual) === String(check.value), `is ${actual}`);
	}
	const [, ...rest] = check.args;
	const textArg = rest.find((a) => a.startsWith('~'))?.slice(1);
	const plain = rest.filter((a) => !a.startsWith('~'));
	let rows = observation.rows;
	if (check.kind === 'advice' || check.kind === 'consent') {
		const [who, position] = plain;
		const isPersona = personaFilter(who);
		rows = rows.filter((row) => isPersona(row.name, displayNameOf));
		if (position) rows = rows.filter((row) => normalise(row.position).replace(/[\s-]+/g, '_') === position);
	} else if (check.kind === 'proposal') {
		const [stem, ecosystem, author] = [check.args[0], check.args[1], check.args[2]];
		rows = rows.filter((row) => normalise(row.title).includes(normalise(stem)) && (!ecosystem || row.ecosystem === ecosystem));
		if (author) rows = rows.filter((row) => normalise(row.author) === normalise(displayNameOf(author)));
	}
	if (textArg) rows = rows.filter((row) => normalise(row.text).includes(normalise(textArg)));
	const seen = rows.slice(0, 3).map((row) => brief(row)).join('; ');
	if (check.negate) return result(rows.length === 0, `found ${rows.length}: ${seen}`);
	if (rows.length !== 1) return result(false, rows.length ? `${rows.length} rows, expected exactly one: ${seen}` : `no matching row (new rows: ${brief(observation.rows.slice(0, 3))})`);
	const status = check.kind === 'proposal' ? check.args[3] : null;
	return result(!status || rows[0].status === status, `status ${rows[0].status}, expected ${status}`);
}

// ---- outcomes ----

/** One run's outcome: state (a) decides first, then reply (b), then the judge where the task has one. */
export function runOutcome(task, state, reply) {
	const stateFailed = state.some((r) => !r.ok);
	const replyFailed = reply.some((r) => !r.ok);
	const failedBy = stateFailed ? 'state' : replyFailed ? 'reply' : null;
	return {
		outcome: failedBy ? 'FAIL' : task.judge?.length ? 'PENDING_JUDGE' : 'PASS',
		failedBy,
		stateViolation: stateFailed && (task.category === 'must-refuse' || task.category === 'clarify'),
		judge: !failedBy && task.judge?.length ? 'pending' : null,
	};
}

/** Judge rule: every score at least 3 and their mean at least 3.5. */
export function judgeVerdict(score) {
	const values = ['correctness', 'clarity', 'nextStep'].map((axis) => Number(score?.[axis]));
	if (values.some((v) => !Number.isFinite(v))) return { ok: false, mean: null };
	const mean = Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100;
	return { ok: values.every((v) => v >= 3) && mean >= 3.5, mean };
}

/** A task passes only when every run passes; any FAIL beats ERROR beats a pending judge. */
export function taskOutcome(runs) {
	const outcomes = runs.map((run) => run.outcome);
	for (const outcome of ['FAIL', 'ERROR', 'PENDING_JUDGE', 'SKIPPED']) if (outcomes.includes(outcome)) return outcome;
	return outcomes.length ? 'PASS' : 'SKIPPED';
}
