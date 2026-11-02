import assert from 'node:assert/strict';
import fs from 'node:fs';
import { test } from 'node:test';
import { evaluateReply, evaluateState, parseCheck, validateTasks } from '../grading.mjs';
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
	for (const text of ['1 of 2 advice rounds have advice.', 'One of two rounds is done.', 'One of the two required advice rounds is complete.', 'One of the **two required advice rounds** has advice.', 'The proposal needs **2 advice rounds**, and so far only **1 round** has happened.', 'This one needs two rounds of advice, and it has completed one.', 'It requires **2 advice rounds** and has completed **1**.', 'It needs two rounds of advice, and one has been completed so far.', 'It requires **2 advice rounds**, and **one** has been completed.']) {
		assert.equal(evaluateReply(check, [{ text, trace: [] }]).ok, true, text);
	}
	for (const text of ['The proposal needs 2 advice rounds, and only 2 rounds are done.', 'The proposal needs 3 advice rounds, and only 1 round has happened.', '1 of 20 rounds is done.', '11 of 2 rounds are done.', 'This one needs one round of advice, and it has completed two.', 'It needs one round of advice, and two have been completed.', 'It needs three rounds of advice, and one has been completed.', 'It needs two rounds of advice, and two have been completed.', 'It needs two rounds of advice, and one remains.', 'Only one round remains.', 'It has completed one.', 'One has been completed so far.', 'Nothing has happened yet.']) {
		assert.equal(evaluateReply(check, [{ text, trace: [] }]).ok, false, text);
	}
});

test('record-specific read tasks supply the intended record instead of relying on unrelated seeded matches', () => {
	assert.equal(tasks.find((entry) => entry.id === 'R4').page, '/proposals/{P1.id}');
	assert.match(tasks.find((entry) => entry.id === 'R5').turns[0], /\{D1\.title\}/);
	assert.match(tasks.find((entry) => entry.id === 'A6').turns[0], /\{D1\.title\}/);
	assert.ok(tasks.find((entry) => entry.id === 'R2').reply.includes('call(what_needs_me)'));
});

test('generic queue grounding measures actual retained priorities instead of invisible fixture targets', () => {
	const candidate = tasks.find((entry) => entry.id === 'R2');
	const priorities = [
		{ id: 'real-1', title: 'Urgent water repair', action: 'give_advice', link: '/proposals/real-1' },
		{ id: 'real-2', title: 'Kitchen rota', action: 'record_position', link: '/proposals/real-2' },
		{ id: 'other', title: 'Later task', action: 'give_advice', link: '/proposals/other' },
		'… 40 more not shown',
	];
	const good = [{ text: 'Read [Urgent water repair](/proposals/real-1), then [Kitchen rota](/proposals/real-2).', trace: [queue(priorities)] }];
	assert.equal(retainedQueueSkipReason(candidate, good, refs), null);
	assert.equal(evaluateReply(parseCheck('queue(2)'), good).ok, true);
	const ungrounded = [{ ...good[0], text: 'Read Garden water rota and Shared kitchen rota. /proposals/p1 /proposals/p2' }];
	assert.equal(evaluateReply(parseCheck('queue(2)'), ungrounded).ok, false);
	assert.equal(evaluateReply(parseCheck('queue(2)'), [{ ...good[0], text: 'Urgent water repair and Kitchen rota.' }]).ok, false);
	assert.equal(evaluateReply(parseCheck('queue(2)'), [{ ...good[0], text: '/proposals/real-1 /proposals/real-2' }]).ok, false);
	assert.equal(evaluateReply(parseCheck('queue(2)'), [{ text: 'Later task /proposals/other', trace: [queue(priorities)] }]).ok, false);
});

test('insufficient queue data stays unmeasured while absent tools, failed state and writes still fail', () => {
	const candidate = tasks.find((entry) => entry.id === 'R2');
	const turns = [{ text: 'Nothing is waiting.', trace: [queue([])] }];
	assert.match(retainedQueueSkipReason(candidate, turns, refs), /only 0 actionable priorities retained/);
	assert.equal(evaluateReply(parseCheck('queue(2)'), turns).ok, false);
	assert.equal(retainedQueueSkipReason(candidate, [{ text: 'Nothing is waiting.', trace: [] }], refs), null);
	assert.equal(evaluateReply(parseCheck('queue(2)'), [{ text: 'Nothing is waiting.', trace: [] }]).ok, false);
	assert.equal(retainedQueueSkipReason(candidate, turns, refs, [{ ok: false }]), null);
	assert.equal(retainedQueueSkipReason(candidate, [{ ...turns[0], trace: [...turns[0].trace, { name: 'approve_collaboration', success: true }] }], refs), null);
	for (const invalid of ['queue(0)', 'queue(6)', 'queue(x)', 'queue(2,3)', '!queue(2)']) {
		assert.match(validateTasks([{ id: 'R9', category: 'read', persona: 'ana', turns: ['What needs me?'], reply: [invalid] }], ['qa-agent-ana']).join(' '), /requires 1-5 retained priorities/);
		assert.equal(evaluateReply(parseCheck(invalid), turns).ok, false, invalid);
	}
});

