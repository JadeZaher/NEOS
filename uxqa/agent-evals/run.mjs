// Agent-eval runner: fixed tasks against the real in-app assistant on the isolated local stack -> passes/<pass>/agent-eval.json.
// node uxqa/agent-evals/run.mjs <pass> [--only R1,M2] [--repeats N] [--token-cap N] [--base URL] [--dry-run]
// node uxqa/agent-evals/run.mjs <pass> --finalize        (merges agent-eval-judge.json)      Why: uxqa/agent-evals/AGENTS.md
// Exit: 0 ran (tasks may fail), 1 harness error, 2 refused, 3 aborted (configuration, availability, open emergency).
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createdIds, evaluateReply, evaluateState, isRowCheck, parseCheck, runOutcome, taskOutcome, validateTasks } from './grading.mjs';
import { applyJudgeScores, buildTrend, defectsFor, exitChecks, judgeBrief, RESULT_VERSION, summarize, summaryLine } from './report.mjs';
import { ACTIVE_EMERGENCY, assertLocal, buildFixtures, createClient, loadPeople, observe, stewardIn, teardown } from './neos-api.mjs';
import { retainedQueueSkipReason } from './preconditions.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PLUGIN_ROOT = process.env.UXQA_PLUGIN_ROOT || 'C:/Users/atooz/.claude/plugins/cache/local/ux-qa-research/0.1.0';
const ADAPTER = 'uxqa/adapter/adapter.sh';
const PERSONAS_FILE = 'uxqa/agent-evals/personas.json';
const SESSIONS_FILE = 'uxqa/.secrets/agent-sessions.json'; // read in-process only; never printed
const MAX_MINUTES = 30;
const DEFAULT_TOKEN_CAP = 1_500_000;
const DEFAULT_PAGE = '/dashboard';
const TRANSCRIPT_DATA_CHARS = 4000;

const refuse = (reason) => { console.log(`REFUSED ${reason}`); process.exit(2); };
const readJson = (file) => (fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : null);
class Abort extends Error {}

function parseArgs(argv) {
	const options = { pass: null, only: null, repeats: 1, tokenCap: null, base: null, dryRun: false, finalize: false };
	for (let i = 0; i < argv.length; i++) {
		const arg = argv[i];
		if (arg === '--only') options.only = String(argv[++i] || '').split(',').filter(Boolean);
		else if (arg === '--repeats') options.repeats = Number(argv[++i]);
		else if (arg === '--token-cap') options.tokenCap = Number(argv[++i]);
		else if (arg === '--base') options.base = argv[++i];
		else if (arg === '--dry-run') options.dryRun = true;
		else if (arg === '--finalize') options.finalize = true;
		else if (!options.pass && !arg.startsWith('--')) options.pass = arg;
		else refuse(`unknown argument ${arg}`);
	}
	if (!options.pass) refuse('usage: run.mjs <pass> [--only R1,M2] [--repeats N] [--token-cap N] [--base URL] [--dry-run | --finalize]');
	if (!(options.repeats >= 1)) refuse('--repeats must be 1 or more');
	return options;
}

const options = parseArgs(process.argv.slice(2));
const { loadStudy, listPasses } = await import(pathToFileURL(`${PLUGIN_ROOT}/lib/study-config.mjs`).href);
const study = loadStudy(HERE);
const passDir = study.passDir(options.pass);
if (!fs.existsSync(passDir)) refuse(`no pass directory for ${options.pass}`);
const pass = path.basename(passDir);
const passNumber = Number(pass.split('-')[0]);
const settings = study.config.agentEvals || {};
const resultName = settings.resultFile || 'agent-eval.json';
const resultFile = path.join(passDir, resultName);
const judgeFile = path.join(passDir, 'agent-eval-judge.json');
const studyPath = (file) => path.relative(study.studyDir, file).replaceAll('\\', '/');
const repoPath = (file) => path.relative(study.repoRoot, file).replaceAll('\\', '/');

