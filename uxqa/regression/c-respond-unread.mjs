// c-respond-unread (wave C fix wave, F1): an answer to a post reaches its poster as an unread conversation.
// 1. A member of another ecosystem (OmniOne) answers Escherbridge's gold need "Rainwater harvesting help (uxqa gold)"
//    from its detail; "Open the conversation" lands IN that conversation (Messaging reads ?conversation=).
// 2. The poster's side: MBR-EB-002 (Kenny), the gold need's author, is a seeded DID member with no session, so a
//    regression persona stands in. qa-new-priya (Oasis; OmniOne selected by the harness) posts a need in Oasis, Sol
//    answers it, and Priya sees one unread conversation in Messages whatever her selection, opens it from the bell's
//    link, and the badge and the bell item clear. Fixtures carry the uxqa marker; Priya's need is withdrawn at the end.
import { BASE, MARKER, ecosystemCookie, eventually, regression } from "./support/fixtures.mjs";

const GOLD_NEED = "Rainwater harvesting help (uxqa gold)";
const BADGE = /^1( unread)?$/i;  // "1 unread" (the badge may render it upper-case)

await regression("c-respond-unread", { pass: "03-cross-ecosystem-exchange" }, async (flow) => {
  const responder = await flow.as("qa-new-sol");

  // --- 1. The gold need, answered through the page -----------------------------------------------------------------
  const search = await responder.request("GET", `/api/v1/discover/shares-needs?q=${encodeURIComponent("Rainwater harvesting help")}&per_page=50`);
  const need = (search.body?.items || []).find((post) => post.title === GOLD_NEED);
  if (!need) throw new Error(`precondition: "${GOLD_NEED}" is not an open public post (re-run the adapter seed: ensure_gold_need)`);

  const { page } = responder;
  responder.step("Open the gold need from Discover and offer help");
  await page.goto(`${BASE}/discover?tab=shares-needs&post=${need.id}`, { waitUntil: "networkidle" });
  const detail = page.getByRole("dialog", { name: GOLD_NEED });
  await detail.waitFor({ timeout: 10000 });
  if (!need.caller_has_responded) {
    const offer = detail.getByRole("button", { name: `Offer help: ${GOLD_NEED}`, exact: true });
    if (!(await offer.count())) throw flow.red(`a member of another ecosystem gets no "Offer help" on ${GOLD_NEED} (respond_blocked: ${need.respond_blocked})`);
    await offer.click();
    const compose = page.getByRole("dialog", { name: `Offer help: ${GOLD_NEED}` });
    await compose.getByLabel("Your message").fill(`Regression check: I have built rain barrels and can help. ${MARKER}`);
    await compose.getByRole("button", { name: "Send message" }).click();
    await compose.getByText(/^Message (sent to|added to your earlier conversation with) /).waitFor({ timeout: 10000 })
      .catch(() => { throw flow.red("sending the answer did not confirm who it went to"); });
    await compose.getByRole("link", { name: "Open the conversation" }).click();
  } else {
    // Answered in an earlier sweep since the last seed: the post offers the conversation instead of the button.
    // The visually hidden ": <title>" suffix reaches the accessible name with or without a space before the colon.
    await detail.getByRole("link", { name: /^Open the conversation\s*:\s*Rainwater harvesting help/ }).click();
  }
  responder.step("The conversation itself opens, not just the list");
  await page.waitForURL(/\/messaging/, { timeout: 10000 });
  await page.getByRole("heading", { name: `Re: ${GOLD_NEED}` }).waitFor({ timeout: 10000 })
    .catch(() => { throw flow.red("\"Open the conversation\" lands on the Messaging list, not in the conversation (?conversation= ignored)"); });

  // --- 2. The poster sees the answer unread, whatever their header selection --------------------------------------
  const author = await flow.as("qa-new-priya");
  const me = await author.request("GET", "/api/v1/auth/me");
  const home = (me.body?.ecosystems || []).find((e) => e.membership_status === "active" && e.id !== flow.omniId);
  if (!home) throw new Error("precondition: qa-new-priya has no active membership outside OmniOne (re-seed the personas)");
  const inOmniOne = (me.body?.ecosystems || []).some((e) => e.id === flow.omniId && e.membership_status === "active");
  const selection = inOmniOne ? "OmniOne, not the post's ecosystem" : home.name;  // the harness selects OmniOne when it can
  const title = `Regression answer check ${Date.now().toString(36)} (${MARKER})`;
  // The domain list follows the header selection: select the post's ecosystem to find its domains, then go back to OmniOne.
  await author.page.context().addCookies([ecosystemCookie(home.id)]);
  const listed = (await author.request("GET", "/api/v1/domains?per_page=100")).body?.items || [];
  const domains = listed.filter((domain) => domain.ecosystem_id === home.id);
  let post = null;
  for (const domain of domains) {
    const created = await author.request("POST", "/api/v1/discover/shares-needs", {
      ecosystem_id: home.id, domain_id: domain.id, type: "need", title, visibility: "public",
      description: `Regression fixture; withdrawn by the flow. ${MARKER}`,
    });
    if (created.status === 201) { post = created.body; break; }
  }
  if (!post) throw new Error(`no ${home.name} domain accepted a need from ${author.displayName}`);
  if (inOmniOne) await author.page.context().addCookies([ecosystemCookie(flow.omniId)]);

  try {
    const answered = await responder.request("POST", `/api/v1/discover/shares-needs/${post.id}/respond`, { message: `Regression answer. ${MARKER}` });
    if (answered.status !== 201) throw new Error(`respond -> ${answered.status} ${JSON.stringify(answered.body).slice(0, 200)}`);
    const conversationId = answered.body.conversation_id;

    author.step("Open Messages: the answer waits there, unread");
    const ap = author.page;
    await ap.goto(`${BASE}/messaging`, { waitUntil: "networkidle" });
    const row = ap.getByRole("button").filter({ hasText: `Re: ${title}` }).first();
    await row.waitFor({ timeout: 10000 })
      .catch(() => { throw flow.red(`the poster's Messages list does not show the answer to their ${home.name} post (header selection: ${selection})`); });
    const unread = (await row.innerText()).split("\n").map((line) => line.trim()).some((line) => BADGE.test(line));
    if (!unread) throw flow.red("the answer is listed but not marked 1 unread for its poster");

    author.step("Follow the bell's link and read it");
    const queue = (await author.request("GET", "/api/v1/me/next-steps")).body?.items || [];
    const item = queue.find((i) => i.action === "read_response" && i.link === `/messaging?conversation=${conversationId}`);
    if (!item) throw flow.red("the poster has no \"answered your need\" item linking to the conversation");
    await ap.goto(`${BASE}${item.link}`, { waitUntil: "networkidle" });
    await ap.getByRole("heading", { name: `Re: ${title}` }).waitFor({ timeout: 10000 })
      .catch(() => { throw flow.red("the bell's link opens Messaging but not the conversation"); });
    await eventually(flow, "after reading the answer, the bell still lists it", async () => {
      const after = (await author.request("GET", "/api/v1/me/next-steps")).body?.items || [];
      return !after.some((i) => i.action === "read_response" && i.link === item.link);
    }, 8000);
  } finally {
    await author.request("POST", `/api/v1/discover/shares-needs/${post.id}/status`, { status: "withdrawn" }).catch(() => {});
  }
});
