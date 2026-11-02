import assert from 'node:assert/strict';
import fs from 'node:fs';
import { test } from 'node:test';
import { evaluateReply, parseCheck } from '../grading.mjs';

const tasks = JSON.parse(fs.readFileSync(new URL('../tasks.json', import.meta.url), 'utf8')).tasks;

test('C3 supplies the draft purpose while leaving ecosystem choice unresolved', () => {
	const task = tasks.find(({ id }) => id === 'C3');
	assert.match(task.turns[0], /seed swap.*exchange locally adapted seeds/i);
	assert.match(task.turns[0], /Keep it a draft/);
	assert.doesNotMatch(task.turns[0], /Oasis|OmniOne/);
	assert.equal(task.turns[1], 'Oasis.');
	assert.ok(task.state.includes('+proposal(Seed swap, Oasis, fay, draft)'));
	assert.ok(task.reply.includes('@t1 !ok(create_proposal)'));
	assert.ok(task.reply.includes('@t1 nowrite'));
});

test('P3 accepts equivalent day notation without accepting a different duration', () => {
	const task = tasks.find(({ id }) => id === 'P3');
	const check = parseCheck(task.reply.find((value) => value.startsWith('says(')));
	for (const text of ['a 30-day wind-down', 'up to 30 days', 'up to 30 day']) {
		assert.equal(evaluateReply(check, [{ text, trace: [] }]).ok, true, text);
	}
	for (const text of ['300 days', '130-day wind-down', 'up to 7 days']) {
		assert.equal(evaluateReply(check, [{ text, trace: [] }]).ok, false, text);
	}
	assert.ok(task.reply.includes('!call(create_exit_record)'));
	assert.match(task.judge.join(' '), /voluntary.*no penalty/);
	assert.match(task.judge.join(' '), /portable copy/);
});
