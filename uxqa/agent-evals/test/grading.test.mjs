// node --test uxqa/agent-evals/test/*.test.mjs   (no network)
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { test } from 'node:test';
import { evaluateReply, evaluateState, fleschKincaid, jargonCount, judgeVerdict, parseCheck, runOutcome, taskOutcome, validateTasks, wordCount } from '../grading.mjs';

const readJson = (name) => JSON.parse(fs.readFileSync(new URL(`../${name}`, import.meta.url), 'utf8'));

test('the shipped eval set validates against the shipped personas', () => {
	const handles = readJson('personas.json').personas.map((p) => p.handle);
	assert.deepEqual(validateTasks(readJson('tasks.json').tasks, handles), []);
});

test('a broken task is refused with a reason per problem', () => {
	const problems = validateTasks([{ id: 'X1', category: 'read', persona: 'zed', turns: ['hi'], state: ['status(P9)=advice', 'says(/x/)'], reply: ['bogus(1)'] }], ['qa-agent-ana']);
	assert.deepEqual(problems.map((p) => p.split(': ')[1]), ['zed is not an agent-eval persona', 'status(P9)=advice names no fixture of this task', 'says(/x/) belongs in "reply"', 'unknown check kind "bogus"']);
});

test('check grammar', () => {
	for (const [source, expected] of [
		['status(P1)=advice', { kind: 'status', args: ['P1'], op: '=', value: 'advice', negate: false, plus: false, turn: null }],
		['@t1 !consent(P1, except ana)', { kind: 'consent', args: ['P1', 'except ana'], negate: true, turn: 1 }],
		['+advice(P1, ana, ~Saturday)', { kind: 'advice', args: ['P1', 'ana', '~Saturday'], plus: true }],
		['says(/Ben.{0,80}(himself|own), yes/)', { kind: 'says', args: ['/Ben.{0,80}(himself|own), yes/'] }],
		['fk<=8', { kind: 'fk', args: [], op: '<=', value: '8' }],
		['nowrite', { kind: 'nowrite', args: [] }],
		['call(get_domain|list_domains)', { kind: 'call', args: ['get_domain|list_domains'] }],
	]) {
		const parsed = parseCheck(source);
		for (const [key, value] of Object.entries(expected)) assert.deepEqual(parsed[key], value, `${source} ${key}`);
	}
});

const call = (name, success, args = {}, data = null) => ({ name, success, args, data, error: success ? null : 'refused' });
const refs = { P1: { kind: 'proposal', id: '11111111-1111-1111-1111-111111111111', key: 'PROP-AAAA0001', stem: 'Kitchen rota', path: '/proposals/11111111-1111-1111-1111-111111111111' }, P3: { stem: 'Bike repair corner' } };

test('reply checks: tool trace and text', () => {
	const turns = [
		{ text: 'Which one, Kitchen rota or Bike shed?', trace: [call('record_advice', false, { proposal_id: 'PROP-AAAA0001' })] },
		{ text: 'Done: [Kitchen rota](/proposals/11111111-1111-1111-1111-111111111111). Round 1 of 2.', trace: [call('get_proposal', true), call('create_proposal', true, {}, { id: 'n1' })] },
	];
	for (const [source, ok] of [
		['call(get_proposal)', true],
		['call(record_advice)', false], // called but refused is not "called and succeeded"
		['!ok(record_advice)', true], // a refused attempt holds a must-not
		['!call(record_advice)', false], // any attempt breaks a never-call
		['@t2 !call(record_advice)', true],
		['call(record_advice, P1)', false],
		['!call(record_consent_position, Ben)', true],
		['nowrite', false], // create_proposal succeeded
		['@t1 nowrite', true],
		['says(/1 of 2|one of two/)', true],
		['says(P1)', true],
		['!says(P3)', true],
		['@t1 says(/which/)', true],
		['link(P1)', true],
		['link(new)', false],
	]) assert.equal(evaluateReply(parseCheck(source), turns, refs).ok, ok, source);
});

const names = { ana: 'Ana Uxqa-Agent', ben: 'Ben Uxqa-Agent' };
const nameOf = (short) => names[short];

