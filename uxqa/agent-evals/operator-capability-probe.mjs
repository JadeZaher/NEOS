// Guarded real-model capability probe; separate from UI/user-success metrics. See operator-capability-plan.md.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createClient, assertLocal } from './neos-api.mjs';

const [manifestFile, outputFile] = process.argv.slice(2);
if (!manifestFile || !outputFile) throw new Error('Usage: operator-capability-probe.mjs <prepared-manifest.json> <new-output.json>');
if (fs.existsSync(outputFile)) throw new Error('Refusing to overwrite prior capability evidence');
const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
const base = manifest.baseUrl || 'http://localhost:5173';
assertLocal(base);
assert.equal(manifest.syntheticOnly, true, 'Only prepared synthetic fixtures are permitted');
assert.ok(Array.isArray(manifest.cases) && manifest.cases.length > 0 && manifest.cases.length <= 15);
const guarded = spawnSync('bash', ['uxqa/adapter/adapter.sh', 'guard'], {
	encoding: 'utf8', timeout: 30000, env: { ...process.env, UXQA_BASE_URL: base }, stdio: ['ignore', 'pipe', 'ignore'],
});
if (guarded.status !== 0 || !String(guarded.stdout).trim().startsWith('OK')) throw new Error('Local sentinel verification refused the capability probe');
const entries = JSON.parse(fs.readFileSync(manifest.sessionsFile || 'uxqa/.secrets/agent-sessions.json', 'utf8'));
const client = createClient(base, new Map(entries.filter((row) => row.cookie).map((row) => [row.handle, row.cookie])), {chatPaceMs:manifest.chatPaceMs ?? 2000});
const { executeOperatorCases } = await import('./operator-probe-lib.mjs');
const result = await executeOperatorCases(client, manifest, (record) => fs.writeFileSync(outputFile, JSON.stringify(record, null, 2)));
console.log(`Operator capability ${result.passed ? 'PASS' : 'FAIL'}: ${result.cases.filter((entry) => entry.passed).length}/${manifest.cases.length}; UI successes: 0`);
if (!result.passed) process.exitCode = 1;
