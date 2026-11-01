// Evidence-based prerequisites for eval grading; see AGENTS.md "Queue preconditions".
import { isReadOnlyTool } from './grading.mjs';

/** A skip reason only when a successful queue result hid an expected fixture from the model. */
export function retainedQueueSkipReason(task, turns, refs, state = []) {
	const required = task.requiresRetainedQueue || [];
	if (!required.length) return null;
	if (state.some((check) => !check.ok)) return null;
	const trace = turns.flatMap((turn) => turn.trace);
	if (trace.some((call) => call.success && !isReadOnlyTool(call.name))) return null;
	const calls = trace.filter((call) => call.name === 'what_needs_me' && call.success);
	if (!calls.length) return null;
	const visible = new Set(calls.flatMap((call) => Array.isArray(call.data?.items) ? call.data.items : [])
		.filter((item) => item && typeof item === 'object').map((item) => String(item.id)));
	const missing = required.filter((name) => !visible.has(String(refs[name]?.id)));
	return missing.length ? `queue precondition: ${missing.join(', ')} absent from the model-retained what_needs_me items; reply coverage not measured` : null;
}