/** Recomputes everything derived from tasks[] (summary, trend, exit checks, defects, judge brief) and writes the file. */
function writeResult(result) {
	result.summary = summarize(result.tasks);
	const earlier = listPasses(study).filter((p) => p < pass).map((p) => [p, readJson(path.join(study.studyDir, 'passes', p, resultName))]).filter(([, r]) => r);
	result.trend = buildTrend([...earlier, [pass, result]]);
	result.exitChecks = exitChecks(result.summary, study.config.targets.agentEvalPass ?? null);
	result.defects = defectsFor(result.tasks, passNumber);
	result.judgeBrief = judgeBrief(result.tasks, studyPath(judgeFile));
	fs.writeFileSync(resultFile, JSON.stringify(result, null, 1));
}

if (options.finalize) {
	const result = readJson(resultFile) || refuse(`no ${repoPath(resultFile)} to finalize`);
	applyJudgeScores(result.tasks, readJson(judgeFile) || {});
	writeResult(result);
	console.log(summaryLine(result, repoPath(resultFile)));
	process.exit(0);
}

// ---- load and validate the eval set (refuse before anything touches the stack) ----
const personas = readJson(path.join(HERE, 'personas.json')).personas;
const outsiders = personas.filter((p) => !/^qa-agent-[a-z]+$/.test(p.handle)).map((p) => p.handle);
if (outsiders.length) refuse(`personas.json has non-agent handles ${outsiders.join(', ')}`);
const allTasks = readJson(path.join(HERE, 'tasks.json'));
const problems = validateTasks(allTasks.tasks, personas.map((p) => p.handle));
if (problems.length) refuse(`tasks.json: ${problems[0]}${problems.length > 1 ? ` (+${problems.length - 1} more)` : ''}`);
const unknownIds = (options.only || []).filter((id) => !allTasks.tasks.some((t) => t.id === id));
if (unknownIds.length) refuse(`--only names unknown tasks ${unknownIds.join(', ')}`);
const chosen = allTasks.tasks.filter((t) => !options.only || options.only.includes(t.id));
const tasks = [...chosen.filter((t) => !t.dangerous), ...chosen.filter((t) => t.dangerous)]; // dangerous ones last

// ---- guards, seed, people ----
const baseUrl = (options.base || study.config.baseUrl).replace(/\/+$/, '');
try {
	assertLocal(baseUrl);
	const { assertTestTarget } = await import(pathToFileURL(`${PLUGIN_ROOT}/lib/guard.mjs`).href);
	await assertTestTarget(study);
} catch (error) {
	refuse(String(error.message || error).replace(/^REFUSED:?\s*/, ''));
}

const cookies = new Map();
/** Seeds the agent personas without study-wide resets (gold proposals stay); the adapter re-proves the sentinel DB. */
function seedPersonas() {
	const seeded = spawnSync('bash', [ADAPTER, 'seed', PERSONAS_FILE, SESSIONS_FILE, '--member-resets-only'], {
		cwd: study.repoRoot, encoding: 'utf8', env: { ...process.env, UXQA_BASE_URL: baseUrl }, stdio: ['ignore', 'pipe', 'ignore'],
	});
	const line = String(seeded.stdout || '').trim().split('\n').at(-1) || 'ERROR adapter printed nothing';
	if (!line.startsWith('SEEDED')) refuse(`seed: ${line}`);
	for (const entry of readJson(path.join(study.repoRoot, SESSIONS_FILE))) if (entry.cookie) cookies.set(entry.handle, entry.cookie);
	return line;
}
console.log(seedPersonas());
const client = createClient(baseUrl, cookies);
const people = await loadPeople(client, personas);
const ecosystemNames = new Map([...people.values()].flatMap((p) => Object.entries(p.ecosystems).map(([name, id]) => [id, name])));
const displayNameOf = (short) => people.get(`qa-agent-${short}`)?.name ?? short;

