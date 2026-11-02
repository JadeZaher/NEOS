// Deterministic assistant transport/UI regression; live model journeys are measured separately in pass 04.
import { BASE, regression } from './support/fixtures.mjs';

await regression('p4-agent-routing-continuity', { pass: '04-decision-routing-operator' }, async (flow) => {
  const session = await flow.as('qa-new-kofi', { width: 390, height: 844 });
  const page = session.page;
  const sent = [];
  const sessionId = '10000000-0000-4000-8000-000000000004';
  const cappedId = '10000000-0000-4000-8000-000000000020';
  const historyA = '10000000-0000-4000-8000-000000000031';
  const historyB = '10000000-0000-4000-8000-000000000032';
  const historyBad = '10000000-0000-4000-8000-000000000033';
  let delayedRequest;
  let delayNextPrivacy = false;
  let delayNextHistory = false;
  let requestArrived;
  const armDelay = (kind) => {
    if (kind === 'privacy') delayNextPrivacy = true;
    else delayNextHistory = true;
    return new Promise(resolve => { requestArrived = resolve; });
  };
  const releaseDelayed = async () => {
    const request = delayedRequest;
    delayedRequest = null;
    await request.route.fulfill({ json: request.data });
    await (await request.response).finished();
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  };
  const failure = 'Only the proposer or a steward can move this proposal on.';
  const consequence = 'Your offer will be visible to members in other ecosystems.';
  const headers = { 'content-type': 'text/event-stream', 'access-control-allow-origin': BASE, 'access-control-allow-credentials': 'true' };
  const event = (type, data = '') => `event: ${type}\r\ndata: ${typeof data === 'string' ? data : JSON.stringify(data)}\r\n\r\n`;

  await page.route('**/api/v1/chat/send', async (route) => {
    if (route.request().method() === 'OPTIONS') {
      return route.fulfill({ status: 204, headers: { ...headers, 'access-control-allow-methods': 'POST', 'access-control-allow-headers': 'content-type' } });
    }
    const body = route.request().postDataJSON();
    sent.push(body);
    let mode = { mode: 'general', skill: null, source: 'decision' };
    let tools = '';
    let reply = 'A fresh conversation is ready.';
    if (body.message === 'Open the selected proposal for advice.') {
      mode = { mode: 'skill', skill: 'proposal-creation', source: 'decision' };
      tools = event('tool_start', { name: 'update_proposal_status', label: 'Moving a proposal on' })
        + event('tool_result', { name: 'update_proposal_status', success: false, error: failure });
      reply = 'I could not move it. The proposer or a steward can help.';
    } else if (body.message === 'Where is my profile?') {
      mode = { mode: 'platform', skill: null, source: 'decision' };
      reply = 'Open [Your profile](/me).';
    } else if (body.message === 'What does consent mean?') {
      mode = { mode: 'framework', skill: null, source: 'decision' };
      reply = 'Consent means there is no reasoned objection. [Open Messages](/messaging).';
    } else if (body.message === 'Publish an offer.') {
      mode = { mode: 'skill', skill: 'cross-ethos-request', source: 'decision' };
      tools = event('tool_start', { name: 'publish_share_need', label: 'Publishing your offer' })
        + event('tool_result', { name: 'publish_share_need', success: false, needs_confirmation: consequence });
      reply = 'Shall I publish this offer?';
    } else if (body.message === 'Check an interrupted result.') {
      tools = event('tool_start', { name: 'record_advice', label: 'Recording advice' })
        + event('tool_result', { name: 'record_advice', success: true })
        + event('tool_start', { name: 'join_domain', label: 'Joining the group' });
      reply = '';
    } else if (body.message.startsWith('No,')) reply = 'Cancelled. Nothing was published.';
    await route.fulfill({ status: 200, headers, body: event('skill_route', mode)
      + event('routing_debug', { value: 'DO_NOT_SHOW_PROTOCOL' }) + tools + event('append', reply)
      + event('session', { session_id: sessionId }) + (body.message === 'Check an interrupted result.' ? '' : event('done')) });
  });

  await page.route('**/api/v1/chat/sessions**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (route.request().method() === 'OPTIONS') {
      return route.fulfill({ status: 204, headers: { ...headers, 'access-control-allow-methods': 'GET, PATCH', 'access-control-allow-headers': 'content-type' } });
    }
    const privacyRequest = path.endsWith('/privacy');
    if (path.endsWith(historyBad)) return route.fulfill({ json: { id: historyBad, messages: null } });
    const historyRequest = path.endsWith(historyA) || path.endsWith(historyB);
    const historyId = path.endsWith(historyA) ? historyA : historyB;
    const detail = { id: historyId, title: historyId === historyA ? 'History A' : 'History B', skill: null,
      privacy: 'private', share_token: null, messages: [{ role: 'user', content: `Question in ${historyId === historyA ? 'A' : 'B'}` },
        { role: 'assistant', content: `Answer in ${historyId === historyA ? 'A' : 'B'}` }] };
    const privacyData = { privacy: 'ecosystem', share_token: 'OLD-A-LINK-MUST-NOT-APPEAR' };
    if ((privacyRequest && delayNextPrivacy) || (historyRequest && delayNextHistory)) {
      delayNextPrivacy = false;
      delayNextHistory = false;
      delayedRequest = { route, data: privacyRequest ? privacyData : detail,
        response: page.waitForResponse(response => response.url() === route.request().url() && response.request().method() === route.request().method()) };
      requestArrived();
      return;
    }
    if (privacyRequest || historyRequest) return route.fulfill({ json: privacyRequest ? privacyData : detail });
    const data = path.endsWith(cappedId) ? {
      id: cappedId, title: 'Capped operator regression', skill: null, privacy: 'private', share_token: null,
      messages: Array.from({ length: 20 }, (_, i) => [
        { role: 'user', content: `Earlier question ${i + 1}` }, { role: 'assistant', content: `Earlier answer ${i + 1}` },
      ]).flat(),
    } : { sessions: [{ id: cappedId, title: 'Capped operator regression', message_count: 40 },
      { id: historyA, title: 'History A', message_count: 2 }, { id: historyB, title: 'History B', message_count: 2 },
      { id: historyBad, title: 'History unavailable', message_count: 2 }] };
    await route.fulfill({ json: data });
  });

  const panel = () => page.getByRole('dialog', { name: 'Communications', exact: true });
  async function openAgent() {
    await page.getByRole('button', { name: 'Open communications', exact: true }).click();
    await panel().getByRole('button', { name: 'AI Chat', exact: true }).click();
  }
  async function send(text) {
    await panel().getByRole('textbox', { name: 'Message the governance agent' }).fill(text);
    await panel().getByRole('button', { name: 'Send message', exact: true }).click();
    await panel().getByRole('button', { name: 'Stop response' }).waitFor({ state: 'hidden' });
  }
  const input = () => panel().getByRole('textbox', { name: 'Message the governance agent' });
  const chooseHistory = async (name) => {
    await panel().getByRole('button', { name: 'Chat history', exact: true }).click();
    await panel().getByRole('button', { name: new RegExp(name) }).click();
  };
  const expectPrivateWithoutLink = async () => {
    await panel().getByRole('button', { name: 'Conversation visibility: private', exact: true }).waitFor();
    if (await panel().getByRole('button', { name: 'Copy share link', exact: true }).count()) throw flow.red('a prior conversation supplied the current share link');
  };

  session.step('Keep an unsent draft when closing the drawer or switching tabs');
  await openAgent();
  await input().fill('Keep this draft.');
  await panel().getByRole('button', { name: 'Close communications', exact: true }).click();
  if (!(await page.getByRole('button', { name: 'Open communications', exact: true }).evaluate(node => node === document.activeElement))) throw flow.red('closing the drawer did not return focus to its launcher');
  await openAgent();
  if (await input().inputValue() !== 'Keep this draft.') throw flow.red('closing the drawer discarded the draft');
  await panel().getByRole('button', { name: /^Messaging(?:\s+\d+\+?)?$/ }).click();
  await panel().getByRole('button', { name: 'AI Chat', exact: true }).click();
  if (await input().inputValue() !== 'Keep this draft.') throw flow.red('switching tabs discarded the draft');

  session.step('A skill reply shows the refusal; a direct reply clears the skill');
  await send('Open the selected proposal for advice.');
  await panel().getByText(failure, { exact: true }).waitFor();
  if ((await panel().getByTestId('agent-reply-mode').last().innerText()) !== 'Guided process: Proposal creation') throw flow.red('the selected process has no readable mode label');
  await send('Where is my profile?');
  if ((await panel().getByTestId('agent-reply-mode').last().innerText()) !== 'Platform help') throw flow.red('a platform reply kept the previous skill label');
  if (sent[1].session_id !== sessionId || sent[1].active_skill !== 'proposal-creation' || sent[1].requested_skill !== null) throw flow.red('the next turn did not preserve the session and automatic routing hint');
  if ((await panel().innerText()).includes('DO_NOT_SHOW_PROTOCOL')) throw flow.red('an unknown routing event leaked into the reply');

  session.step('Follow a record link and continue the same conversation');
  await input().fill('A draft for after navigation.');
  await panel().getByRole('link', { name: 'Your profile', exact: true }).click();
  await page.waitForURL(/\/me$/);
  await openAgent();
  if (await input().inputValue() !== 'A draft for after navigation.') throw flow.red('following a record link discarded the draft');
  await panel().getByText('Where is my profile?', { exact: true }).waitFor();
  await send('What does consent mean?');
  if (sent[2].session_id !== sessionId || sent[2].active_skill !== null) throw flow.red('the prior skill was not cleared before the next turn');
  if ((await panel().getByTestId('agent-reply-mode').last().innerText()) !== 'Governance guide') throw flow.red('framework help has no readable mode label');
  await panel().getByRole('link', { name: 'Open Messages', exact: true }).click();
  await page.waitForURL(/\/messaging$/);
  await openAgent();
  await panel().getByText('What does consent mean?', { exact: true }).waitFor();
  if (await panel().getByRole('button', { name: 'Messaging', exact: true }).count()) throw flow.red('the Messages page offers a duplicate human-messaging panel');

  session.step('Confirmation states the consequence and cancellation stays visible');
  await send('Publish an offer.');
  const confirm = panel().getByRole('group', { name: 'Confirm this action' });
  await confirm.getByText(consequence, { exact: true }).waitFor();
  if (await confirm.getByText('This cannot be undone', { exact: true }).count()) throw flow.red('a generic irreversible-action claim replaced the actual consequence');
  await confirm.getByRole('button', { name: 'No, cancel', exact: true }).click();
  await panel().locator('.prose').getByText('Cancelled. Nothing was published.', { exact: true }).waitFor();

  session.step('An interrupted action result asks the member to check the record');
  await send('Check an interrupted result.');
  await panel().getByText('The reply stopped before this result arrived. Check the record before trying again.', { exact: true }).waitFor();
  await panel().getByText('check the record', { exact: true }).waitFor();

  session.step('Expanded mobile chat stays inside the viewport');
  await panel().getByRole('button', { name: 'Expand', exact: true }).click();
  const bounds = await panel().boundingBox();
  if (!bounds || bounds.x < -1 || bounds.x + bounds.width > 391 || bounds.y < -1) throw flow.red('expanded mobile chat extends outside the 390px viewport');
  await session.shot('agent-expanded-mobile');
  await page.setViewportSize({ width: 390, height: 500 });
  const shortBounds = await panel().boundingBox();
  if (!shortBounds || shortBounds.y < -1 || shortBounds.y + shortBounds.height > 501) throw flow.red('expanded chat clips its controls on a short mobile viewport');
  await page.setViewportSize({ width: 390, height: 844 });

  session.step('Recover at the message cap without losing the unsent next question');
  await panel().getByRole('button', { name: 'Chat history', exact: true }).click();
  await panel().getByRole('button', { name: /Capped operator regression/ }).click();
  await panel().getByText(/This conversation has reached 20 messages/).waitFor();
  const resume = 'Resume this in a new conversation.';
  await input().fill(resume);
  const before = sent.length;
  if (!(await panel().getByRole('button', { name: 'Send message', exact: true }).isDisabled())) throw flow.red('send remains enabled after the conversation limit');
  await input().press('Enter');
  if (sent.length !== before || await input().inputValue() !== resume) throw flow.red('the capped composer sent or discarded the next draft');
  await panel().getByRole('button', { name: 'Start a new conversation', exact: true }).click();
  if (await input().inputValue() !== resume) throw flow.red('starting a new conversation discarded the next draft');
  await send(resume);
  if (sent[sent.length - 1].session_id !== null || sent[sent.length - 1].active_skill !== null) throw flow.red('new conversation retained an old session or skill');

  session.step('A delayed privacy response cannot share a new or newly loaded conversation');
  for (const destination of ['new', 'history']) {
    await chooseHistory('History A');
    await panel().locator('.prose').getByText('Answer in A', { exact: true }).waitFor();
    const arrived = armDelay('privacy');
    await panel().getByRole('button', { name: 'Conversation visibility: private', exact: true }).click();
    await arrived;
    if (destination === 'new') {
      await panel().getByRole('button', { name: 'Clear', exact: true }).click();
      await send('New conversation while A privacy is pending.');
    } else {
      await chooseHistory('History B');
      await panel().locator('.prose').getByText('Answer in B', { exact: true }).waitFor();
    }
    await releaseDelayed();
    await expectPrivateWithoutLink();
  }

  session.step('A delayed history selection cannot replace a new or newer selected conversation');
  for (const destination of ['new', 'history']) {
    const arrived = armDelay('history');
    await chooseHistory('History A');
    await arrived;
    if (destination === 'new') {
      await panel().getByRole('button', { name: 'New', exact: true }).click();
      await send('New conversation while A history is pending.');
    } else {
      await panel().getByRole('button', { name: /History B/ }).click();
      await panel().locator('.prose').getByText('Answer in B', { exact: true }).waitFor();
    }
    await releaseDelayed();
    if (await panel().locator('.prose').getByText('Answer in A', { exact: true }).count()) throw flow.red('a delayed history response replaced the current conversation');
    await expectPrivateWithoutLink();
  }

  session.step('Continuing the current chat after closing history cancels its delayed selection');
  const arrived = armDelay('history');
  await chooseHistory('History A');
  await arrived;
  await panel().getByRole('button', { name: 'Close communications', exact: true }).click();
  await openAgent();
  await send('Keep this conversation after reopening.');
  await releaseDelayed();
  await panel().getByText('Keep this conversation after reopening.', { exact: true }).waitFor();
  if (await panel().locator('.prose').getByText('Answer in A', { exact: true }).count()) throw flow.red('a delayed history selection replaced the continued chat after reopening');
  await expectPrivateWithoutLink();

  session.step('A malformed saved conversation gives a load error and retains the current chat');
  await chooseHistory('History unavailable');
  await panel().getByRole('alert').filter({ hasText: 'Could not load this conversation. Try again.' }).waitFor();
  await panel().getByRole('button', { name: 'Back to chat', exact: true }).click();
  await panel().getByText('Keep this conversation after reopening.', { exact: true }).waitFor();
});
