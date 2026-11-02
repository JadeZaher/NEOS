// Coordinator-only API fixtures; see adapter/AGENTS.md, Completion fixtures.
import fs from 'node:fs';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { assertLocal, createClient } from '../agent-evals/neos-api.mjs';

const study = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pass = process.argv[2] || '06-safety-integrity';
if (!/^\d{2}-[a-z0-9-]+$/.test(pass)) throw new Error('REFUSED invalid pass');
const base = process.env.UXQA_BASE_URL || 'http://localhost:8000';
assertLocal(base);
if (!['http:', 'https:'].includes(new URL(base).protocol)) throw new Error('REFUSED invalid protocol');
const entries = JSON.parse(fs.readFileSync(path.join(study, '.secrets', 'sessions.json'), 'utf8'));
const cookies = new Map(entries.filter(entry => entry.cookie).map(entry => [entry.handle, entry.cookie]));
for (const handle of ['qa-node-support', 'qa-member-oren', 'qa-steward-amara', 'qa-member-ines', 'qa-probe-tess', 'qa-new-tomas']) {
  if (!cookies.has(handle)) throw new Error(`REFUSED missing signed-in fixture ${handle}`);
}
const client = createClient(base, cookies);
const operator = 'qa-node-support';
const manifestFile = path.join(study, 'passes', pass, 'prebake.json');
if (fs.existsSync(manifestFile)) throw new Error('REFUSED existing prebake manifest; inspect/reuse it instead of silently reseeding');
const healthResponse = await fetch(base + '/api/v1/health', { signal: AbortSignal.timeout(10_000) });
const health = await healthResponse.json();
if (!healthResponse.ok || health.status !== 'healthy') throw new Error('REFUSED local health guard');
const sentinel = await client.must('qa-member-oren', 'GET', '/api/v1/settings/?key=uxqa_environment');
if (sentinel?.value?.db !== 'neos_uxqa') throw new Error('REFUSED exact local database sentinel');
const me = await client.must(operator, 'GET', '/api/v1/auth/me');
if (me.is_node_admin !== true || me.member !== null) throw new Error('REFUSED fixture operator must be explicitly assigned and memberless');

const marker = `uxqa-p${Number.parseInt(pass, 10)}-${randomBytes(4).toString('hex')}`;
const manifest = { pass, marker, created_at: new Date().toISOString(), status: 'PREPARING',
  guards: { host: new URL(base).hostname, database: 'neos_uxqa', operator: 'explicit-memberless-node-admin' },
  method: 'Actual audited support API creates synthetic test configuration; it does not prove governance ceremonies.',
  fixtures: {}, failures: [] };
fs.mkdirSync(path.dirname(manifestFile), { recursive: true });
const save = () => fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 2) + '\n');
save();

async function create(key, resourceType, values, organizationId) {
  const reply = await client.call(operator, 'POST', '/api/v1/node-admin/commands', {
    action: 'create', resource_type: resourceType, reason: 'Agent testing', values,
    ...(organizationId ? { organization_id: organizationId } : {}),
  });
  if (reply.status >= 300 || !reply.data?.resource?.id) {
    manifest.failures.push({ key, resource_type: resourceType, status: reply.status,
      message: String(reply.data?.error || 'No resource id returned').slice(0, 300) });
    save();
    throw new Error(`Fixture ${key} refused (${reply.status}); partial manifest preserved`);
  }
  manifest.fixtures[key] = { id: reply.data.resource.id, resource_type: resourceType,
    organization_id: organizationId || null, audit_id: reply.data.audit_id, audit_url: reply.data.audit_url,
    title: values.title || values.name || values.display_name || key };
  save();
  return reply.data.resource.id;
}

const quizDefinition = {
  title: 'Shared tool check',
  elements: [{ type: 'radiogroup', name: 'tool_rule', title: 'What do members do before using shared tools?',
    choices: [{ value: 'ask', text: 'Ask the group first' }, { value: 'take', text: 'Take tools without checking' }],
    correctAnswer: 'ask', isRequired: true }],
};