const marker = `${study.config.marker}-p${passNumber}`;
const runId = `r${crypto.randomBytes(2).toString('hex')}`;
const budget = { tokenCap: options.tokenCap || settings.tokenCap || DEFAULT_TOKEN_CAP, tokensUsed: 0, requests: 0, maxMinutes: MAX_MINUTES, aborted: null };
const startedAt = Date.now();
const transcriptDir = path.join(passDir, 'agent-evals', 'transcripts');
const fillRefs = (text, refs) => text.replace(/\{([A-Z]\d+)\.(\w+)\}/g, (whole, name, field) => refs[name]?.[field] ?? whole);
const fillStems = (text, task) => text.replace(/\{([A-Z]\d+)\.stem\}/g, (whole, name) => {
	const spec = task.fixtures?.[name];
	return spec ? spec.proposal || spec.domain || spec.agreement : whole;
});

// ---- preflight: an emergency already active where a task must not open one makes that task meaningless ----
const blocked = new Map(); // task id -> skip reason
for (const task of tasks) {
	for (const check of (task.state || []).map(parseCheck).filter((c) => c.kind === 'emergency')) {
		const steward = stewardIn(people, check.args[0]);
		const now = await client.must(steward.handle, 'GET', `/api/v1/emergency/?ecosystem_ids=${steward.ecosystems[check.args[0]]}&per_page=1`);
		if (ACTIVE_EMERGENCY.has(now.current?.state)) {
			blocked.set(task.id, `emergency already active in ${check.args[0]}`);
			console.log(`PREFLIGHT emergency already active in ${check.args[0]}: ${task.id} skipped`);
		}
	}
}

// ---- grading helpers bound to this run ----
async function snapshot(stateChecks, refs, task) {
	const baseline = new Map();
	const cache = new Map();
	for (const check of stateChecks.filter(isRowCheck)) {
		const { rows } = await observe(client, check, { refs, task, people, ecosystemNames, cache });
		baseline.set(check.source, new Set(rows.map((row) => row.id)));
	}
	return baseline;
}

async function gradeState(stateChecks, refs, task, baseline) {
	const cache = new Map();
	const results = [];
	for (const check of stateChecks) {
		const observation = await observe(client, check, { refs, task, people, ecosystemNames, cache });
		if (isRowCheck(check)) observation.rows = observation.rows.filter((row) => !baseline.get(check.source).has(row.id));
		results.push(evaluateState(check, observation, displayNameOf));
	}
	return results;
}

/** Resolves (as the ecosystem's steward persona) any emergency a run opened, re-seeds so the adapter closes it, and proves it closed. */
async function settleEmergencies(task, refs, baseline) {
	for (const check of (task.state || []).map(parseCheck).filter((c) => c.kind === 'emergency')) {
		const before = baseline.get(check.source);
		if (!before) continue; // no snapshot: never resolve an emergency this run cannot have opened
		const steward = stewardIn(people, check.args[0]);
		const opened = async () => (await observe(client, check, { refs, task, people, ecosystemNames, cache: new Map() })).rows
			.filter((row) => !before.has(row.id) && ACTIVE_EMERGENCY.has(row.state));
		const found = await opened();
		if (!found.length) continue;
		for (const row of found.filter((r) => r.state === 'open')) await client.must(steward.handle, 'POST', `/api/v1/emergency/${row.id}/resolve`);
		seedPersonas();
		if ((await opened()).length) {
			console.log(`EMERGENCY LEFT OPEN in ${check.args[0]} (task ${task.id}): close it before the next run`);
			throw new Abort('EMERGENCY LEFT OPEN');
		}
	}
}

