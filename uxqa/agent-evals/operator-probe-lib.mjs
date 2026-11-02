import assert from 'node:assert/strict';
import { isReadOnlyTool } from './grading.mjs';

export async function executeOperatorCases(client, manifest, persist = () => {}) {
const startedAt = Date.now();
const bindings = { ...(manifest.bindings || {}) };
const fill = (text) => String(text).replace(/\{([A-Za-z][A-Za-z0-9_]*)\}/g, (_, key) => {
	if (!(key in bindings)) throw new Error(`Missing prepared binding ${key}`);
	return String(bindings[key]);
});
const valueAt = (value, pointer) => pointer.split('/').slice(1).reduce((node, key) => node?.[key.replaceAll('~1', '/').replaceAll('~0', '~')], value);
const actor = (handle) => {
	assert.match(handle, /^qa-agent-[a-z]+$/, 'Only synthetic operator personas are permitted');
	return handle;
};
const result = { type: 'operator-capability', ui_success_count: 0, startedAt: new Date().toISOString(), cases: [], tokens: 0 };
const save = () => { if (client.stats) result.pacing = {intervalMs:client.stats.chatPaceMs,waitMs:client.stats.pacingWaitMs,pacedRequests:client.stats.pacedRequests,requests:client.stats.requests}; persist(structuredClone(result)); };
save();
for (const spec of manifest.cases) {
	const record = { id: spec.id, actor: actor(spec.actor), turns: [], passed: false, status: 'RUNNING' };
	result.cases.push(record);
	const blocked = (spec.dependsOn || []).filter((id) => !result.cases.some((entry) => entry.id === id && entry.status === 'PASS'));
	if (blocked.length) { record.status = 'BLOCKED'; record.error = `Dependencies did not pass: ${blocked.join(', ')}`; save(); continue; }
	if (result.stopReason) { record.status = 'SKIPPED'; record.error = result.stopReason; save(); continue; }
	let sessionId = null;
	const history = [];
	try {
		assert.ok(spec.turns.length > 0 && spec.turns.length <= 10);
		for (const step of spec.turns) {
			if (result.tokens >= (manifest.tokenCap || 500000)) result.stopReason = 'tokenCap';
			if (Date.now() - startedAt > (manifest.maxMinutes || 20) * 60000) result.stopReason = 'time';
			if (result.stopReason) throw new Error(`Capability budget stop: ${result.stopReason}`);
			const message = fill(step.message);
			const turn = await client.chat(record.actor, { message, session_id: sessionId, history,
				page_context: { path: fill(step.page || '/dashboard') } }, { scopeIds: (spec.scopeIds || []).map(fill) });
			sessionId = turn.sessionId || sessionId;
			result.tokens += turn.tokens;
			record.turns.push(turn);
			save();
			assert.equal(turn.done, true, 'Stream did not finish');
			assert.equal(turn.serviceUnavailable, false, 'Model service unavailable');
			for (const name of step.expectCalls || []) assert.ok(turn.trace.some((call) => call.name === name), `Expected call ${name}`);
			for (const name of step.forbidSuccessful || []) assert.ok(!turn.trace.some((call) => call.name === name && call.success), `Unexpected successful ${name}`);
			const intended = new Set(step.allowedSuccessful || step.expectCalls || []);
			for (const call of turn.trace) if (call.success && !isReadOnlyTool(call.name)) assert.ok(intended.has(call.name), `Unrequested successful mutation ${call.name}`);
			for (const capture of step.capture || []) {
				const call = turn.trace.find((item) => item.name === capture.tool && item.success);
				assert.ok(call, `Capture requires successful ${capture.tool}`);
				const value = valueAt(call.data, capture.pointer);
				assert.ok(typeof value === 'string' || typeof value === 'number', 'Capture must be a scalar reference');
				bindings[capture.name] = value;
			}
			for (const observation of step.observe || []) {
				const route = fill(observation.path);
				assert.match(route, /^\/api\/v1\/[A-Za-z0-9_/?=&%.-]+$/, 'Only local API observations are allowed');
				const response = await client.call(actor(observation.actor || record.actor), 'GET', route, undefined,
					{ scopeIds: (spec.scopeIds || []).map(fill) });
				assert.equal(response.status, observation.status || 200, `Observation ${route}`);
				for (const check of observation.checks || []) {
					const expected = typeof check.equals === 'string' ? fill(check.equals) : check.equals;
					assert.deepEqual(valueAt(response.data, check.pointer), expected, `${route} ${check.pointer}`);
				}
				// Export contents are deliberately not copied into evidence/model context.
				turn.observations ||= [];
				turn.observations.push({ route, status: response.status, checks: observation.checks || [] });
			}
			history.push({ role: 'user', content: message }, { role: 'assistant', content: turn.text });
			save();
		}
		record.passed = true;
		record.status = 'PASS';
	} catch (error) {
		record.error = String(error.message).slice(0, 1000);
		record.status = result.stopReason ? 'STOPPED' : 'FAIL';
		save();
		// Independent cases still run; declared dependencies are blocked above.
	}
	save();
}
result.finishedAt = new Date().toISOString();
result.passed = result.cases.length === manifest.cases.length && result.cases.every((entry) => entry.passed);
save();
return result;
}
