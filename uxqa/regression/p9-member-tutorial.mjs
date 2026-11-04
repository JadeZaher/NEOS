import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
process.env.UXQA_STUDY_DIR = path.join(root, 'uxqa');
const plugin = process.env.UXQA_PLUGIN_ROOT || 'C:/Users/atooz/.claude/plugins/cache/local/ux-qa-research/0.1.0';
const { uxSession, BASE } = await import(pathToFileURL(path.join(plugin, 'lib/ux-lib.mjs')).href);
assert.ok(['localhost', '127.0.0.1'].includes(new URL(BASE).hostname), 'Refusing a nonlocal target');
const pass = process.env.UXQA_PASS || '09-member-tutorial';
const out = path.join(root, 'uxqa/passes', pass);
fs.mkdirSync(out, { recursive: true });
const fixtures = JSON.parse(fs.readFileSync(path.join(root, 'uxqa/passes/06-safety-integrity/prebake.json'), 'utf8')).fixtures;
const target = fixtures.gatedEcosystem.id;
const username = `uxqa_p9_${Date.now()}`;
const report = { username, target, outcome: 'FAILED', checks: [], fixtureSetup: [], tutorialMutations: [], externalSends: 0 };
const check = name => report.checks.push(name);
async function read(session, url) {
  const response = await session.request('GET', url);
  assert.equal(response.status, 200, url);
  return response.body;
}
function membershipState(me) {
  return {
    memberships: me.ecosystems.map(row => ({ id: row.id, status: row.membership_status })).sort((a, b) => a.id.localeCompare(b.id)),
    pending: me.pending_consents.map(row => row.ecosystem_id).sort(),
    nodeAdmin: me.is_node_admin,
  };
}
async function noTour(page) {
  assert.equal(await page.getByRole('dialog').count(), 0, 'Unexpected tutorial dialog');
}
async function fits(page) {
  const dimensions = await page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"]')?.getBoundingClientRect();
    const header = document.querySelector('header');
    return {
      viewport: window.innerWidth,
      pageWidth: document.documentElement.scrollWidth,
      dialog: dialog && { left: dialog.left, right: dialog.right, top: dialog.top, bottom: dialog.bottom },
      height: window.innerHeight,
      headerFits: !header || header.scrollWidth <= header.clientWidth + 1,
    };
  });
  assert.ok(dimensions.pageWidth <= dimensions.viewport + 1, `Horizontal page overflow: ${JSON.stringify(dimensions)}`);
  assert.equal(dimensions.headerFits, true, 'Header controls overflow their container');
  if (dimensions.dialog) {
    assert.ok(dimensions.dialog.left >= -1 && dimensions.dialog.right <= dimensions.viewport + 1, 'Dialog overflows horizontally');
    assert.ok(dimensions.dialog.top >= -1 && dimensions.dialog.bottom <= dimensions.height + 1, 'Dialog overflows viewport height');
  }
}
async function focusedInside(page) {
  assert.equal(await page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]')), true, 'Focus escaped the tutorial');
}

const guard = await uxSession({ handle: 'qa-member-ines', task: 'p9-tutorial-readonly-guard', pass, mode: 'probe' });
let otherCookies;
let guardOutcome = 'FAILED';
try {
  await guard.page.goto(BASE + '/agreements', { waitUntil: 'networkidle' });
  assert.equal((await read(guard, '/api/v1/settings/?key=uxqa_environment')).value?.db, 'neos_uxqa', 'Refusing a non-study database');
  assert.equal((await read(guard, '/api/v1/engagement/capabilities')).external_delivery_enabled, false, 'Refusing enabled external delivery');
  const other = await read(guard, '/api/v1/auth/me');
  assert.ok(other.ecosystems.some(row => row.membership_status === 'active'), 'Ines needs active membership');
  otherCookies = await guard.page.context().cookies();
  guardOutcome = 'COMPLETED';
} finally {
  await guard.finish(guardOutcome, 'Read-only localhost/database/external-delivery guard. Synthetic identity cookies retained only in memory for the owner-switch probe.');
}

