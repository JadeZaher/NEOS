import assert from 'node:assert/strict';
import { test } from 'node:test';
import { prepareActiveReadiness, readinessAnswers } from '../readiness.mjs';

const fields = [
	...['one', 'two', 'three'].map((name) => ({ name, type: 'boolean' })),
	{ name: 'note', type: 'comment' }, { name: 'choice', type: 'radiogroup', choices: [{ value: 'ready' }, { value: 'ask' }] },
];
const candidate = { is_published: true, survey_json: { pages: [{ elements: fields }] } };
const requirement = { id: 'quiz-1', title: 'Readiness', status: 'required', completion_mode: 'completion' };

test('non-graded readiness answers all five real fields; false remains a valid boolean', () => {
	const prepared = readinessAnswers(requirement, candidate);
	assert.deepEqual(Object.keys(prepared.answers).sort(), ['one', 'two', 'three', 'note', 'choice'].sort());
	assert.equal(prepared.answers.one, false);
	assert.equal(prepared.answers.two, false);
	assert.equal(prepared.answers.three, false);
	assert.equal(prepared.answers.choice, 'ready');
	assert.ok(prepared.answers.note.trim());
});

test('graded readiness never derives answers from an author DTO or missing fixture source', () => {
	const graded = { ...requirement, completion_mode: 'graded' };
	assert.throws(() => readinessAnswers(graded, candidate), /explicit vetted fixture answer source/);
	assert.throws(() => readinessAnswers(requirement, { ...candidate, survey_json: { elements: [{ name: 'one', type: 'boolean', correctAnswer: true }] } }), /grading keys/);
	assert.deepEqual(readinessAnswers(graded, candidate, { byQuizId: { 'quiz-1': { answers: { one: true }, source: 'vetted local fixture' } } }).answers, { one: true });
});

test('only existing active fixture memberships complete through the real submit contract', async () => {
	let completed = false;
	const posts = [];
	const client = { must: async (actor, method, route, body) => {
		if (route === '/api/v1/auth/me') return { ecosystems: [{ id: 'eco', name: 'Home', membership_status: actor === 'qa-agent-pending' ? 'pending_consent' : 'active' }] };
		if (route.endsWith('/join-gates')) return { join_gates: { required_quizzes: [{ ...requirement, status: completed ? 'completed' : 'required' }] } };
		if (route === '/api/v1/quizzes/quiz-1?candidate=1') return candidate;
		assert.equal(method, 'POST'); assert.equal(route, '/api/v1/quizzes/quiz-1/submit');
		posts.push({ actor, body }); completed = true;
		return { result: { id: 'result-1', completion_verified: true, is_passed: null } };
	} };
	const seed = (status = 'active', extra = {}) => ({ memberships: [{ ecosystem: 'Home', status }], ...extra });
	const evidence = await prepareActiveReadiness(client, [
		{ handle: 'qa-agent-active', seed: seed() }, { handle: 'qa-agent-pending', seed: seed('pending_consent') },
		{ handle: 'qa-agent-entry', seed: seed('active', { join_gate_test: true }) },
	]);
	assert.equal(posts.length, 1);
	assert.equal(posts[0].actor, 'qa-agent-active');
	assert.deepEqual(Object.keys(posts[0].body).sort(), ['survey_results', 'target_ecosystem_id']);
	assert.equal(posts[0].body.survey_results.one, false);
	assert.equal(evidence.find((entry) => entry.actor === 'qa-agent-active').completion_verified, true);
	assert.equal(evidence.filter((entry) => entry.status === 'preserved').length, 2);
	assert.doesNotMatch(JSON.stringify(evidence), /correctAnswer|survey_results/);
});

test('a claimed completion without server verification fails setup', async () => {
	const client = { must: async (_actor, method, route) => {
		if (route.endsWith('/me')) return { ecosystems: [{ id: 'eco', name: 'Home', membership_status: 'active' }] };
		if (route.endsWith('/join-gates')) return { join_gates: { required_quizzes: [requirement] } };
		if (method === 'POST') return { result: { completion_verified: false, is_passed: null } };
		return candidate;
	} };
	await assert.rejects(prepareActiveReadiness(client, [{ handle: 'qa-agent-active', seed: { memberships: [{ ecosystem: 'Home', status: 'active' }] } }]), /did not verify/);
});
