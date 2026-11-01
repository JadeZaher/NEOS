// Builds the pass Workflow's args for pass N from study.md + the rotation below. See uxqa/adapter/AGENTS.md §Pass args.
// usage: node uxqa/adapter/pass-args.mjs <passNumber>   ->   uxqa/passes/<NN-slug>/args.json
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const PLUGIN_ROOT = process.env.UXQA_PLUGIN_ROOT || 'C:/Users/atooz/.claude/plugins/cache/local/ux-qa-research/0.1.0';
const forwardSlashes = (p) => p.replaceAll('\\', '/');
const STUDY_DIR = forwardSlashes(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'));
const REPO_ROOT = path.posix.dirname(STUDY_DIR);

// One scenario per pass, each read through four of the seven research lenses; every lens recurs within three passes.
const ROTATION = [
  { slug: 'first-week', name: "A newcomer's first week in OmniOne", lenses: ['service-designer', 'accessibility', 'learning-designer', 'content-designer'] },
  { slug: 'act-lifecycle', name: 'A proposal through advice, consent, test and ratification', lenses: ['domain-expert', 'frontline-worker', 'trust-behavioural', 'service-designer'] },
  { slug: 'cross-ecosystem-exchange', name: 'Joining, then sharing, needing and collaborating across ecosystems, kept healthy by stewards', lenses: ['accessibility', 'content-designer', 'learning-designer', 'domain-expert'] },
  { slug: 'safety-integrity', name: 'Conflict, emergency, exit and safeguards under stress', lenses: ['trust-behavioural', 'frontline-worker', 'accessibility', 'service-designer'] },
  { slug: 'stewardship', name: 'Stewarding an ecosystem: members, journeys and settings', lenses: ['domain-expert', 'content-designer', 'learning-designer', 'trust-behavioural'] },
];
const LANE_SHAPE = { castSize: 10, laneCount: 4, probeLanes: 1, maxFixLanes: 2, fix: true, seededFixes: [] };

const passId = (number) => `${String(number).padStart(2, '0')}-${ROTATION[number - 1].slug}`;
const passDir = (id) => `${STUDY_DIR}/passes/${id}`;
const fail = (reason) => { console.log(`REFUSED ${reason}`); process.exit(2); };

// The pass workflow re-checks only the prior FIX items, so only those travel (compact); the full ledger stays on disk.
function priorLedger(priorPass) {
  const file = priorPass && `${passDir(priorPass)}/ledger.json`;
  if (!file || !fs.existsSync(file)) return [];
  const entries = JSON.parse(fs.readFileSync(file, 'utf8')).entries || [];
  return entries.filter((entry) => entry.decision === 'FIX').map(({ id, title, severity, decision, status }) => ({ id, title, severity, decision, status }));
}

const passNumber = Number(process.argv[2]);
if (!Number.isInteger(passNumber) || passNumber < 1 || passNumber > ROTATION.length) fail(`pass number must be 1..${ROTATION.length}`);

const { slug, name, lenses } = ROTATION[passNumber - 1];
const pass = passId(passNumber);
const priorPass = passNumber > 1 ? passId(passNumber - 1) : null;
if (!fs.existsSync(`${passDir(pass)}/scenario.md`)) fail(`write ${pass}/scenario.md before building its args`);

const { loadStudy } = await import(pathToFileURL(`${PLUGIN_ROOT}/lib/study-config.mjs`).href);
const { config } = loadStudy(REPO_ROOT);
const goldTasks = JSON.parse(execFileSync('node', [`${PLUGIN_ROOT}/lib/gold-tasks.mjs`, 'list'], { cwd: REPO_ROOT, encoding: 'utf8' }));
const ledger = priorLedger(priorPass);

const args = {
  pass, passNumber, pluginRoot: PLUGIN_ROOT,
  scenario: { slug, name, brief: `Read the full brief, focus areas and carried questions in ${passDir(pass)}/scenario.md` },
  priorPass, priorLedger: ledger, deployedHash: null,
  ...LANE_SHAPE,
  study: {
    product: config.product, repoRoot: REPO_ROOT, studyDir: STUDY_DIR, baseUrl: config.baseUrl,
    guardDescription: 'GET /api/v1/health -> status == healthy (local host only); the adapter proves the running server reads neos_uxqa via a sentinel setting',
    adapterSeed: `bash ${STUDY_DIR}/adapter/adapter.sh seed {personas} {out}`, sessionsFile: `${REPO_ROOT}/${config.session.sessionsFile}`,
    goldTasks, marker: config.marker, lenses, extraRules: config.extraRules,
    fixRepo: null, testCommand: config.testCommand, typecheckCommand: config.typecheckCommand, buildCommand: config.buildCommand,
    baseRedFile: `${REPO_ROOT}/${config.baseRedFile}`,
    agentEvals: config.agentEvals || null, // turns on the plugin's AgentEval phase (see uxqa/agent-evals/AGENTS.md)
  },
};

const out = `${passDir(pass)}/args.json`;
fs.writeFileSync(out, JSON.stringify(args, null, 1));
console.log(`ARGS ${out} gold=${goldTasks.length} prior=${ledger.length} rules=${config.extraRules.length} lenses=${lenses.join(',')} agentEvals=${config.agentEvals ? 'on' : 'off'}`);
