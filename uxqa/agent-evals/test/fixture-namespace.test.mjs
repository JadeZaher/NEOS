import assert from 'node:assert/strict';
import fs from 'node:fs';
import { test } from 'node:test';
import { buildFixtures, fixtureNamespace, teardown } from '../neos-api.mjs';
import { evaluateState, parseCheck } from '../grading.mjs';

const people = new Map([['qa-agent-cleo', { handle: 'qa-agent-cleo', primary: 'OmniOne', ecosystems: { OmniOne: 'eco-1' }, memberId: 'member-cleo', name: 'Cleo' }]]);
const domainTask = (id) => ({ id, fixtures: { D1: { domain: 'Seed Library', steward: 'cleo', purpose: 'Looks after seeds.' } } });

test('same-stem read, join, and repeated join fixtures never share a title with archived predecessors', async () => {
	const records = [];
	const client = { must: async (handle, method, route, body) => {
		if (method === 'POST' && route === '/api/v1/domains') {
			const record = { id: `domain-${records.length + 1}`, domain_id: `DOM-${records.length + 1}`, name: body.name, status: 'active' };
			records.push(record);
			return record;
		}
		if (method === 'PUT') {
			const record = records.find((entry) => route === `/api/v1/domains/${entry.id}`);
			assert.ok(record);
			record.status = body.status;
			return record;
		}
		throw new Error(`Unexpected request ${method} ${route}`);
	} };
	const read = await buildFixtures(client, domainTask('R5'), people, 'uxqa-p5', 'r7f6b', {}, 1);
	await teardown(client, read, { proposals: [], exits: [] }, 'qa-agent-ana');
	const join = await buildFixtures(client, domainTask('A6'), people, 'uxqa-p5', 'r7f6b', {}, 1);
	await teardown(client, join, { proposals: [], exits: [] }, 'qa-agent-ana');
	const repeat = await buildFixtures(client, domainTask('A6'), people, 'uxqa-p5', 'r7f6b', {}, 2);
	assert.equal(new Set([read.D1.title, join.D1.title, repeat.D1.title]).size, 3);
	assert.deepEqual(records.map((entry) => entry.status), ['archived', 'archived', 'active']);
	assert.deepEqual(records.filter((entry) => entry.name === repeat.D1.title).map((entry) => entry.id), [repeat.D1.id]);
	assert.notEqual(repeat.D1.id, read.D1.id);
	assert.notEqual(repeat.D1.key, read.D1.key);
	assert.equal(repeat.D1.path, `/domains/${repeat.D1.id}`);
	for (const ref of [read.D1, join.D1, repeat.D1]) assert.match(ref.title, / \(uxqa-p5 agent-eval r[^)]*\)$/);
	assert.equal(evaluateState(parseCheck('participant(D1, ana)'), { value: false }).ok, false, 'joining only an archived predecessor cannot satisfy the current fixture');
});

test('proposal, domain, and agreement builders all use the task/repeat namespace', async () => {
	const titles = [];
	const client = { must: async (handle, method, route, body) => {
		if (method === 'GET') return { status: 'draft' };
		titles.push(body.title || body.name);
		return { id: `record-${titles.length}`, proposal_id: 'PROP-X', domain_id: 'DOM-X', agreement_id: 'AGR-X' };
	} };
	const task = { id: 'C5', fixtures: {
		P1: { proposal: 'A proposal', author: 'cleo', stage: 'draft' },
		D1: { domain: 'A domain', steward: 'cleo', purpose: 'A purpose' },
		G1: { agreement: 'An agreement', steward: 'cleo' },
	} };
	const refs = await buildFixtures(client, task, people, 'uxqa-p5', 'rabc123', {}, 3);
	assert.equal(titles.length, 3);
	for (const title of titles) assert.ok(title.endsWith('(uxqa-p5 agent-eval rabc123-C5-3)'));
	assert.deepEqual(Object.values(refs).map((ref) => ref.title), titles);
});

test('invalid task/repeat identities fail before any fixture request or stale-record fallback', async () => {
	for (const [runId, taskId, index] of [['bad-run', 'A6', 1], ['rabc', '../A6', 1], ['rabc', 'A6', 0], ['rabc', 'A6', 1.5]]) {
		assert.throws(() => fixtureNamespace(runId, taskId, index), /Invalid.*fixture namespace/);
	}
	let requests = 0;
	await assert.rejects(buildFixtures({ must: async () => { requests++; } }, domainTask('A6'), people, 'uxqa-p5', 'rabc', {}, 0), /Invalid.*fixture namespace/);
	assert.equal(requests, 0);
});

test('C3 keeps a draft request in draft in both deterministic state and persisted-content judging', () => {
	const tasks = JSON.parse(fs.readFileSync(new URL('../tasks.json', import.meta.url), 'utf8')).tasks;
	const task = tasks.find((entry) => entry.id === 'C3');
	assert.ok(task.state.includes('+proposal(Seed swap, Oasis, fay, draft)'));
	assert.match(task.judge.join(' '), /persisted proposal.*createdProposals.*draft/);
	assert.match(task.judge.join(' '), /does not open advice or consent unless the member explicitly asks/);
});