const session = await uxSession({ task: 'p9-first-community-and-tutorial', pass, mode: 'probe' });
const page = session.page;
let failure;
let observeTutorialWrites = false;
page.on('request', request => {
  const url = new URL(request.url());
  if (observeTutorialWrites && url.origin === new URL(BASE).origin && url.pathname.startsWith('/api/') && !['GET', 'HEAD', 'OPTIONS'].includes(request.method())) {
    report.tutorialMutations.push({ method: request.method(), path: url.pathname });
  }
});
try {
  await page.goto(BASE + '/communities', { waitUntil: 'networkidle' });
  await page.getByLabel('Search communities', { exact: true }).fill(fixtures.gatedEcosystem.title);
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await page.locator(`a[href="/communities/${target}"]`).click();
  await page.getByRole('link', { name: 'Join this community', exact: true }).click();
  await page.waitForURL(/\/login\?/);
  assert.equal(new URL(page.url()).searchParams.get('ecosystem'), target);
  await page.getByLabel('Display Name (optional)', { exact: true }).fill('UXQA P9 Tutorial Member');
  await page.getByLabel('Username', { exact: true }).fill(username);
  const password = randomUUID() + 'Aa9!';
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByLabel('Confirm Password', { exact: true }).fill(password);
  const registration = page.waitForResponse(response => new URL(response.url()).pathname === '/api/v1/auth/register' && response.request().method() === 'POST');
  await page.getByRole('button', { name: 'Create Account', exact: true }).click();
  assert.equal((await registration).status(), 200);
  await page.waitForURL(/\/welcome\/consent/);
  await page.getByRole('heading', { name: 'Before you take part in ' + fixtures.gatedEcosystem.title, exact: true }).waitFor();
  const pending = await read(session, '/api/v1/auth/me');
  assert.equal(pending.ecosystems.length, 1);
  assert.equal(pending.ecosystems[0].id, target);
  assert.equal(pending.ecosystems[0].membership_status, 'pending_consent');
  assert.equal(pending.is_node_admin, false);
  await noTour(page);
  assert.equal(await page.getByRole('button', { name: 'Platform tour', exact: true }).count(), 0);
  await page.screenshot({ path: path.join(out, 'tutorial-pending-gates.png'), fullPage: true });
  check('Ordinary first-community signup remains pending; neither automatic tutorial nor replay bypasses configured entry requirements');

  await page.getByRole('button', { name: 'Start entry quiz', exact: true }).click();
  await page.waitForURL(new RegExp('/quiz/take/' + fixtures.gatedQuiz.id));
  await noTour(page);
  await page.getByRole('radio', { name: 'Ask the group first', exact: true }).check();
  await page.getByRole('button', { name: 'Submit Quiz', exact: true }).click();
  await page.waitForURL(/\/quiz\/results\//);
  await page.getByRole('button', { name: 'Continue where I started', exact: true }).click();
  await page.waitForURL(/\/welcome\/consent/);
  assert.equal((await read(session, '/api/v1/auth/me')).ecosystems[0].membership_status, 'pending_consent');
  await noTour(page);
  await page.getByRole('link', { name: 'Read and consent', exact: true }).click();
  await page.getByLabel('Your explicit consent', { exact: true }).fill('I have read this synthetic UXQA agreement and consent as this tutorial test account.');
  await page.getByRole('button', { name: 'Record My Consent', exact: true }).click();
  await page.getByText(/You consented to v/).waitFor();
  await page.goto(BASE + '/welcome/consent', { waitUntil: 'networkidle' });
  const finishMembership = page.getByRole('button', { name: 'Check my membership', exact: true });
  if (await finishMembership.count()) await finishMembership.click();
  await page.getByRole('heading', { name: "You're an active member", exact: true }).waitFor();
  const admitted = await read(session, '/api/v1/auth/me');
  const baseline = membershipState(admitted);
  assert.equal(admitted.ecosystems[0].membership_status, 'active');
  assert.equal(admitted.pending_consents.length, 0);
  report.fixtureSetup.push('Unique ordinary account joined the selected local fixture through its real visible quiz and agreement-consent forms; retained for study reset');
  await noTour(page);
  observeTutorialWrites = true;

  await page.goto(BASE + '/agreements', { waitUntil: 'networkidle' });
  await noTour(page);
  check('First active membership does not interrupt a consent-success page or a deep-linked working page');
  await page.goto(BASE + '/dashboard', { waitUntil: 'networkidle' });
  const dialog = page.getByRole('dialog');
  await dialog.waitFor();
  await fits(page);
  await focusedInside(page);
  const firstTitle = await dialog.getByRole('heading').innerText();
  await page.screenshot({ path: path.join(out, 'tutorial-first-active-desktop.png'), fullPage: true });
  check('First active member gets an automatic tutorial on the dashboard, after both required joining steps');

  await dialog.getByRole('button', { name: 'Next', exact: true }).click();
  const secondTitle = await dialog.getByRole('heading').innerText();
  assert.notEqual(secondTitle, firstTitle);
  await dialog.getByRole('button', { name: 'Back', exact: true }).click();
  assert.equal(await dialog.getByRole('heading').innerText(), firstTitle);
  await dialog.getByRole('button', { name: 'Next', exact: true }).click();
  for (let index = 0; index < 12; index++) {
    await page.keyboard.press('Tab');
    await focusedInside(page);
  }
  await page.keyboard.press('Escape');
  await dialog.waitFor({ state: 'hidden' });
  assert.equal(await page.getByRole('button', { name: 'Platform tour', exact: true }).evaluate(node => node === document.activeElement), true);
  await page.reload({ waitUntil: 'networkidle' });
  await noTour(page);
  await page.getByRole('button', { name: 'Platform tour', exact: true }).click();
  assert.equal(await dialog.getByRole('heading').innerText(), secondTitle);
  check('Back/Next work; keyboard focus stays inside the dialog; Escape pauses and returns focus; reload does not nag and replay resumes the saved step');

  await dialog.getByRole('button', { name: 'Restart tour', exact: true }).click();
  assert.equal(await dialog.getByRole('heading').innerText(), firstTitle);
  const visitedTitles = [];
  for (let step = 0; step < 15; step++) {
    visitedTitles.push(await dialog.getByRole('heading').innerText());
    await focusedInside(page);
    const finish = dialog.getByRole('button', { name: 'Finish tour', exact: true });
    if (await finish.count()) {
      await finish.click();
      break;
    }
    await dialog.getByRole('button', { name: 'Next', exact: true }).click();
  }
  assert.ok(visitedTitles.length >= 6 && visitedTitles.length < 15, 'Expected a bounded, complete tutorial');
  report.titles = visitedTitles;
  await dialog.waitFor({ state: 'hidden' });
  await page.reload({ waitUntil: 'networkidle' });
  await noTour(page);
  check('Restart returns to the introduction; every step can be completed; completion remains dismissed after reload');

  await page.getByRole('button', { name: 'Platform tour', exact: true }).click();
  assert.equal(await dialog.getByRole('heading').innerText(), firstTitle);
  await dialog.getByRole('button', { name: 'Next', exact: true }).click();
  await dialog.getByRole('button', { name: 'Next', exact: true }).click();
  await dialog.getByRole('button', { name: 'Read agreements', exact: true }).click();
  await page.waitForURL(url => url.pathname === '/agreements');
  await dialog.waitFor({ state: 'hidden' });
  check('A tutorial destination opens only on deliberate activation and pauses the tour');

  await page.goto(BASE + '/discover', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Platform tour', exact: true }).click();
  await dialog.getByRole('button', { name: 'Next', exact: true }).click();
  await dialog.getByRole('button', { name: 'Next', exact: true }).click();
  await dialog.getByRole('button', { name: 'Browse shares & needs', exact: true }).click();
  await page.waitForURL(url => url.pathname === '/discover' && url.searchParams.get('tab') === 'shares-needs');
  await dialog.waitFor({ state: 'hidden' });
  assert.equal(await page.evaluate(() => {
    const active = document.activeElement;
    return active?.id === 'main-content' || active?.getAttribute('aria-label') === 'Platform tour';
  }), true, 'Query-only destination left focus on the document body');
  check('A same-page Discover tab destination closes the popup without losing keyboard focus');

  await page.goto(BASE + '/dashboard', { waitUntil: 'networkidle' });
  await noTour(page);
  await page.setViewportSize({ width: 320, height: 740 });
  const ecosystemPicker = page.getByRole('button', { name: /^Choose ecosystem:/ });
  const scopeLabel = ecosystemPicker.locator('span').first();
  assert.equal(await scopeLabel.isVisible(), true, 'Mobile header hides the selected community name');
  assert.equal(await scopeLabel.innerText(), admitted.ecosystems[0].name, 'Mobile header names the wrong selected community');
  const scopeBox = await scopeLabel.boundingBox();
  assert.ok(scopeBox && scopeBox.width >= 44 && scopeBox.height > 0, 'Mobile scope label has no readable visible area');
  const pickerBox = await ecosystemPicker.boundingBox();
  assert.ok(pickerBox && pickerBox.width >= 44 && pickerBox.height >= 44, 'Mobile community selector target must be at least 44px');
  await fits(page);
  await page.screenshot({ path: path.join(out, 'tutorial-mobile-header-320.png'), fullPage: true });
  await page.getByRole('button', { name: 'Platform tour', exact: true }).click();
  await dialog.waitFor();
  await fits(page);
  const closeBox = await dialog.getByRole('button', { name: 'Close', exact: true }).boundingBox();
  assert.ok(closeBox && closeBox.width >= 44 && closeBox.height >= 44, 'Tutorial close target must be at least 44px');
  await page.screenshot({ path: path.join(out, 'tutorial-mobile-320.png'), fullPage: true });
  await dialog.getByRole('button', { name: 'Skip for now', exact: true }).click();
  await dialog.waitFor({ state: 'hidden' });
  await fits(page);
  await page.setViewportSize({ width: 1366, height: 900 });
  check('At 320px the selected community name remains visible, the picker and close target are at least 44px, and replay/header/dialog fit without horizontal overflow');

  const ownCookies = await page.context().cookies();
  await page.context().clearCookies();
  await page.context().addCookies(otherCookies);
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await dialog.waitFor();
  assert.equal(await dialog.getByRole('heading').innerText(), firstTitle);
  await page.keyboard.press('Escape');
  await page.context().clearCookies();
  await page.context().addCookies(ownCookies);
  await page.goto(BASE + '/dashboard', { waitUntil: 'networkidle' });
  await noTour(page);
  report.fixtureSetup.push('Synthetic auth cookies switched in memory in one browser solely to test owner isolation, then the new member identity restored');
  check('Same-browser account switch starts the other member at step one on the / dashboard alias and preserves the first member’s saved state');

  assert.deepEqual(membershipState(await read(session, '/api/v1/auth/me')), baseline, 'Tutorial changed membership or governance authority');
  assert.deepEqual(report.tutorialMutations, [], 'Tutorial navigation unexpectedly wrote platform state');
  check('Tour navigation writes no API state, changes no membership requirements or role, and sends no provider messages');
  report.outcome = 'COMPLETED';
} catch (error) {
  failure = error;
  report.error = String(error.stack || error);
  await page.screenshot({ path: path.join(out, 'tutorial-failure.png'), fullPage: true }).catch(() => {});
} finally {
  fs.writeFileSync(path.join(out, 'tutorial-regression.json'), JSON.stringify(report, null, 2));
  await session.finish(report.outcome, 'Local guarded real first-community admission followed by tutorial navigation. New synthetic member/quiz/consent records retained for study reset. No external sends.');
}
if (failure) throw failure;
console.log('GREEN first-community-member-tutorial');