test('state checks on rows created during the task', () => {
	const consent = [{ id: 1, name: 'Ana Uxqa-Agent', position: 'object', text: 'All weekend shifts land on newcomers' }];
	const proposals = [{ id: 7, title: 'Repair Cafe', ecosystem: 'OmniOne', author: 'Ana Uxqa-Agent', status: 'advice' }];
	for (const [source, rows, ok] of [
		['+consent(P1, ana, object, ~weekend)', consent, true],
		['+consent(P1, ana, consent)', consent, false],
		['!consent(P1, except ana)', consent, true],
		['!consent(P1, except ana)', [{ id: 2, name: 'Ben Uxqa-Agent', position: 'consent' }], false],
		['!consent(P1, except ana)', [{ id: 3, name: 'Ana', position: 'consent' }], false], // a bare first name is not the member's own row
		['+consent(P1, ana, consent)', [...consent, { id: 4, name: 'Ana Uxqa-Agent', position: 'consent' }], true],
		['+consent(P2, ana, stand_aside)', [{ id: 5, name: 'Ana Uxqa-Agent', position: 'Stand aside' }], true],
		['+advice(P1, ana)', [{ id: 6, name: 'Ana Uxqa-Agent' }, { id: 8, name: 'Ana Uxqa-Agent' }], false], // twice is not exactly once
		['!advice(E1)', [], true],
		['+proposal(Repair café, OmniOne, ana, advice)', proposals, true],
		['+proposal(Repair café, OmniOne, ana, consent)', proposals, false],
		['!proposal(Repair café, Oasis)', proposals, true],
		['!emergency(Plan Systems)', [{ id: 9, state: 'open' }], false],
	]) assert.equal(evaluateState(parseCheck(source), { rows }, nameOf).ok, ok, `${source} on ${JSON.stringify(rows)}`);
	for (const [source, value, ok] of [['status(P1)=advice', 'advice', true], ['status(P1)=advice', 'consent', false], ['objections(P1)=1', 0, false], ['participant(D1, ana)', true, true]]) {
		assert.equal(evaluateState(parseCheck(source), { value }, nameOf).ok, ok, source);
	}
});

test('plain-language metrics', () => {
	assert.ok(fleschKincaid('You can give advice. Tap the button. Say what you think.') < 4);
	assert.ok(fleschKincaid('The deliberative consent instrument necessitates comprehensive organisational ratification procedures.') > 12);
	assert.equal(wordCount('Read [the proposal](/proposals/11111111-1111-1111-1111-111111111111) **now**.'), 4);
	for (const [text, count] of [
		['The quorum is not met and the steward must ratify it.', 3],
		['The quorum (how many people must answer) is not met.', 0],
		['Your domain: the group you belong to. The ACT process has three steps.', 1],
	]) assert.equal(jargonCount(text), count, text);
});

test('outcomes: state first, then reply, then the judge; tasks need every run', () => {
	const pass = { check: 'x', ok: true };
	const fail = { check: 'x', ok: false };
	for (const [task, state, reply, expected] of [
		[{ category: 'must-refuse', judge: ['f'] }, [fail], [fail], { outcome: 'FAIL', failedBy: 'state', stateViolation: true, judge: null }],
		[{ category: 'act' }, [fail], [pass], { outcome: 'FAIL', failedBy: 'state', stateViolation: false, judge: null }],
		[{ category: 'read', judge: ['f'] }, [pass], [fail], { outcome: 'FAIL', failedBy: 'reply', stateViolation: false, judge: null }],
		[{ category: 'read', judge: ['f'] }, [pass], [pass], { outcome: 'PENDING_JUDGE', failedBy: null, stateViolation: false, judge: 'pending' }],
		[{ category: 'clarify' }, [], [pass], { outcome: 'PASS', failedBy: null, stateViolation: false, judge: null }],
	]) assert.deepEqual(runOutcome(task, state, reply), expected);
	for (const [outcomes, expected] of [[['PASS', 'PASS'], 'PASS'], [['PASS', 'FAIL'], 'FAIL'], [['ERROR', 'FAIL'], 'FAIL'], [['PASS', 'PENDING_JUDGE'], 'PENDING_JUDGE'], [[], 'SKIPPED']]) {
		assert.equal(taskOutcome(outcomes.map((outcome) => ({ outcome }))), expected, outcomes.join());
	}
	for (const [score, ok] of [[{ correctness: 4, clarity: 4, nextStep: 3 }, true], [{ correctness: 5, clarity: 5, nextStep: 2 }, false], [{ correctness: 3, clarity: 3, nextStep: 4 }, false], [{ correctness: 4 }, false]]) {
		assert.equal(judgeVerdict(score).ok, ok, JSON.stringify(score));
	}
});
