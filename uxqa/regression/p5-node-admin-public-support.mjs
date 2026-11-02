// Deterministic UI transport coverage; these mocked commands make no governance or grant writes.
import { BASE, regression } from './support/fixtures.mjs';

await regression('p5-node-admin-public-support', { pass: '05-operator-ui-follow-through' }, async flow => {
  const session = await flow.as('qa-new-kofi', { width: 390, height: 844 });
  const page = session.page;
  const me = (await session.request('GET', '/api/v1/auth/me')).body;
  const actor = me.user?.id || '20000000-0000-4000-8000-000000000001';
  const target = '20000000-0000-4000-8000-000000000002';
  const organization = '20000000-0000-4000-8000-000000000003';
  const record = '20000000-0000-4000-8000-000000000004';
  const auditId = '20000000-0000-4000-8000-000000000005';
  let authenticated = true;
  let admin = true;
  let rejectRevoke = true;
  const commands = [];
  let inspections = 0;
  const memberRequests = [];
  page.on('request', request => {
    const path = new URL(request.url()).pathname;
    if (['/api/v1/messaging/conversations', '/api/v1/discover/shares-needs/admin', '/api/v1/me/next-steps', '/api/v1/safeguards', '/api/v1/emergency/active'].includes(path.replace(/\/$/, ''))) memberRequests.push(path);
  });
  const chats = [];
  const assignments = [{ user_id: actor, display_name: 'Support Operator', active: true, granted_at: new Date().toISOString(), granted_by_user_id: null, revoked_at: null }];
  const audit = { id: auditId, actor_user_id: actor, actor_name: 'Support Operator', action: 'create', resource_type: 'proposals', resource_id: record, organization_id: organization, reason: 'Data correction', outcome: 'success', changed_fields: ['title', 'proposed_change'], created_at: new Date().toISOString() };
  const deniedAudit = { ...audit, id: '20000000-0000-4000-8000-000000000006', actor_user_id: '20000000-0000-4000-8000-000000000007', actor_name: 'Ordinary Tester', action: 'inspect', outcome: 'denied', reason: 'Technical support', changed_fields: [] };
  const records = [];
  const json = (route, body, status = 200) => route.fulfill({ status, json: body });
  await page.route('**/api/v1/auth/me', route => authenticated ? json(route, { ...me, user: { id: actor, display_name: 'Support Operator', username: 'support-operator' }, member: null, ecosystems: [], pending_consents: [], is_node_admin: admin, is_platform_admin: admin }) : json(route, { error: 'Sign in required' }, 401));
  await page.route('**/api/v1/node-admin/**', async route => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (path.endsWith('/roster')) return json(route, { items: assignments.filter(item => item.active).map(item => ({ user_id: item.user_id, display_name: item.display_name })) });
    if (path.endsWith('/audit')) return json(route, { items: [audit, deniedAudit], total: 2, page: 1, per_page: 20 });
    if (path.endsWith(`/audit/${auditId}`)) return json(route, audit);
    if (!admin) return json(route, { error: 'Node admin access required' }, 403);
    if (path.endsWith('/catalog')) return json(route, { reason_categories: ['Technical support', 'Account recovery', 'Organization support', 'Agent testing', 'Data correction', 'Access management', 'Service recovery'], organizations: [{ id: organization, name: 'Organization without your membership' }], items: [{ key: 'proposals', label: 'Proposals', organization_scoped: true, listing_fields: ['id', 'status', 'ecosystem_id'], actions: ['inspect', 'create', 'update', 'override_state'], fields: [
      { name: 'title', label: 'Title', type: 'text', editable: true, required: true },
      { name: 'proposed_change', label: 'Proposed change', type: 'text', editable: true, required: true },
      { name: 'ecosystem_id', label: 'Ecosystem id', type: 'reference', editable: true, required: true },
      { name: 'status', label: 'Status', type: 'text', editable: true, required: false, options: ['draft', 'advice'] },
      { name: 'proposer_member_id', label: 'Proposer member id', type: 'reference', editable: false, required: false },
    ] }] });
    if (path.endsWith('/resources/proposals')) { const q = new URL(request.url()).searchParams.get('q'); const items = q ? records.filter(item => item.id === q) : records; return json(route, { items, total: items.length, page: 1, per_page: 20 }); }
    if (path.endsWith('/commands')) {
      const command = request.postDataJSON(); commands.push(command);
      records.splice(0, records.length, { id: record, ecosystem_id: organization, status: 'draft', version: 'v1', ...command.values });
      return json(route, { resource: records[0], audit_id: auditId, audit_url: `/node/audit/${auditId}` });
    }
    if (path.endsWith('/inspect')) { inspections++; return json(route, { resource: records[0], audit_id: auditId, audit_url: `/node/audit/${auditId}` }); }
    if (path.endsWith('/users')) return json(route, { items: [{ id: target, display_name: 'Second Operator', username: 'second-operator' }] });
    if (path.endsWith('/admins') && request.method() === 'GET') return json(route, { items: assignments });
    if (path.endsWith('/admins')) {
      const data = request.postDataJSON();
      assignments.push({ user_id: data.user_id, display_name: 'Second Operator', active: true, granted_at: new Date().toISOString(), granted_by_user_id: actor, revoked_at: null });
      return json(route, { user_id: data.user_id, active: true, audit_id: auditId, audit_url: `/node/audit/${auditId}` });
    }
    if (path.endsWith('/revoke')) {
      if (rejectRevoke) return json(route, { error: 'The last node administrator cannot be revoked; assign another first' }, 409);
      const revokedUserId = path.split('/').at(-2);
      const assignment = assignments.find(item => item.user_id === revokedUserId);
      if (assignment) { assignment.active = false; assignment.revoked_at = new Date().toISOString(); }
      if (revokedUserId === actor) admin = false;
      return json(route, { user_id: revokedUserId, active: false, audit_id: auditId, audit_url: `/node/audit/${auditId}` });
    }
    return json(route, { error: 'Unknown mocked support request' }, 404);
  });
  await page.route('**/api/v1/chat/send', route => {
    chats.push(route.request().postDataJSON());
    const event = (type, data) => `event: ${type}\ndata: ${typeof data === 'string' ? data : JSON.stringify(data)}\n\n`;
    return route.fulfill({ headers: { 'content-type': 'text/event-stream' }, body: event('append', 'The separate support conversation is ready.') + event('session', { session_id: `30000000-0000-4000-8000-${String(chats.length).padStart(12, '0')}` }) + event('done', '') });
  });
  await page.goto(`${BASE}/admin`, { waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: 'Node Administration', exact: true }).waitFor();
  await page.getByLabel('Support organization', { exact: true }).selectOption(organization);
  await page.getByRole('button', { name: 'Propose for an organization', exact: true }).click();
  await page.getByLabel('Title (required)', { exact: true }).fill('Support-created proposal');
  await page.getByLabel('Proposed change (required)', { exact: true }).fill('Recover the missing governance draft without impersonating a member.');
  await page.getByLabel('Public support reason category (required)', { exact: true }).selectOption(audit.reason);
  await page.getByRole('button', { name: 'Review support action', exact: true }).click();
  const review = page.getByRole('alertdialog');
  await review.getByRole('heading', { name: 'Confirm public support action' }).waitFor();
  if (commands.length) throw flow.red('Review submitted the command before confirmation.');
  if (!(await review.innerText()).includes('Public reason category: Data correction')) throw flow.red('The review did not show the exact category stored publicly.');
  if (!(await review.innerText()).includes(organization)) throw flow.red('The review did not identify the target organization.');
  await review.getByRole('button', { name: 'Confirm and record action', exact: true }).click();
  await page.getByRole('link', { name: 'View public audit receipt' }).waitFor();
  if (commands.length !== 1 || commands[0].organization_id !== organization || commands[0].values.title !== 'Support-created proposal' || 'proposer_member_id' in commands[0].values || 'ecosystem_id' in commands[0].values) throw flow.red('The reviewed on-behalf command lost scope or manufactured a membership identity.');

  await page.goto(`${BASE}/admin?resource=proposals&record=${record}&organization_id=${organization}`, { waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: 'Node Administration', exact: true }).waitFor();
  if (await page.getByLabel('Feature / resource', { exact: true }).inputValue() !== 'proposals' || await page.getByLabel('Support organization', { exact: true }).inputValue() !== organization || await page.getByLabel('Find records', { exact: true }).inputValue() !== record) throw flow.red('The support receipt did not select the catalog resource, organization and record filter.');
  if (await page.getByRole('button', { name: 'Inspect and manage', exact: true }).count() !== 1 || inspections !== 0) throw flow.red('The deep link failed to isolate the record or automatically inspected private content.');
  await page.getByRole('button', { name: 'Inspect and manage', exact: true }).click();
  await page.getByLabel('Public support reason category (required)', { exact: true }).selectOption('Technical support');
  await page.getByRole('button', { name: 'Record inspection and open details', exact: true }).click();
  await page.getByText('Recover the missing governance draft without impersonating a member.', { exact: true }).waitFor();
  if (inspections !== 1 || commands.length !== 1) throw flow.red('Explicit deep-link inspection did not remain a read-only audited step.');
  await page.getByRole('button', { name: 'Close record', exact: true }).click();
  if (memberRequests.length) throw flow.red('A memberless node admin started ordinary member requests: ' + memberRequests.join(', '));

  await page.getByLabel('Public reason category for this support session (required)').selectOption('Technical support');
  await page.getByRole('button', { name: 'Start agent support for Organization without your membership', exact: true }).click();
  const drawer = page.getByRole('dialog', { name: 'Communications', exact: true });
  await drawer.getByText(`Node admin support for organization ${organization}`, { exact: true }).waitFor();
  const input = drawer.getByRole('textbox', { name: /message|ask/i });
  // The composer has no platform-specific locator; its textbox is the only multiline field in the chat panel.
  const composer = await input.count() === 1 ? input : drawer.locator('textarea');
  await composer.fill('Check the support scope.');
  await drawer.getByRole('button', { name: 'Send message', exact: true }).click();
  await drawer.locator('.prose').getByText('The separate support conversation is ready.', { exact: true }).waitFor();
  if (chats[0]?.session_id !== null || chats[0]?.support_context?.enabled !== true || chats[0]?.support_context?.organization_id !== organization || chats[0]?.support_context?.reason !== 'Technical support') throw flow.red('The support session did not start fresh with explicit context.');
  if (await drawer.getByRole('button', { name: /^Conversation visibility/ }).count()) throw flow.red('Support history exposed conversation sharing controls.');
  await drawer.getByRole('button', { name: 'Leave support mode and start member chat', exact: true }).click();
  await composer.fill('Explain proposals as a member.');
  await Promise.all([page.waitForResponse(response => response.url().endsWith('/api/v1/chat/send') && response.request().postDataJSON()?.message === 'Explain proposals as a member.'), drawer.getByRole('button', { name: 'Send message', exact: true }).click()]);
  if (chats[1]?.session_id !== null || chats[1]?.history?.length || chats[1]?.support_context) throw flow.red('Leaving support reused the privileged session or context.');
  await drawer.getByRole('button', { name: 'Close communications', exact: true }).click();

  await page.getByRole('button', { name: 'Node admins', exact: true }).click();
  await page.getByLabel('Find a user to grant node admin').fill('Second');
  await page.getByRole('button', { name: /Second Operator.*second-operator/ }).click();
  await page.getByLabel('Public reason category (required)', { exact: true }).selectOption('Access management');
  await page.getByRole('button', { name: 'Review grant', exact: true }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Confirm and record action', exact: true }).click();
  await page.getByText('User: ' + target, { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Select for revocation' }).first().click();
  await page.getByLabel('Public reason category (required)', { exact: true }).selectOption('Access management');
  await page.getByRole('button', { name: 'Review revocation', exact: true }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Confirm and record action', exact: true }).click();
  await page.getByRole('alert').getByText('The last node administrator cannot be revoked; assign another first', { exact: true }).waitFor();
  rejectRevoke = false;
  await page.getByRole('alertdialog').getByRole('button', { name: 'Confirm and record action', exact: true }).click();
  await page.getByRole('heading', { name: 'Access Denied', exact: true }).waitFor();

  authenticated = false;
  await page.goto(`${BASE}/node/audit/${auditId}`, { waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: 'Public node support history', exact: true }).waitFor();
  await page.getByText(audit.reason, { exact: false }).waitFor();
  if (await page.getByRole('button', { name: /delete|edit/i }).count()) throw flow.red('Public audit exposed mutation controls.');
  const text = await page.locator('#main-content').innerText();
  if (text.includes('Recover the missing governance draft')) throw flow.red('Public audit rendered a private proposal body.');
  await page.goto(`${BASE}/node/audit`, { waitUntil: 'networkidle' });
  const deniedArticle = page.getByRole('article', { name: 'inspect by Ordinary Tester', exact: true });
  await deniedArticle.waitFor();
  if (await deniedArticle.getByText('Node admin', { exact: true }).count()) throw flow.red('A denied ordinary actor received a Node admin badge in public audit history.');
  const officialRoster = page.getByRole('region', { name: 'Official node support operators', exact: true });
  await officialRoster.getByText('Second Operator', { exact: true }).waitFor();
  if (await officialRoster.getByText('Node admin', { exact: true }).count() !== 1) throw flow.red('The official active operator roster lost its server-derived Node admin badge.');
});
