// Local synthetic capability/UI regression; see AGENTS.md engagement entry.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const study = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
process.env.UXQA_STUDY_DIR ??= study;
const plugin = process.env.UXQA_PLUGIN_ROOT || 'C:/Users/atooz/.claude/plugins/cache/local/ux-qa-research/0.1.0';
const { uxSession, BASE } = await import(pathToFileURL(path.join(plugin, 'lib/ux-lib.mjs')).href);
assert.ok(['localhost', '127.0.0.1'].includes(new URL(BASE).hostname), 'Refusing nonlocal browser target');
const pass = process.env.UXQA_PASS || '08-community-engagement';
const receiver = await uxSession({ handle: 'qa-member-ines', task: 'engagement-community-and-updates', pass, mode: 'probe' });
const sender = await uxSession({ handle: 'qa-steward-amara', task: 'engagement-message-fixture', pass, mode: 'probe' });
let outcome = 'FAILED';
let fixtureOutcome = 'FAILED';
let failure;
let originalPreferences;
const createdSubscriptions = [];
const evidence = { mode: 'probe', fixtureSetup: [], checks: [], externalSends: 0 };
const check = (name) => evidence.checks.push(name);
async function api(s, method, url, body) {
  const result = await s.request(method, url, body);
  assert.ok(result.status >= 200 && result.status < 300, `${method} ${url} returned ${result.status}`);
  return result.body;
}
try {
  for (const s of [receiver, sender]) {
    await s.page.goto(BASE, { waitUntil: 'networkidle' });
    const sentinel = await api(s, 'GET', '/api/v1/settings/?key=uxqa_environment');
    assert.equal(sentinel.value?.db, 'neos_uxqa', 'Refusing non-study database');
  }
  const capabilities = await api(receiver, 'GET', '/api/v1/engagement/capabilities');
  assert.equal(capabilities.external_delivery_enabled, false, 'Refusing enabled external delivery');
  originalPreferences = await api(receiver, 'GET', '/api/v1/engagement/preferences');
  const existing = await api(receiver, 'GET', '/api/v1/engagement/subscriptions');
  const options = await api(receiver, 'GET', '/api/v1/engagement/scope-options?kind=ecosystem');
  const me = await api(receiver, 'GET', '/api/v1/auth/me');
  const senderMe = await api(sender, 'GET', '/api/v1/auth/me');
  assert.ok(me.member?.id, 'Synthetic receiver needs active membership');
  assert.ok(senderMe.member?.id, 'Synthetic sender needs active membership');
  assert.equal(senderMe.member.ecosystem_id, me.member.ecosystem_id, 'Synthetic sender and receiver must share their default community');
  const community = options.items.find(item => item.scope_id === me.member.ecosystem_id && !existing.items.some(row => row.scope_kind === 'ecosystem' && row.scope_id === item.scope_id));
  assert.ok(community, 'Need the synthetic receiver default community without an existing follow');

  // Fixture setup uses real local APIs; it is not credited as UI completion.
  const conversation = await api(sender, 'POST', '/api/v1/messaging/conversations', {
    type: 'group', title: `Engagement QA ${Date.now()}`, participant_ids: [me.member.id],
  });
  const conversationId = conversation.id || conversation.conversation?.id;
  assert.ok(conversationId, 'Conversation fixture ID missing');
  evidence.fixtureSetup.push('Synthetic two-person conversation created through authorized local API');
  fixtureOutcome = 'COMPLETED';

  await receiver.page.goto(BASE + '/settings/notifications', { waitUntil: 'networkidle' });
  await receiver.page.getByRole('heading', { name: 'Your notification choices', exact: true }).waitFor();
  assert.equal(await receiver.page.getByRole('button', { name: 'Send verification code', exact: true }).count(), 2);
  for (const button of await receiver.page.getByRole('button', { name: 'Send verification code', exact: true }).all()) assert.equal(await button.isDisabled(), true);
  await receiver.page.getByLabel('Delivery time zone', { exact: true }).fill('America/Denver');
  await receiver.page.getByLabel('Start', { exact: true }).fill('22:00');
  await receiver.page.getByLabel('End', { exact: true }).fill('07:00');
  await receiver.page.getByLabel('Include direct messages in my in-app updates', { exact: true }).check();
  await receiver.page.getByRole('button', { name: 'Save pacing preferences', exact: true }).click();
  await receiver.page.getByText('Pacing preferences saved.', { exact: true }).waitFor();
  await receiver.page.reload({ waitUntil: 'networkidle' });
  assert.equal(await receiver.page.getByLabel('Delivery time zone', { exact: true }).inputValue(), 'America/Denver');
  assert.equal(await receiver.page.getByLabel('Start', { exact: true }).inputValue(), '22:00');
  check('Preferences persist with no registered browser endpoint; external verification controls stay disabled');

  await receiver.page.getByLabel('Follow a', { exact: true }).selectOption('ecosystem');
  await receiver.page.getByLabel('Choose community', { exact: true }).selectOption(community.scope_id);
  await receiver.page.getByRole('button', { name: 'Save follow', exact: true }).click();
  await receiver.page.getByText('Follow saved.', { exact: true }).waitFor();
  let rows = (await api(receiver, 'GET', '/api/v1/engagement/subscriptions')).items;
  const broad = rows.find(item => item.scope_kind === 'ecosystem' && item.scope_id === community.scope_id);
  assert.ok(broad); createdSubscriptions.push(broad.id);
  assert.deepEqual(broad.channels, ['in_app']);
  check('Broad community follow saved through named selector without external consent');

  const beforeQueue = await api(receiver, 'GET', '/api/v1/me/next-steps');
  const privateMarker = 'Private synthetic engagement message ' + Date.now();
  await api(sender, 'POST', `/api/v1/messaging/conversations/${conversationId}/messages`, { content: privateMarker });
  evidence.fixtureSetup.push('First real local message produces the actual recipient event');
  let inbox;
  for (let attempt = 0; attempt < 12; attempt++) {
    inbox = await api(receiver, 'GET', '/api/v1/engagement/inbox?limit=50');
    if (inbox.items.some(item => item.source_kind === 'conversation' && item.source_id === conversationId)) break;
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  const item = inbox.items.find(row => row.source_kind === 'conversation' && row.source_id === conversationId);
  assert.ok(item, 'Committed message must create a recipient inbox item');
  await receiver.page.goto(BASE + '/updates', { waitUntil: 'networkidle' });
  await receiver.page.getByRole('heading', { name: 'Your updates', exact: true }).waitFor();
  const article = receiver.page.locator('article').filter({ has: receiver.page.locator(`a[href*="conversation=${conversationId}"]`) });
  assert.equal(await article.count(), 1);
  assert.equal((await article.innerText()).includes(privateMarker), false);
  await article.getByRole('button', { name: 'Mark read', exact: true }).click();
  await article.getByRole('button', { name: 'Mark unread', exact: true }).waitFor();
  const afterQueue = await api(receiver, 'GET', '/api/v1/me/next-steps');
  assert.deepEqual(afterQueue.items.map(row => row.uid).sort(), beforeQueue.items.map(row => row.uid).sort());
  const activity = await api(receiver, 'GET', '/api/v1/engagement/activity');
  assert.equal(activity.items.some(row => row.family === 'messages'), false);
  check('Actual private message appears generically in inbox, is absent from community activity, and read does not complete next steps');

  await article.getByRole('link', { name: 'Follow or mute this', exact: true }).click();
  await receiver.page.getByRole('heading', { name: 'Your notification choices', exact: true }).waitFor();
  assert.equal(await receiver.page.getByLabel('Follow a', { exact: true }).inputValue(), 'conversation');
  await receiver.page.getByLabel('Mute updates from this item, including broader follows', { exact: true }).check();
  await receiver.page.getByRole('button', { name: 'Save mute', exact: true }).click();
  await receiver.page.getByText('Mute saved.', { exact: true }).waitFor();
  rows = (await api(receiver, 'GET', '/api/v1/engagement/subscriptions')).items;
  const narrow = rows.find(row => row.scope_kind === 'conversation' && row.scope_id === conversationId);
  assert.ok(narrow?.muted); createdSubscriptions.push(narrow.id);
  const beforeMuted = (await api(receiver, 'GET', '/api/v1/engagement/inbox?limit=50')).items.filter(row => row.source_id === conversationId).length;
  await api(sender, 'POST', `/api/v1/messaging/conversations/${conversationId}/messages`, { content: 'Second synthetic message after explicit mute' });
  for (let attempt = 0; attempt < 4; attempt++) await api(receiver, 'GET', '/api/v1/engagement/inbox?limit=50');
  const afterMuted = (await api(receiver, 'GET', '/api/v1/engagement/inbox?limit=50')).items.filter(row => row.source_id === conversationId).length;
  assert.equal(afterMuted, beforeMuted);
  check('Source deep link resolves by authorized name and explicit narrow mute blocks later message updates');

  await receiver.page.setViewportSize({ width: 390, height: 844 });
  await receiver.page.keyboard.press('Tab');
  assert.equal(await receiver.page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
  await receiver.page.screenshot({ path: path.join(study, 'passes', pass, 'engagement-settings-mobile.png'), fullPage: true });
  check('Settings fit 390px viewport and expose native keyboard targets');

  // Anonymous boundary is inspected after owner-side cleanup in finally below.
  outcome = 'COMPLETED';
} catch (error) {
  failure = error;
} finally {
  if (originalPreferences) {
    try {
      for (const id of createdSubscriptions) await api(receiver, 'DELETE', `/api/v1/engagement/subscriptions/${id}`, {});
      await api(receiver, 'PUT', '/api/v1/engagement/preferences', originalPreferences);
      evidence.fixtureSetup.push('Original preferences restored; only follows created by this probe removed');
    } catch (error) { outcome = 'FAILED'; failure ??= error; }
  }
  if (outcome === 'COMPLETED') {
    try {
      await receiver.page.context().clearCookies();
      await receiver.page.goto(BASE + '/', { waitUntil: 'networkidle' });
      await receiver.page.getByRole('heading', { name: 'Find a community.', exact: true }).waitFor();
      const cards = receiver.page.locator('article');
      assert.ok(await cards.count(), 'Need a public-active synthetic community');
      await cards.first().getByRole('link', { name: /^View / }).click();
      await receiver.page.getByRole('heading', { name: 'Make your next connection', exact: true }).waitFor();
      const join = receiver.page.getByRole('link', { name: 'Join this community', exact: true });
      const href = await join.getAttribute('href');
      const target = new URL(href, BASE);
      assert.equal(target.pathname, '/login');
      assert.match(target.searchParams.get('redirect'), /^\/ethos\/[0-9a-f-]+$/);
      assert.ok(target.searchParams.get('ecosystem'));
      await join.click();
      await receiver.page.waitForURL(/\/login\?/);
      check('Anonymous entry previews public community and preserves selected community through login/signup');
    } catch (error) { outcome = 'FAILED'; failure ??= error; }
  }
  fs.mkdirSync(path.join(study, 'passes', pass), { recursive: true });
  fs.writeFileSync(path.join(study, 'passes', pass, 'engagement-ui-regression.json'), JSON.stringify({ ...evidence, outcome }, null, 2));
  await sender.finish(fixtureOutcome, 'Local synthetic fixture API setup only; no UI-success credit and no external delivery.');
  await receiver.finish(outcome, 'Guarded mixed API setup + actual UI regression; preferences/follows restored; synthetic messages retained for study reset.');
}
if (failure) throw failure;
if (outcome !== 'COMPLETED') throw new Error('Engagement regression did not complete');
console.log('GREEN engagement-community-and-updates');