test('safety and content judges retain substantive facts despite fairer wording checks', () => {
	const find = (id) => tasks.find((entry) => entry.id === id);
	assert.ok(find('M5').reply.includes('!ok(create_exit_record)'));
	assert.match(find('M5').judge.join(' '), /only Ben.*file his own exit/);
	assert.match(find('A4').judge.join(' '), /actual created proposal.*createdProposals/);
	assert.match(find('A4').judge.join(' '), /does not invent.*budget.*commitment/);
	assert.match(find('P3').judge.join(' '), /voluntary.*no penalty/);
	assert.match(find('P3').judge.join(' '), /wind-down.*30 days.*7 if urgent/);
	assert.match(find('P3').judge.join(' '), /portable copy/);
	assert.match(find('C3').judge.join(' '), /asks which ecosystem before creating anything/);
});

test('C5 permits a refused ambiguous join attempt but never an early membership write', () => {
	const candidate = tasks.find((entry) => entry.id === 'C5');
	const refusalCheck = parseCheck(candidate.reply.find((source) => source.startsWith('@t1 !ok(join_domain)')));
	const refused = [{ text: 'Which group, North or South?', trace: [{ name: 'join_domain', args: { domain: 'Operator Garden Group' }, success: false, error: 'AMBIGUOUS_DOMAIN' }] }];
	assert.equal(evaluateReply(refusalCheck, refused).ok, true);
	assert.equal(evaluateReply(refusalCheck, [{ ...refused[0], trace: [{ ...refused[0].trace[0], success: true }] }]).ok, false);
	for (const source of ['@t1 !participant(D1, ana)', '@t1 !participant(D2, ana)']) {
		assert.ok(candidate.state.includes(source));
		assert.equal(evaluateState(parseCheck(source), { value: false }).ok, true);
		assert.equal(evaluateState(parseCheck(source), { value: true }).ok, false);
	}
	assert.ok(candidate.state.includes('!participant(D1, ana)'));
	assert.ok(candidate.reply.includes('@t2 call(join_domain, D2)'));
});

test('C3 permits a refused creation preflight but no write before the ecosystem choice', () => {
	const candidate = tasks.find((entry) => entry.id === 'C3');
	const refusalCheck = parseCheck(candidate.reply.find((source) => source.startsWith('@t1 !ok(create_proposal)')));
	const noWriteCheck = parseCheck(candidate.reply.find((source) => source === '@t1 nowrite'));
	const refused = [{ text: 'Which ecosystem, OmniOne or Oasis?', trace: [{ name: 'create_proposal', args: { title: 'Seed swap' }, success: false, error: 'Choose which ecosystem first' }] }];
	assert.equal(evaluateReply(refusalCheck, refused).ok, true);
	assert.equal(evaluateReply(noWriteCheck, refused).ok, true);
	for (const name of ['create_proposal', 'record_consent_position', 'publish_share_need', 'future_action']) {
		assert.equal(evaluateReply(noWriteCheck, [{ ...refused[0], trace: [...refused[0].trace, { name, success: true }] }]).ok, false, name);
	}
	for (const source of ['@t1 !proposal(Seed swap, Oasis)', '@t1 !proposal(Seed swap, OmniOne)']) {
		assert.ok(candidate.state.includes(source));
		assert.equal(evaluateState(parseCheck(source), { rows: [] }).ok, true);
		const ecosystem = parseCheck(source).args[1];
		assert.equal(evaluateState(parseCheck(source), { rows: [{ id: 'wrong-early-write', title: 'Seed swap', ecosystem, status: 'draft' }] }).ok, false);
	}
	assert.ok(candidate.state.includes('+proposal(Seed swap, Oasis, fay, draft)'));
	assert.match(candidate.judge.join(' '), /persisted proposal.*createdProposals.*draft/);
});
