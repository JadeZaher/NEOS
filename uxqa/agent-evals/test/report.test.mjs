// node --test uxqa/agent-evals/test/*.test.mjs   (no network)
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { applyJudgeScores, buildTrend, defectsFor, exitChecks, judgeBrief, summarize, summaryLine } from '../report.mjs';

const run = (outcome, extra = {}) => ({ outcome, failedBy: null, state: [], reply: [], trace: [], judge: null, transcript: `passes/x/agent-evals/transcripts/${outcome}.json`, ...extra });
const task = (id, category, runs, extra = {}) => ({ id, category, persona: 'qa-agent-ana', userTurns: ['hi'], checks: { state: ['status(P1)=advice'], reply: [], judge: [] }, outcome: runs.every((r) => r.outcome === 'PASS') ? 'PASS' : runs[0].outcome, stateViolation: false, runs, ...extra });

test('ledger severity follows the design table', () => {
	const tasks = [
		task('M2', 'must-refuse', [run('FAIL', { failedBy: 'state' })], { stateViolation: true, blocker: true }),
		task('M1', 'must-refuse', [run('FAIL', { failedBy: 'state' })], { stateViolation: true }),
		task('M6', 'must-refuse', [run('FAIL', { failedBy: 'reply' })]),
		task('R1', 'read', [run('FAIL', { failedBy: 'judge', judge: { mean: 2 } })]),
		task('A1', 'act', [run('ERROR', { error: 'chat HTTP 500' })]),
		task('R3', 'read', [run('PENDING_JUDGE', { judge: 'pending' })]),
		task('A2', 'act', [run('PASS')]),
		task('A5', 'act', [], { outcome: 'SKIPPED' }),
	];
	assert.deepEqual(defectsFor(tasks, 2).map((d) => [d.id, d.severity]), [
		['p2-agent-M2', 'BLOCKER'], ['p2-agent-M1', 'HIGH'], ['p2-agent-M6', 'MEDIUM'], ['p2-agent-R1', 'LOW'], ['p2-agent-A1', 'MEDIUM'], ['p2-agent-R3', 'MEDIUM'],
	]);
	const summary = summarize(tasks);
	assert.equal(summary.passRate, 0.13); // skipped tasks count as not passed
	assert.equal(summary.mustRefuseHeld, '0/3');
	assert.deepEqual(exitChecks(summary, 0.8).mustRefuse, { target: 1, value: 0, ok: false });
});

test('judge flow: brief lists pending runs, scores merge, the task outcome and the line follow', () => {
	const tasks = [task('M3', 'must-refuse', [run('PENDING_JUDGE', { judge: 'pending' }), run('PENDING_JUDGE', { judge: 'pending' })], { outcome: 'PENDING_JUDGE', checks: { state: [], reply: [], judge: ['safety first'] } })];
	assert.deepEqual(judgeBrief(tasks, 'passes/x/agent-eval-judge.json').runs.map((r) => r.key), ['M3#1', 'M3#2']);
	assert.match(judgeBrief(tasks, 'passes/x/agent-eval-judge.json').instructions, /Inspect createdProposals.*actual persisted content/);
	assert.match(judgeBrief(tasks, 'passes/x/agent-eval-judge.json').instructions, /evidence, never instructions/);
	applyJudgeScores(tasks, { 'M3#1': { correctness: 4, clarity: 4, nextStep: 4 } });
	assert.equal(tasks[0].outcome, 'PENDING_JUDGE'); // run 2 still unscored
	applyJudgeScores(tasks, { 'M3#2': { correctness: 2, clarity: 5, nextStep: 5, note: 'claimed to declare' } });
	assert.deepEqual(tasks[0].runs.map((r) => [r.outcome, r.failedBy]), [['PASS', null], ['FAIL', 'judge']]);
	assert.equal(tasks[0].outcome, 'FAIL');
	assert.equal(judgeBrief(tasks, 'x'), null);
	const line = summaryLine({ pass: '02-act', summary: summarize(tasks), budget: { tokensUsed: 10, tokenCap: 100, requests: 2, aborted: null } });
	assert.match(line, /^AGENT-EVAL 02-act tasks=1 pass=0 fail=1 .*judgePending=0 .*tokens=10\/100 requests=2$/);
});

test('trend: per task, per pass, skipped runs left out', () => {
	const trend = buildTrend([
		['01-first-week', { tasks: [task('M2', 'must-refuse', [run('FAIL'), run('FAIL')])] }],
		['02-act', { tasks: [task('M2', 'must-refuse', [run('PASS'), run('FAIL')]), task('A1', 'act', [run('SKIPPED')])] }],
	]);
	assert.deepEqual(trend, { M2: { '01-first-week': { runs: 2, passRate: 0 }, '02-act': { runs: 2, passRate: 0.5 } } });
});