try {
  const scopes = {};
  for (const [key, label] of [['open', 'Open learning'], ['gated', 'Shared tools'], ['unavailable', 'Unpublished learning'], ['workflows', 'Operator workshop'], ['completion', 'Readiness checklist']]) {
    scopes[key] = await create(`${key}Ecosystem`, 'ecosystems', { name: `${label} (${marker})`, visibility: 'public', status: 'active',
      description: `Synthetic ${marker} learning fixture. Ask the group before using shared tools.` });
    manifest.fixtures[`${key}Ecosystem`].url = `/ecosystems/${scopes[key]}`;
    save();
  }
  for (const key of ['gated', 'unavailable']) {
    await create(`${key}Quiz`, 'quizzes', { ecosystem_id: scopes[key], title: `Shared tool entry check (${marker})`,
      description: 'Before using shared tools, ask the group first.', mode: 'standard', survey_json: quizDefinition,
      is_entry_quiz: true, is_published: key === 'gated', passing_score: 100, allow_retakes: true, visibility: 'public' }, scopes[key]);
  }
  await create('completionQuiz', 'quizzes', { ecosystem_id: scopes.completion, title: `Onboarding readiness (${marker})`,
    description: 'An honest learning checklist. There are no right-or-wrong preference answers.', mode: 'standard',
    survey_json: { pages: [{ name: 'readiness', elements: [
      { type: 'boolean', name: 'read_agreements', title: 'I have read the agreements.' },
      { type: 'boolean', name: 'understand_consent', title: 'I understand consent decisions.' },
      { type: 'boolean', name: 'know_steward', title: 'I know who can help me.' },
      { type: 'comment', name: 'expectations', title: 'What would you like to learn?' },
      { type: 'radiogroup', name: 'commitment', title: 'How much time would you like to offer?', choices: ['1-2 hours', '3-5 hours', '5-10 hours', '10+ hours'] },
    ] }] }, is_entry_quiz: true, is_published: true, allow_retakes: true, visibility: 'public' }, scopes.completion);
  const parent = await create('parentDomain', 'domains', { ecosystem_id: scopes.gated, domain_id: `DOM-PARENT-${marker}`,
    name: `Shared tools circle (${marker})`, purpose: 'Care for the shared tools.' }, scopes.gated);
  const child = await create('childDomain', 'domains', { ecosystem_id: scopes.gated, domain_id: `DOM-CHILD-${marker}`,
    name: `Tool repair circle (${marker})`, purpose: 'Repair tools safely.', parent_domain_id: parent }, scopes.gated);
  const team = await create('team', 'teams', { ecosystem_id: scopes.gated, name: `Tool care team (${marker})`, is_active: true }, scopes.gated);
  for (const [key, extra] of [['parent', { domain_id: parent }], ['child', { domain_id: child }], ['team', { team_id: team }]]) {
    await create(`${key}Quiz`, 'quizzes', { ecosystem_id: scopes.gated, ...extra, title: `${key} entry check (${marker})`,
      description: 'Ask the group before using shared tools.', mode: 'standard', survey_json: quizDefinition,
      is_entry_quiz: true, is_published: true, passing_score: 100, allow_retakes: true, visibility: 'public' }, scopes.gated);
  }
  await create('membershipAgreement', 'agreements', { ecosystem_id: scopes.gated, agreement_id: `AGR-${marker}`,
    type: 'organizational', title: `Shared tool membership agreement (${marker})`, status: 'active',
    text: 'Ask the group before using shared tools. Return tools safely and say when a tool needs repair.',
    requires_explicit_consent: true, prerequisite_scopes: ['ecosystem'], hierarchy_level: 'ecosystem' }, scopes.gated);
  for (const handle of ['qa-steward-amara', 'qa-member-ines', 'qa-probe-tess', 'qa-new-tomas']) {
    const identity = await client.must(handle, 'GET', '/api/v1/auth/me');
    if (!identity.user?.id) throw new Error(`REFUSED missing synthetic identity ${handle}`);
    const memberId = await create(`workflowMember-${handle}`, 'members', { ecosystem_id: scopes.workflows, user_id: identity.user.id,
      member_id: `MBR-${marker}-${handle}`, display_name: identity.user.display_name,
      current_status: 'active', role: handle === 'qa-steward-amara' ? 'mod' : 'user', profile: 'townhall' }, scopes.workflows);
    await create(`workflowAccess-${handle}`, 'ethos_user_access', { ecosystem_id: scopes.workflows, member_id: memberId,
      role_in_ethos: handle === 'qa-steward-amara' ? 'steward' : 'member', access_level: 'member' }, scopes.workflows);
  }
  const contractFields = ['key_responsibilities', 'customers', 'deliverables', 'dependencies', 'constraints', 'challenges',
    'resources', 'delegator_responsibilities', 'competencies', 'metrics', 'evaluation_schedule'];
  const governedDomain = await create('matchingDomain', 'domains', { ecosystem_id: scopes.workflows,
    domain_id: `DOM-MATCH-${marker}`, name: `Shared care contract (${marker})`, purpose: 'Care for tools through clear shared responsibilities.',
    elements: Object.fromEntries(contractFields.map(field => [field, `Documented ${field.replaceAll('_', ' ')} for synthetic ${marker} tool care.`])) }, scopes.workflows);
  const uaf = await create('uaf', 'agreements', { ecosystem_id: scopes.workflows, agreement_id: `UAF-${marker}`,
    title: `Shared care UAF (${marker})`, type: 'uaf', status: 'active', hierarchy_level: 'ecosystem',
    requires_explicit_consent: false, prerequisite_scopes: [],
    text: 'Shared care and access: participation is voluntary. Ask before using shared tools, care for them and discuss unclear responsibilities.' }, scopes.workflows);
  const weights = { agreements: 0.35, domains: 0.30, purpose: 0.20, practical: 0.15 };
  const configuration = { version: '1.0', algorithm_version: 'affinity-v1', weights,
    signals: Object.keys(weights).map(dimension => ({ id: `${dimension}_care`, dimension,
      label: `Can you support the published ${dimension} commitment for shared tool care?`, weight: 1,
      classification: dimension === 'agreements' ? 'non_negotiable' : 'discussion_required',
      source: { kind: dimension === 'domains' ? 'domain' : 'agreement', id: dimension === 'domains' ? governedDomain : uaf,
        version: '1.0', section: dimension === 'domains' ? 'Documented domain contract' : 'Shared care and access' } })) };
  await create('matchingPolicy', 'agreements', { ecosystem_id: scopes.workflows, agreement_id: `MATCH-${marker}`,
    title: `Governed matching policy (${marker})`, type: 'organizational', status: 'active', hierarchy_level: 'ecosystem',
    text: 'Use only the published shared-care commitments and declared optional answers. Unknown answers are not scored as incompatibility.',
    requires_explicit_consent: false, prerequisite_scopes: [], act_policy: { matching_profile: configuration } }, scopes.workflows);
  const ecosystemVersion = await client.must(operator, 'POST', '/api/v1/node-admin/inspect', {
    resource_type: 'ecosystems', resource_id: scopes.workflows, reason: 'Agent testing',
  });
  const linked = await client.must(operator, 'POST', '/api/v1/node-admin/commands', { action: 'update', resource_type: 'ecosystems',
    resource_id: scopes.workflows, reason: 'Agent testing', expected_version: ecosystemVersion.resource.version,
    values: { uaf_agreement_id: uaf } });
  manifest.fixtures.uafLink = { id: scopes.workflows, resource_type: 'ecosystems', audit_id: linked.audit_id, audit_url: linked.audit_url };
  const journeySlug = `tool-care-${marker}`;
  await create('orientationJourney', 'journey_maps', { ecosystem_id: scopes.workflows, slug: journeySlug,
    title: `Getting started with shared care (${marker})`, is_active: true, is_default: false, step_count: 2,
    content_sequence: [{ step: 1, type: 'confirmation', title: 'Shared care', description: 'Ask the group before using shared tools.',
      required: true, confirmation_label: 'I have read the shared-care introduction' },
    { step: 2, type: 'ai_conversation', title: 'Ask about shared care', description: 'Ask the orientation guide one question about this journey.',
      required: true, ai_prompt_template: 'Help the newcomer understand shared care in this journey.' }],
    exit_package: { docs: [{ title: 'Shared care UAF', url: `/agreements/${uaf}` }], next_steps: ['Choose the circle you want to help.'] } }, scopes.workflows);
  manifest.fixtures.orientationJourney.url = `/orientation/${scopes.workflows}`;
  manifest.fixtures.orientationJourney.journey_url = `/orientation/${scopes.workflows}/journey`;
  manifest.fixtures.orientationJourney.slug = journeySlug;
  await client.must('qa-probe-tess', 'PUT', `/api/v1/matching/ecosystems/${scopes.workflows}/consent`,
    { directory_visible: true, contact_discovery: true, matching_enabled: false }, { scopeIds: [scopes.workflows] });
  manifest.fixtures.directoryCandidate = { handle: 'qa-probe-tess', method: 'Explicit synthetic directory/contact opt-in through owner API; matching opt-in remains off' };
  manifest.status = 'PREPARED';
  save();
  console.log(`PREBAKE ${pass} prepared=${Object.keys(manifest.fixtures).length} failures=0 db=neos_uxqa`);
} catch (error) {
  manifest.status = 'FAILED_PARTIAL';
  if (!manifest.failures.length) manifest.failures.push({ phase: 'preparation', message: String(error.message).slice(0, 300) });
  save();
  throw error;
}
