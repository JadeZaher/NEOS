import assert from 'node:assert/strict';
import { test } from 'node:test';
import { executeOperatorCases } from '../operator-probe-lib.mjs';

const turn = { done: true, serviceUnavailable: false, text: 'Done', trace: [], tokens: 1, sessionId: 's' };
test('one failed family preserves its evidence while independent families continue and dependencies block', async () => {
	const called = [], saved = [];
	const client = { chat: async (_actor, payload) => { called.push(payload.message); if (payload.message === 'first') throw new Error('model failed'); return turn; } };
	const result = await executeOperatorCases(client, { cases: [
		{ id: 'first', actor: 'qa-agent-ben', turns: [{ message: 'first' }] },
		{ id: 'second', actor: 'qa-agent-ana', turns: [{ message: 'second' }] },
		{ id: 'dependent', actor: 'qa-agent-fay', dependsOn: ['first'], turns: [{ message: 'never' }] },
	] }, (value) => saved.push(value));
	assert.deepEqual(called, ['first', 'second']);
	assert.deepEqual(result.cases.map((entry) => entry.status), ['FAIL', 'PASS', 'BLOCKED']);
	assert.equal(result.ui_success_count, 0);
	assert.equal(result.passed, false);
	assert.ok(saved.some((value) => value.cases.some((entry) => entry.error === 'model failed')));
});

test('budget exhaustion stops further calls without erasing completed or remaining cases', async () => {
	let calls = 0;
	const client = { chat: async () => { calls++; return { ...turn, tokens: 2 }; } };
	const result = await executeOperatorCases(client, { tokenCap: 1, cases: [
		{ id: 'first', actor: 'qa-agent-ben', turns: [{ message: 'first' }] },
		{ id: 'second', actor: 'qa-agent-ana', turns: [{ message: 'blocked by budget' }] },
		{ id: 'third', actor: 'qa-agent-fay', turns: [{ message: 'never called' }] },
	] });
	assert.equal(calls, 1);
	assert.deepEqual(result.cases.map((entry) => entry.status), ['PASS', 'STOPPED', 'SKIPPED']);
	assert.equal(result.stopReason, 'tokenCap');
});
