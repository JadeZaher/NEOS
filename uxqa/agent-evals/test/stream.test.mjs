// node --test uxqa/agent-evals/test/*.test.mjs   (no network)
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { collectTurn, createSseParser, readEvents } from '../stream.mjs';

// Byte-for-byte what api/chat.py _sse_event writes for a one-tool turn.
const sse = (event, data) => `event: ${event}\n${data.split('\n').map((line) => `data: ${line}`).join('\n')}\n\n`;
const TURN = [
	sse('thinking', '{"step": "Analyzing your request..."}'),
	sse('tool_start', JSON.stringify({ name: 'get_proposal', args: { proposal_id: 'PROP-1A2B3C4D' } })),
	sse('tool_result', JSON.stringify({ name: 'get_proposal', success: true, data: { status: 'advice', blob: `${'x'.repeat(400)}… [1700 more characters]` }, error: null })),
	sse('append', 'It is in advice.\nRound 1 of 2 is done.'),
	sse('session', '{"session_id": "s-1"}'),
	sse('usage', '{"prompt_tokens": 900, "completion_tokens": 100, "total_tokens": 1000}'),
	sse('done', ''),
].join('');

test('a turn survives any chunking, CRLF line ends and an empty done payload', () => {
	for (const [label, chunks] of [
		['one chunk', [TURN]],
		['three-byte chunks', TURN.match(/[\s\S]{1,3}/g)],
		['CRLF', [TURN.replaceAll('\n', '\r\n')]],
	]) {
		const parser = createSseParser();
		const turn = collectTurn(chunks.flatMap((chunk) => parser.feed(chunk)));
		assert.equal(turn.text, 'It is in advice.\nRound 1 of 2 is done.', label);
		assert.deepEqual(turn.trace.map(({ name, args, success }) => ({ name, args, success })), [{ name: 'get_proposal', args: { proposal_id: 'PROP-1A2B3C4D' }, success: true }], label);
		assert.equal(turn.trace[0].truncatedForModel, true, label);
		assert.equal(turn.tokens, 1000, label);
		assert.equal(turn.sessionId, 's-1', label);
		assert.equal(turn.done, true, label);
	}
});

test('readEvents reads a fetch body and flushes an unterminated last event', async () => {
	const body = new Response(TURN.slice(0, -1)).body; // stream cut before the final blank line
	const turn = collectTurn(await readEvents(body));
	assert.equal(turn.done, true);
	assert.equal(turn.text.startsWith('It is in advice.'), true);
});

test('tool calls pair by name in order; an unanswered start counts as failed', () => {
	const turn = collectTurn([
		{ type: 'tool_start', data: '{"name":"record_advice","args":{"text":"a"}}' },
		{ type: 'tool_start', data: '{"name":"record_advice","args":{"text":"b"}}' },
		{ type: 'tool_result', data: '{"name":"record_advice","success":false,"error":"denied"}' },
	]);
	assert.deepEqual(turn.trace.map((call) => [call.args.text, call.success, call.error]), [['a', false, 'denied'], ['b', false, null]]);
});

test('explicit missing configuration differs from unavailable service; blank appends are ignored', () => {
	for (const [text, ownerBlocked, serviceUnavailable] of [
		['The assistant is unavailable right now. Please try again later.', false, true],
		['AI service is not available.', false, true],
		['AI chat is not configured. Set AI_API_KEY in the server environment to enable chat features.', true, false],
		['The proposal is available for advice.', false, false],
	]) {
		const turn = collectTurn([{ type: 'append', data: '   ' }, { type: 'append', data: text }]);
		assert.equal(turn.ownerBlocked, ownerBlocked, text);
		assert.equal(turn.serviceUnavailable, serviceUnavailable, text);
	}
});

test('skill routing evidence keeps native mode and explicit skill selection distinct', () => {
	const turn = collectTurn([
		{ type: 'skill_route', data: JSON.stringify({ mode: 'native', skill: null, source: 'automatic' }) },
		{ type: 'skill_route', data: JSON.stringify({ mode: 'skill', skill: 'proposal-creation', source: 'member' }) },
		{ type: 'skill_route', data: '{invalid' },
		{ type: 'skill_route', data: JSON.stringify({ mode: 'skill', source: 'missing-skill' }) },
		{ type: 'skill_route', data: JSON.stringify({ mode: null, skill: null, source: 'invalid' }) },
	]);
	assert.deepEqual(turn.skillRoutes, [
		{ mode: 'native', skill: null, source: 'automatic' },
		{ mode: 'skill', skill: 'proposal-creation', source: 'member' },
	]);
});


test('safe provider availability is preserved as availability without inferring exhausted credits',()=>{
 const turn=collectTurn([
  {type:'availability',data:JSON.stringify({status:'unavailable',provider_status:429,retryable:true,retry_after_seconds:10,attempts:3,private_body:'must not be retained'})},
  {type:'usage',data:JSON.stringify({total_tokens:123})},
  {type:'session',data:JSON.stringify({session_id:'saved-session'})},
  {type:'done',data:''},
 ]);
 assert.equal(turn.serviceUnavailable,true);assert.equal(turn.ownerBlocked,false);
 assert.deepEqual(turn.availability,{status:'unavailable',provider_status:429,retryable:true,retry_after_seconds:10,attempts:3});
 assert.equal(turn.tokens,123);assert.equal(turn.sessionId,'saved-session');assert.equal(turn.done,true);
});