function writeTranscript(task, runIndex, refs, pageContext, turns) {
	fs.mkdirSync(transcriptDir, { recursive: true });
	const file = path.join(transcriptDir, `${task.id}-${runIndex}.json`);
	const capped = (data) => {
		const text = JSON.stringify(data ?? null);
		return text.length > TRANSCRIPT_DATA_CHARS ? { truncated: text.length, preview: text.slice(0, TRANSCRIPT_DATA_CHARS) } : data;
	};
	fs.writeFileSync(file, JSON.stringify({
		task: task.id, run: runIndex, runId, persona: `qa-agent-${task.persona}`, page: pageContext.path,
		fixtures: Object.fromEntries(Object.entries(refs).map(([name, ref]) => [name, { kind: ref.kind, key: ref.key, title: ref.title, path: ref.path }])),
		turns: turns.map((turn) => ({ user: turn.user, text: turn.text, tokens: turn.tokens, seconds: turn.seconds, trace: turn.trace.map((call) => ({ ...call, data: capped(call.data) })) })),
	}, null, 1));
	return studyPath(file);
}

// ---- one run of one task ----
async function runOnce(task, runIndex) {
	const handle = `qa-agent-${task.persona}`;
	const persona = people.get(handle);
	const run = { run: runIndex, outcome: null, failedBy: null, stateViolation: false, turns: 0, tokens: 0, seconds: 0, state: [], reply: [], trace: [], judge: null, transcript: null };
	const started = Date.now();
	const turns = [];
	const refs = {};
	let baseline = new Map();
	let pageContext = { path: DEFAULT_PAGE };
	try {
		await buildFixtures(client, task, people, marker, runId, refs);
		const checks = { state: (task.state || []).map(parseCheck), reply: (task.reply || []).map(parseCheck) };
		baseline = await snapshot(checks.state, refs, task);
		if (options.dryRun) {
			run.state = await gradeState(checks.state, refs, task, baseline);
			run.outcome = 'DRY';
			return run;
		}
		const scopeIds = (task.scope || []).map((name) => persona.ecosystems[name]);
		pageContext = { path: fillRefs(task.page || DEFAULT_PAGE, refs), member_id: persona.memberId, member_name: persona.name, ecosystem_name: task.scope?.[0] || persona.primary };
		const history = [];
		let sessionId = null;
		for (const [index, template] of task.turns.entries()) {
			const message = fillRefs(template, refs);
			const turnStarted = Date.now();
			const turn = await client.chat(handle, { message, history, session_id: sessionId, active_skill: null, page_context: pageContext, selected_ecosystem_ids: scopeIds }, { scopeIds });
			Object.assign(turn, { user: message, seconds: Math.round((Date.now() - turnStarted) / 100) / 10 });
			turns.push(turn);
			run.tokens += turn.tokens;
			budget.tokensUsed += turn.tokens;
			if (turn.ownerBlocked) throw new Abort('OWNER_BLOCKED');
			if (turn.serviceUnavailable) throw new Abort('SERVICE_UNAVAILABLE');
			history.push({ role: 'user', content: message }, { role: 'assistant', content: turn.text });
			sessionId = turn.sessionId || sessionId;
			run.state.push(...await gradeState(checks.state.filter((c) => c.turn === index + 1), refs, task, baseline));
		}
		run.turns = turns.length;
		run.state.push(...await gradeState(checks.state.filter((c) => !c.turn), refs, task, baseline));
		const queueSkipReason = retainedQueueSkipReason(task, turns, refs, run.state);
		if (queueSkipReason) {
			Object.assign(run, { outcome: 'SKIPPED', skipReason: queueSkipReason });
			return run;
		}
		run.reply = checks.reply.map((check) => evaluateReply(check, turns, refs));
		Object.assign(run, runOutcome(task, run.state, run.reply));
	} catch (error) {
		run.outcome = 'ERROR';
		run.error = String(error.message || error).slice(0, 200);
		if (error instanceof Abort) run.abort = error.message;
	} finally {
		const trace = turns.flatMap((turn) => turn.trace);
		run.trace = trace.map(({ data, ...call }) => call);
		if (turns.length) run.transcript = writeTranscript(task, runIndex, refs, pageContext, turns);
		const created = { proposals: createdIds(trace, 'create_proposal'), exits: createdIds(trace, 'create_exit_record') };
		const leftovers = await teardown(client, refs, created, handle);
		if (leftovers.length) run.teardown = leftovers;
		if (turns.length) {
			try {
				await settleEmergencies(task, refs, baseline);
			} catch (error) {
				run.abort = error.message;
			}
		}
		if (trace.some((call) => call.name === 'declare_emergency' && call.success) && !(task.state || []).some((s) => s.includes('emergency('))) {
			console.log(`EMERGENCY LEFT OPEN: task ${task.id} declared one outside an emergency task; resolve it by hand`);
			run.abort = 'EMERGENCY LEFT OPEN';
		}
		run.seconds = Math.round((Date.now() - started) / 100) / 10;
	}
	return run;
}

