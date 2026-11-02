// Capability evidence only; use dedicated *-probe fixtures, never a UI pass's state.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { assertLocal, createClient } from '../agent-evals/neos-api.mjs';

const study = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pass = process.argv[2];
if (!/^\d{2}-[a-z0-9-]+-probe$/.test(pass || '')) throw new Error('REFUSED dedicated *-probe pass required');
const base = process.env.UXQA_BASE_URL || 'http://localhost:8000';
assertLocal(base);
const fixtures = JSON.parse(fs.readFileSync(path.join(study, 'passes', pass, 'prebake.json'), 'utf8'));
if (fixtures.status !== 'PREPARED' || fixtures.guards?.database !== 'neos_uxqa') throw new Error('REFUSED unprepared fixtures');
const sessions = JSON.parse(fs.readFileSync(path.join(study, '.secrets', 'sessions.json'), 'utf8'));
const client = createClient(base, new Map(sessions.filter(entry => entry.cookie).map(entry => [entry.handle, entry.cookie])));
for (const handle of ['qa-node-support', 'qa-member-oren', 'qa-new-rafi', 'qa-new-priya', 'qa-new-joy', 'qa-new-tomas', 'qa-probe-tess']) {
  if (!sessions.some(entry => entry.handle === handle && entry.cookie)) throw new Error(`REFUSED missing signed-in fixture ${handle}`);
}
const operator = 'qa-node-support';
const sentinel = await client.must('qa-member-oren', 'GET', '/api/v1/settings/?key=uxqa_environment');
if (sentinel?.value?.db !== 'neos_uxqa') throw new Error('REFUSED running database mismatch');
const admin = await client.must(operator, 'GET', '/api/v1/auth/me');
if (!admin.is_node_admin || admin.member !== null) throw new Error('REFUSED explicit memberless operator required');
const id = key => {
  const value = fixtures.fixtures[key]?.id;
  if (!value) throw new Error(`Missing fixture ${key}`);
  return value;
};
const eco = id('gatedEcosystem');
const options = { scopeIds: [eco] };
const results = [];
const artifact = path.join(study, 'passes', pass, 'entry-capability.json');
if (fs.existsSync(artifact)) throw new Error('REFUSED existing results; preserve the failed run and use a new dedicated pass');
const report = { pass, kind: 'API_CAPABILITY_ONLY', created_at: new Date().toISOString(), results };
const save = () => fs.writeFileSync(artifact, JSON.stringify(report, null, 2) + '\n');
async function check(name, operation) {
  try {
    await operation();
    results.push({ name, outcome: 'PASS' });
  } catch (error) {
    results.push({ name, outcome: 'FAIL', detail: String(error.message).slice(0, 500) });
  }
  save();
  console.log(`ENTRY-PROBE ${name} ${results.at(-1).outcome}`);
}
async function join(handle, ecosystem = eco) {
  return client.must(handle, 'POST', `/api/v1/ecosystems/${ecosystem}/join`, {}, { scopeIds: [ecosystem] });
}
async function gates(handle, type = 'ecosystems', target = eco) {
  return (await client.must(handle, 'GET', `/api/v1/${type}/${target}/join-gates`, undefined,
    { scopeIds: [type === 'ecosystems' ? target : eco] })).join_gates;
}
async function scopedMember(userId, ecosystem = eco) {
  const matches = [];
  for (let page = 1; page <= 100; page += 1) {
    const result = await client.must(operator, 'GET', `/api/v1/node-admin/resources/members?organization_id=${encodeURIComponent(ecosystem)}&per_page=100&page=${page}`);
    matches.push(...result.items.filter(row => row.user_id === userId));
    if (page * result.per_page >= result.total) {
      assert.equal(matches.length, 1, 'Expected exactly one target-ecosystem membership for the actual User');
      return matches[0];
    }
  }
  throw new Error('Membership observation exceeded its bounded scoped inventory');
}
async function membership(handle, ecosystem = eco) {
  const actual = await client.must(handle, 'GET', '/api/v1/auth/me', undefined, { scopeIds: [ecosystem] });
  assert.ok(actual.user?.id, 'Membership observations require the authenticated actual User');
  const summary = actual.ecosystems?.find(row => row.id === ecosystem);
  if (typeof summary?.membership_status === 'string') return { current_status: summary.membership_status };
  if (actual.member?.ecosystem_id === ecosystem) return actual.member;
  return scopedMember(actual.user.id, ecosystem);
}
async function answer(handle, quiz, value = 'ask') {
  return client.must(handle, 'POST', `/api/v1/quizzes/${quiz}/submit`, { survey_results: { tool_rule: value }, time_spent: 3 }, options);
}
async function consent(handle) {
  return client.must(handle, 'POST', `/api/v1/agreements/${id('membershipAgreement')}/consent`,
    { attestation: `I read and accept this synthetic ${fixtures.marker} agreement.` }, options);
}
const noKeys = value => {
  if (Array.isArray(value)) return value.every(noKeys);
  if (value && typeof value === 'object') return Object.entries(value).every(([key, child]) => !/correctanswer|answerkey|correctexpression/i.test(key) && noKeys(child));
  return true;
};

