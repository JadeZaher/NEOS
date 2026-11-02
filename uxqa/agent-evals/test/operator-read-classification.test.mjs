import assert from 'node:assert/strict';
import { test } from 'node:test';
import { evaluateReply, isReadOnlyTool, parseCheck } from '../grading.mjs';
import { retainedQueueSkipReason } from '../preconditions.mjs';

const reads = ['list_conversations', 'get_conversation', 'search_messages', 'find_message_members',
	'find_collaboration_domains', 'find_collaborations', 'get_collaboration', 'get_health_audit', 'export_portable_record'];
const writes = ['create_conversation', 'send_message', 'propose_collaboration', 'update_health_audit',
	'publish_health_audit', 'abandon_health_audit', 'update_exit_status', 'update_conflict_case', 'update_repair_agreement'];
const call = (name) => ({ name, success: true, data: {}, args: {} });

test('ordinary reads and private link preparation preserve no-governance-write checks', () => {
	for (const name of reads) {
		assert.equal(isReadOnlyTool(name), true, name);
		assert.equal(evaluateReply(parseCheck('nowrite'), [{ text: 'Read only.', trace: [call(name)] }]).ok, true, name);
	}
});

test('every new ordinary mutation and unknown future tool remains a write', () => {
	for (const name of [...writes, 'future_unreviewed_tool']) {
		assert.equal(isReadOnlyTool(name), false, name);
		assert.equal(evaluateReply(parseCheck('nowrite'), [{ text: 'Done.', trace: [call(name)] }]).ok, false, name);
	}
});

test('a mutation still prevents an empty-queue precondition from hiding a failure', () => {
	const task = { reply: ['queue(2)'] };
	const queue = { name: 'what_needs_me', success: true, data: { items: [] } };
	for (const name of reads) {
		assert.match(retainedQueueSkipReason(task, [{ text: '', trace: [queue, call(name)] }], {}), /queue precondition/);
	}
	for (const name of writes) {
		assert.equal(retainedQueueSkipReason(task, [{ text: '', trace: [queue, call(name)] }], {}), null, name);
	}
});
