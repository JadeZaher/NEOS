// Reads the server-sent events of POST /api/v1/chat/send into one assistant turn. See uxqa/agent-evals/AGENTS.md sec. Stream.

const OWNER_BLOCKED = /AI chat is not configured/;
const SERVICE_UNAVAILABLE = /The assistant is unavailable right now|AI service is not available/;
const CLIP_MARKER = /… \[\d+ more characters\]/; // api/chat.py _fit_tool_result clips long values with this marker; model and browser see the same clipped result

/** Incremental SSE parser: feed() text chunks, get back the completed {type, data} events. */
export function createSseParser() {
	let buffer = '';
	let type = 'message';
	let data = null;
	return {
		feed(chunk) {
			buffer += chunk;
			const lines = buffer.split('\n');
			buffer = lines.pop();
			const events = [];
			for (const raw of lines) {
				const line = raw.endsWith('\r') ? raw.slice(0, -1) : raw;
				if (line.startsWith('event:')) type = line.slice(6).trim();
				else if (line.startsWith('data:')) {
					const value = line.slice(5).replace(/^ /, '');
					data = data == null ? value : `${data}\n${value}`;
				} else if (line === '') {
					// Unlike the browser client, an empty data payload still dispatches, so `done` is kept.
					if (data != null || type !== 'message') events.push({ type, data: data ?? '' });
					type = 'message';
					data = null;
				}
			}
			return events;
		},
	};
}

const parseJson = (text) => {
	try {
		return JSON.parse(text);
	} catch {
		return {};
	}
};

/** Folds one response's events into the assistant turn and its availability flags. */
export function collectTurn(events) {
	const turn = { text: '', trace: [], skillRoutes: [], tokens: 0, sessionId: null, done: false, ownerBlocked: false, serviceUnavailable: false };
	for (const { type, data } of events) {
		if (type === 'append') {
			if (data.trim()) turn.text += data; // same rule as use-chat.ts: what the member sees
		} else if (type === 'tool_start') {
			const start = parseJson(data);
			turn.trace.push({ name: start.name, args: start.args || {}, success: null, error: null, data: null, truncatedForModel: false });
		} else if (type === 'tool_result') {
			const result = parseJson(data);
			let call = turn.trace.find((entry) => entry.name === result.name && entry.success === null);
			if (!call) turn.trace.push((call = { name: result.name, args: {} }));
			call.success = Boolean(result.success);
			call.error = result.error ?? null;
			call.data = result.data ?? null;
			call.truncatedForModel = CLIP_MARKER.test(JSON.stringify(result.data ?? null));
		} else if (type === 'skill_route') {
			const route = parseJson(data);
			if (typeof route.mode === 'string' && route.mode && (route.skill === null || typeof route.skill === 'string') && typeof route.source === 'string' && route.source) {
				turn.skillRoutes.push({ mode: route.mode, skill: route.skill, source: route.source });
			}
		} else if (type === 'usage') turn.tokens += parseJson(data).total_tokens || 0;
		else if (type === 'session') turn.sessionId = parseJson(data).session_id || null;
		else if (type === 'done') turn.done = true;
	}
	for (const call of turn.trace) if (call.success === null) call.success = false; // started, never answered
	turn.ownerBlocked = OWNER_BLOCKED.test(turn.text);
	turn.serviceUnavailable = SERVICE_UNAVAILABLE.test(turn.text);
	return turn;
}

/** Reads a fetch Response body to the end and returns its events. */
export async function readEvents(body) {
	const parser = createSseParser();
	const decoder = new TextDecoder();
	const events = [];
	const reader = body.getReader();
	for (;;) {
		const { done, value } = await reader.read();
		if (done) break;
		events.push(...parser.feed(decoder.decode(value, { stream: true })));
	}
	events.push(...parser.feed(decoder.decode() + '\n\n'));
	return events;
}