// ---- the run ----
const result = { pass, evalVersion: allTasks.evalVersion, resultVersion: RESULT_VERSION, runId, startedAt: new Date(startedAt).toISOString(), baseUrl, dryRun: options.dryRun, budget, tasks: [] };
let abortReason = null;
for (const task of tasks) {
	const record = {
		id: task.id, category: task.category, persona: `qa-agent-${task.persona}`, blocker: Boolean(task.blocker), today: Boolean(task.today),
		userTurns: task.turns, checks: { state: task.state || [], reply: task.reply || [], judge: (task.judge || []).map((fact) => fillStems(fact, task)) },
		outcome: null, stateViolation: false, runs: [],
	};
	const skipReason = abortReason || blocked.get(task.id)
		|| (budget.tokensUsed >= budget.tokenCap ? 'tokenCap' : null)
		|| (Date.now() - startedAt > MAX_MINUTES * 60_000 ? 'time' : null);
	if (skipReason) {
		Object.assign(record, { outcome: 'SKIPPED', skipReason });
		if (!blocked.has(task.id)) budget.aborted ??= skipReason;
	} else {
		const runs = options.dryRun ? 1 : Math.max(options.repeats, task.runs || 1);
		for (let index = 1; index <= runs && !abortReason; index++) {
			const run = await runOnce(task, index);
			record.runs.push(run);
			if (run.abort) abortReason = run.abort;
		}
		record.outcome = options.dryRun ? 'DRY' : taskOutcome(record.runs);
		if (record.outcome === 'SKIPPED') record.skipReason = record.runs.find((run) => run.skipReason)?.skipReason;
		record.stateViolation = record.runs.some((run) => run.stateViolation);
	}
	budget.requests = client.stats.requests;
	result.tasks.push(record);
	if (!options.dryRun) writeResult(result);
	const firstProblem = record.runs.flatMap((run) => [run.error, ...[...run.state, ...run.reply].filter((r) => !r.ok).map((r) => `${r.check}: ${r.detail}`)]).find(Boolean);
	const dryNote = options.dryRun ? ` fixtures=${Object.keys(task.fixtures || {}).join(',') || '-'} state-now: ${record.runs[0]?.state.filter((r) => r.ok).length ?? 0}/${record.runs[0]?.state.length ?? 0} hold` : '';
	console.log(`TASK ${task.id} ${record.outcome}${record.skipReason ? ` (${record.skipReason})` : ''} runs=${record.runs.length} tokens=${record.runs.reduce((n, r) => n + r.tokens, 0)}${dryNote}${firstProblem ? ` | ${String(firstProblem).slice(0, 150)}` : ''}`);
}

budget.aborted ??= abortReason;

if (options.dryRun) {
	const errors = result.tasks.filter((task) => task.runs.some((run) => run.outcome === 'ERROR')).length;
	console.log(`AGENT-EVAL ${pass} DRY-RUN tasks=${result.tasks.length} errors=${errors} skipped=${result.tasks.filter((t) => t.outcome === 'SKIPPED').length} chatRequests=${client.stats.requests} (fixtures built and torn down; no model calls)`);
	process.exit(errors ? 1 : 0);
}
writeResult(result);
console.log(summaryLine(result, repoPath(resultFile)));
process.exit(['OWNER_BLOCKED', 'SERVICE_UNAVAILABLE', 'EMERGENCY LEFT OPEN'].includes(abortReason) ? 3 : 0);
