import assert from 'node:assert/strict';
import fs from 'node:fs';
import { test } from 'node:test';
import { evaluateReply, parseCheck, validateTasks } from '../grading.mjs';
import { retainedQueueSkipReason } from '../preconditions.mjs';

const tasks = JSON.parse(fs.readFileSync(new URL('../tasks.json', import.meta.url), 'utf8')).tasks;
const task = { requiresRetainedQueue: ['P1', 'P2'] };
const refs = { P1: { id: 'p1' }, P2: { id: 'p2' } };
const queue = (items, extra = {}) => ({ name: 'what_needs_me', success: true, data: { items, count: 50 }, ...extra });

test('queue prerequisite uses the retained tool items, including clipping and repeated reads', () => {
	assert.equal(retainedQueueSkipReason(task, [{ trace: [queue([{ id: 'p1' }, { id: 'p2' }])] }], refs), null);
	assert.match(retainedQueueSkipReason(task, [{ trace: [queue([{ id: 'p1' }, '… 49 more not shown'])] }], refs), /P2 absent from the model-retained/);
	assert.equal(retainedQueueSkipReason(task, [{ trace: [queue([{ id: 'p1' }]), queue([{ id: 'p2' }])] }], refs), null);
	assert.equal(retainedQueueSkipReason({}, [{ trace: [queue([])] }], refs), null);
});

test('missing or failed queue tools and successful writes cannot hide behind an unmet prerequisite', () => {
	assert.equal(retainedQueueSkipReason(task, [{ trace: [] }], refs), null);
	assert.equal(retainedQueueSkipReason(task, [{ trace: [queue([], { success: false })] }], refs), null);
	assert.equal(retainedQueueSkipReason(task, [{ trace: [queue([]), { name: 'create_proposal', success: true }] }], refs), null);
	assert.equal(retainedQueueSkipReason(task, [{ trace: [queue([])] }], refs, [{ ok: false, check: '!consent(P2)' }]), null);
});

test('non-prefix mutations and unknown tools fail nowrite and cannot produce a queue skip', () => {
	for (const name of ['publish_share_need', 'respond_to_share_need', 'approve_collaboration', 'end_collaboration', 'cosign_emergency', 'respond_to_health_audit', 'review_collaboration', 'move_member', 'future_action', 'get_unreviewed_future']) {
		const turns = [{ text: 'Done.', trace: [queue([]), { name, success: true }] }];
		assert.equal(retainedQueueSkipReason(task, turns, refs), null, name);
		assert.equal(evaluateReply(parseCheck('nowrite'), turns).ok, false, name);
	}
	for (const name of ['get_proposal', 'what_needs_me', 'explain_status', 'find_shares_needs', 'get_governance_health']) {
		const turns = [{ text: 'Here is the result.', trace: [queue([]), { name, success: true }] }];
		assert.match(retainedQueueSkipReason(task, turns, refs), /queue precondition/, name);
		assert.equal(evaluateReply(parseCheck('nowrite'), turns).ok, true, name);
	}
	const refused = [{ text: 'I cannot do that.', trace: [queue([]), { name: 'publish_share_need', success: false }] }];
	assert.match(retainedQueueSkipReason(task, refused, refs), /queue precondition/);
	assert.equal(evaluateReply(parseCheck('nowrite'), refused).ok, true);
});

test('unknown queue fixture prerequisites are refused before the runner touches the stack', () => {
	const candidate = { id: 'R2', category: 'read', persona: 'ana', turns: ['What needs me?'], fixtures: { P1: {} }, requiresRetainedQueue: ['P9'] };
	assert.match(validateTasks([candidate], ['qa-agent-ana']).join(' '), /requiresRetainedQueue names no fixture P9/);
	assert.match(validateTasks([{ ...candidate, requiresRetainedQueue: 'P1' }], ['qa-agent-ana']).join(' '), /must name at least one fixture/);
});

test('R1 accepts equivalent progress wording while rejecting different round counts', () => {
	const check = parseCheck(tasks.find((entry) => entry.id === 'R1').reply.find((source) => source.startsWith('says(')));
	for (const text of ['1 of 2 advice rounds have advice.', 'One of two rounds is done.', 'The proposal needs **2 advice rounds**, and so far only **1 round** has happened.']) {
		assert.equal(evaluateReply(check, [{ text, trace: [] }]).ok, true, text);
	}
	for (const text of ['The proposal needs 2 advice rounds, and only 2 rounds are done.', 'The proposal needs 3 advice rounds, and only 1 round has happened.', 'Nothing has happened yet.']) {
		assert.equal(evaluateReply(check, [{ text, trace: [] }]).ok, false, text);
	}
});

test('record-specific read tasks supply the intended record instead of relying on unrelated seeded matches', () => {
	assert.equal(tasks.find((entry) => entry.id === 'R4').page, '/proposals/{P1.id}');
	assert.match(tasks.find((entry) => entry.id === 'R5').turns[0], /\{D1\.title\}/);
	assert.ok(tasks.find((entry) => entry.id === 'R2').reply.includes('call(what_needs_me)'));
});
