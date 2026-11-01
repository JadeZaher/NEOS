// p2-stewards-confirm-and-register-13: opening a conversation with an unread message clears its unread badge in the list.
// Checked within seconds of opening the page, well inside the list's 30 s poll: the list must refresh after the read and the badge clear.
import { BASE, MARKER, eventually, regression } from "./support/fixtures.mjs";

const TITLE = `Regression unread badge (${MARKER})`;
const BADGE = /^\d+( unread)?$/i;  // "2 unread" (the badge renders it upper-case), or a bare count

await regression("p2-stewards-confirm-and-register-13", { pass: "02-act-lifecycle" }, async (flow) => {
  const sender = await flow.as("qa-new-kofi");
  const reader = await flow.as("qa-new-joy");

  const listed = await sender.request("GET", "/api/v1/messaging/conversations");
  let conversation = (listed.body?.conversations || []).find((c) => c.title === TITLE);
  if (!conversation) {
    const created = await sender.request("POST", "/api/v1/messaging/conversations", { type: "group", title: TITLE, participant_ids: [reader.memberId] });
    if (created.status !== 201) throw new Error(`create conversation -> ${created.status} ${JSON.stringify(created.body).slice(0, 200)}`);
    conversation = created.body;
  }
  const sent = await sender.request("POST", `/api/v1/messaging/conversations/${conversation.id}/messages`, { content: `Regression message, please read it. ${MARKER}` });
  if (sent.status !== 201) throw new Error(`send message -> ${sent.status}`);

  const { page } = reader;
  reader.step("Open messaging with an unread message waiting");
  await page.goto(`${BASE}/messaging`, { waitUntil: "networkidle" });
  const row = page.getByRole("button").filter({ hasText: TITLE }).first();
  await row.waitFor({ timeout: 10000 });
  const badgeShown = async () => (await row.innerText()).split("\n").map((line) => line.trim()).some((line) => BADGE.test(line));
  if (!(await badgeShown())) throw new Error("precondition: the conversation shows no unread badge before it is opened");

  reader.step("Open the conversation and read it");
  // The read happens when the conversation loads (the server marks it read); the list must refresh after that.
  const detailPath = `/api/v1/messaging/conversations/${conversation.id}`;
  let readAt = 0;
  let refreshedAfterRead = false;
  page.on("response", (response) => { if (new URL(response.url()).pathname === detailPath) readAt ||= Date.now(); });
  page.on("request", (request) => {
    if (readAt && request.method() === "GET" && new URL(request.url()).pathname === "/api/v1/messaging/conversations") refreshedAfterRead = true;
  });
  await row.click();
  await page.getByRole("heading", { name: TITLE }).waitFor({ timeout: 10000 });
  const cleared = await eventually(flow, "", async () => !(await badgeShown()), 4000).then(() => true, () => false);
  const listRefreshed = refreshedAfterRead;  // read before the diagnostic request below, which is itself a list GET
  if (!listRefreshed) throw flow.red("opening and reading the conversation did not refresh the list: the unread badge waits for the next 30 s poll");
  if (!cleared) {
    const unread = (await reader.request("GET", "/api/v1/messaging/conversations")).body?.conversations?.find((c) => c.id === conversation.id)?.unread_count;
    throw flow.red(`the list was refreshed after reading, but the server still counts ${unread} unread (is the API running the read-watermark fix?)`);
  }
});