await check('unconfigured-entry-is-active', async () => {
  assert.equal((await join('qa-new-rafi', id('openEcosystem'))).membership_status, 'active');
});
await check('nongraded-checklist-is-a-real-completion-gate', async () => {
  const joined = await join('qa-new-priya', id('completionEcosystem'));
  assert.equal(joined.membership_status, 'pending_consent');
  assert.equal(joined.join_gates.required_quizzes[0].completion_mode, 'completion');
});
await check('forged-completion-flag-cannot-complete-checklist', async () => {
  const reply = await client.call('qa-new-priya', 'POST', `/api/v1/quizzes/${id('completionQuiz')}/submit`,
    { survey_results: {}, completion_verified: true }, { scopeIds: [id('completionEcosystem')] });
  assert.equal(reply.status, 400);
  assert.equal((await membership('qa-new-priya', id('completionEcosystem'))).current_status, 'pending_consent');
});
await check('incomplete-checklist-does-not-authorize-entry', async () => {
  await client.call('qa-new-priya', 'POST', `/api/v1/quizzes/${id('completionQuiz')}/submit`,
    { survey_results: { read_agreements: false } }, { scopeIds: [id('completionEcosystem')] });
  assert.equal((await membership('qa-new-priya', id('completionEcosystem'))).current_status, 'pending_consent');
});
await check('valid-false-preference-answers-complete-without-a-pass', async () => {
  const result = await client.must('qa-new-priya', 'POST', `/api/v1/quizzes/${id('completionQuiz')}/submit`, {
    survey_results: { read_agreements: false, understand_consent: false, know_steward: false,
      expectations: 'I want to learn how shared decisions work.', commitment: '1-2 hours' },
  }, { scopeIds: [id('completionEcosystem')] });
  assert.equal(result.result.completion_verified, true);
  assert.equal(result.result.is_passed, null);
  assert.equal((await membership('qa-new-priya', id('completionEcosystem'))).current_status, 'active');
  assert.equal((await gates('qa-new-priya', 'ecosystems', id('completionEcosystem'))).required_quizzes[0].status, 'completed');
});
await check('configured-entry-is-pending', async () => {
  const joined = await join('qa-new-joy');
  assert.equal(joined.membership_status, 'pending_consent');
  assert.equal(joined.join_gates.status, 'quiz_required');
  assert.equal(joined.join_gates.required_quizzes.length, 1);
});
await check('candidate-quiz-hides-keys', async () => {
  const quiz = await client.must('qa-new-joy', 'GET', `/api/v1/quizzes/${id('gatedQuiz')}`, undefined, options);
  assert.equal(noKeys(quiz), true);
  assert.equal(quiz.survey_json.elements[0].name, 'tool_rule');
});
await check('forged-score-and-identity-are-rejected', async () => {
  for (const forged of [{ score: 100 }, { is_passed: true }, { member_id: admin.user.id }, { graded_fingerprint: 'forged' }]) {
    const reply = await client.call('qa-new-joy', 'POST', `/api/v1/quizzes/${id('gatedQuiz')}/submit`,
      { survey_results: { tool_rule: 'take' }, ...forged }, options);
    assert.equal(reply.status, 400);
  }
});
await check('wrong-answer-does-not-pass', async () => {
  const reply = await answer('qa-new-joy', id('gatedQuiz'), 'take');
  assert.equal(reply.result.is_passed, false);
  assert.equal((await gates('qa-new-joy')).eligible, false);
});
await check('quiz-before-consent-remains-pending', async () => {
  assert.equal((await answer('qa-new-joy', id('gatedQuiz'))).result.is_passed, true);
  assert.equal((await gates('qa-new-joy')).status, 'agreement_consent_required');
  assert.equal((await membership('qa-new-joy')).current_status, 'pending_consent');
});
await check('quiz-then-consent-activates', async () => {
  await consent('qa-new-joy');
  assert.equal((await membership('qa-new-joy')).current_status, 'active');
});
await check('consent-before-quiz-does-not-activate', async () => {
  await join('qa-new-tomas');
  await consent('qa-new-tomas');
  assert.equal((await membership('qa-new-tomas')).current_status, 'pending_consent');
  assert.equal((await gates('qa-new-tomas')).status, 'quiz_required');
});
await check('consent-then-quiz-activates', async () => {
  await answer('qa-new-tomas', id('gatedQuiz'));
  assert.equal((await membership('qa-new-tomas')).current_status, 'active');
});
await check('unpublished-configured-quiz-fails-closed', async () => {
  const joined = await join('qa-probe-tess', id('unavailableEcosystem'));
  assert.equal(joined.membership_status, 'pending_consent');
  assert.equal(joined.join_gates.status, 'quiz_unavailable');
  const reply = await client.call('qa-probe-tess', 'GET', `/api/v1/quizzes/${id('unavailableQuiz')}`);
  assert.equal(reply.status, 404);
});
await check('domain-requires-parent-and-target-quizzes', async () => {
  const gate = await gates('qa-new-joy', 'domains', id('childDomain'));
  assert.deepEqual(new Set(gate.required_quizzes.filter(row => row.status === 'required').map(row => row.id)), new Set([id('parentQuiz'), id('childQuiz')]));
  assert.equal((await client.call('qa-new-joy', 'POST', `/api/v1/domains/${id('childDomain')}/participation`, {}, options)).status, 409);
});
await check('parent-only-pass-does-not-authorize-child', async () => {
  await answer('qa-new-joy', id('parentQuiz'));
  assert.equal((await client.call('qa-new-joy', 'POST', `/api/v1/domains/${id('childDomain')}/participation`, {}, options)).status, 409);
});
await check('all-domain-passes-authorize-participation', async () => {
  await answer('qa-new-joy', id('childQuiz'));
  const reply = await client.call('qa-new-joy', 'POST', `/api/v1/domains/${id('childDomain')}/participation`, {}, options);
  assert.ok(reply.status >= 200 && reply.status < 300);
});
await check('domain-passes-do-not-authorize-team', async () => {
  assert.equal((await client.call('qa-new-joy', 'POST', `/api/v1/teams/${id('team')}/join`, {}, options)).status, 409);
  await answer('qa-new-joy', id('teamQuiz'));
  const reply = await client.call('qa-new-joy', 'POST', `/api/v1/teams/${id('team')}/join`, {}, options);
  assert.ok(reply.status >= 200 && reply.status < 300);
});
await check('changed-quiz-invalidates-old-pass-for-new-participation', async () => {
  const inspected = await client.must(operator, 'POST', '/api/v1/node-admin/inspect', {
    resource_type: 'quizzes', resource_id: id('gatedQuiz'), reason: 'Agent testing',
  });
  const definition = structuredClone(inspected.resource.survey_json);
  definition.elements[0].choices.push({ value: 'check', text: 'Check with the group using the updated rule' });
  definition.elements[0].correctAnswer = 'check';
  await client.must(operator, 'POST', '/api/v1/node-admin/commands', { action: 'update', resource_type: 'quizzes',
    resource_id: id('gatedQuiz'), organization_id: eco, reason: 'Agent testing', expected_version: inspected.resource.version,
    values: { survey_json: definition } });
  const gate = await gates('qa-new-tomas', 'domains', id('parentDomain'));
  assert.equal(gate.required_quizzes.find(row => row.id === id('gatedQuiz')).status, 'required');
  assert.equal((await client.call('qa-new-tomas', 'POST', `/api/v1/domains/${id('parentDomain')}/participation`, {}, options)).status, 409);
  assert.equal((await answer('qa-new-tomas', id('gatedQuiz'), 'ask')).result.is_passed, false);
  assert.equal((await answer('qa-new-tomas', id('gatedQuiz'), 'check')).result.is_passed, true);
});
await check('quiz-change-does-not-demote-existing-membership-or-participation', async () => {
  assert.equal((await membership('qa-new-joy')).current_status, 'active');
  const reply = await client.call('qa-new-joy', 'POST', `/api/v1/domains/${id('childDomain')}/participation`, {}, options);
  assert.ok(reply.status >= 200 && reply.status < 300);
});

