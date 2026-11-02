// Evidence-based prerequisites for eval grading; see AGENTS.md "Queue preconditions".
import { isReadOnlyTool, parseCheck, retainedQueueItems } from './grading.mjs';

/** A skip reason only when a successful queue result hid an expected fixture from the model. */
export function retainedQueueSkipReason(task, turns, refs, state = []) {
	const required = task.requiresRetainedQueue || [];
	const queueChecks = (task.reply || []).map(parseCheck).filter((check) => check.kind === 'queue');
	if (!required.length && !queueChecks.length) return null;
	if (state.some((check) => !check.ok)) return null;
	const trace = turns.flatMap((turn) => turn.trace);
	if (trace.some((call) => call.success && !isReadOnlyTool(call.name))) return null;
	const calls = trace.filter((call) => call.name === 'what_needs_me' && call.success);
	if (!calls.length) return null;
	for (const check of queueChecks) {
		const covered = check.turn ? [turns[check.turn - 1]].filter(Boolean) : turns;
		if (!covered.some((turn) => turn.trace.some((call) => call.name === 'what_needs_me' && call.success))) continue;
		const count = retainedQueueItems(covered).length;
		if (count < Number(check.args[0])) return `queue precondition: only ${count} actionable priorities retained; ${check.args[0]} required, queue grounding not measured`;
	}
	const visible = new Set(calls.flatMap((call) => Array.isArray(call.data?.items) ? call.data.items : [])
		.filter((item) => item && typeof item === 'object').map((item) => String(item.id)));
	const missing = required.filter((name) => !visible.has(String(refs[name]?.id)));
	return missing.length ? `queue precondition: ${missing.join(', ')} absent from the model-retained what_needs_me items; reply coverage not measured` : null;
}
