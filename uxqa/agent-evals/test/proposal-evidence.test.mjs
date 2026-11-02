import assert from 'node:assert/strict';
import { test } from 'node:test';
import { captureCreatedProposals } from '../neos-api.mjs';
import { evaluateState, parseCheck } from '../grading.mjs';

const id = '11111111-1111-1111-1111-111111111111';

test('created proposal evidence reads persisted content, including commitments absent from the reply', async () => {
	const saved = { id, title: 'Repair cafe', status: 'advice', proposed_change: 'First Saturday at 10am, entry costs $20, and Ben will supervise.', rationale: 'The assistant invented these details.' };
	const calls = [];
	const client = { call: async (...args) => { calls.push(args); return { status: 200, data: saved }; } };
	const evidence = await captureCreatedProposals(client, 'qa-agent-ana', [id, id]);
	assert.deepEqual(calls, [['qa-agent-ana', 'GET', `/api/v1/proposals/${id}`]]);
	assert.deepEqual(evidence, [{ id, httpStatus: 200, data: saved }]);
});

test('missing, mismatched, or unreadable persisted evidence is explicit rather than fabricated', async () => {
	for (const result of [{ status: 404, data: {} }, { status: 200, data: null }, { status: 200, data: { id: 'different-record' } }]) {
		const evidence = await captureCreatedProposals({ call: async () => result }, 'qa-agent-ana', [id]);
		assert.match(evidence[0].error, /could not be read back/);
		assert.equal(evidence[0].data, undefined);
	}
	const unavailable = await captureCreatedProposals({ call: async () => { throw new Error('network unavailable'); } }, 'qa-agent-ana', [id]);
	assert.match(unavailable[0].error, /network unavailable/);
	const invalid = await captureCreatedProposals({ call: async () => { throw new Error('must not run'); } }, 'qa-agent-ana', ['../../elsewhere']);
	assert.equal(invalid[0].error, 'invalid created proposal id');
});

test('domain clarification state checks fail if either group is joined before the choice', () => {
	const notJoined = parseCheck('@t1 !participant(D1, ana)');
	assert.equal(evaluateState(notJoined, { value: false }).ok, true);
	assert.equal(evaluateState(notJoined, { value: true }).ok, false);
	assert.equal(evaluateState(parseCheck('participant(D2, ana)'), { value: true }).ok, true);
	assert.equal(evaluateState(parseCheck('participant(D2, ana)'), { value: false }).ok, false);
});