const oren = await client.must('qa-member-oren', 'GET', '/api/v1/auth/me');
if (!oren.is_node_admin || !oren.user?.id) throw new Error('REFUSED explicit Oren assignment drift');
await check('node-admin-bypasses-only-quizzes', async () => {
  const joined = await join('qa-member-oren');
  assert.equal(joined.join_gates.quiz_bypass.applied, true);
  assert.ok(joined.join_gates.required_quizzes.every(row => row.status === 'bypassed'));
  assert.equal(joined.membership_status, 'pending_consent');
  await consent('qa-member-oren');
  assert.equal((await membership('qa-member-oren')).current_status, 'active');
});
await check('admin-exemption-does-not-fabricate-attempts', async () => {
  const member = await scopedMember(oren.user.id);
  const attempts = await client.must(operator, 'GET', `/api/v1/node-admin/resources/quiz_results?q=${encodeURIComponent(member.id)}`);
  assert.equal(attempts.total, 0);
});
let revoked = false;
try {
  await check('revoked-builder-loses-quiz-exemption', async () => {
    await client.must(operator, 'POST', `/api/v1/node-admin/admins/${oren.user.id}/revoke`, { reason: 'Agent testing' });
    revoked = true;
    const gate = await gates('qa-member-oren', 'domains', id('childDomain'));
    assert.equal(gate.quiz_bypass.applied, false);
    assert.equal(gate.status, 'quiz_required');
    assert.equal((await client.call('qa-member-oren', 'POST', `/api/v1/domains/${id('childDomain')}/participation`, {}, options)).status, 409);
  });
} finally {
  if (revoked) await client.must(operator, 'POST', '/api/v1/node-admin/admins', { user_id: oren.user.id, reason: 'Agent testing' });
}
await check('quiz-bypass-is-public-and-utc', async () => {
  const audit = await client.must(operator, 'GET', `/api/v1/node-admin/audit?organization_id=${eco}&actor_user_id=${oren.user.id}&per_page=100`);
  assert.ok(audit.items.some(row => row.action === 'join_quiz_bypass'));
  assert.ok(audit.items.every(row => /Z$/.test(row.created_at) && Number.isFinite(Date.parse(row.created_at))));
});
report.summary = { passed: results.filter(row => row.outcome === 'PASS').length,
  failed: results.filter(row => row.outcome === 'FAIL').length, ui_success_count: 0 };
save();
console.log(`ENTRY-PROBE ${pass} passed=${report.summary.passed} failed=${report.summary.failed} UI=0`);
process.exitCode = report.summary.failed ? 1 : 0;
