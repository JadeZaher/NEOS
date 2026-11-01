// p2-gold-propose-share-signup-1: a member edits and withdraws their own published share from their profile.
// The edited title shows in the list; after confirming the withdrawal the share leaves it. The flow cleans up after itself.
import { BASE, MARKER, eventually, regression } from "./support/fixtures.mjs";

await regression("p2-gold-propose-share-signup-1", { pass: "02-act-lifecycle" }, async (flow) => {
  const s = await flow.as("qa-new-joy");
  const title = `Regression share ${Date.now().toString(36)} (${MARKER})`;
  const edited = `${title} edited`;

  // A public share in the first OmniOne domain that accepts one (some domains require an agreement first).
  const domains = (await s.request("GET", `/api/v1/domains?ecosystem_id=${flow.omniId}&per_page=100`)).body?.items || [];
  let share = null;
  for (const domain of domains) {
    const created = await s.request("POST", "/api/v1/discover/shares-needs", {
      ecosystem_id: flow.omniId, domain_id: domain.id, type: "share", title, visibility: "public",
      description: `Regression fixture; withdrawn by the flow. ${MARKER}`, category: "skills", capacity: "One evening a week",
    });
    if (created.status === 201) { share = created.body; break; }
  }
  if (!share) throw new Error(`no OmniOne domain accepted a share from ${s.displayName}`);

  try {
    const { page } = s;
    const listed = (text) => page.getByRole("heading", { name: text, exact: true });
    s.step("Open my profile and edit the share");
    await page.goto(`${BASE}/profile`, { waitUntil: "networkidle" });
    await listed(title).waitFor({ timeout: 10000 });
    const editButton = page.getByRole("button", { name: `Edit ${title}` });
    if (!(await editButton.count())) throw flow.red("the member's own share has no Edit control on their profile");
    await editButton.click();
    const editor = page.getByRole("dialog", { name: "Edit share" });
    await editor.getByLabel("Title *").fill(edited);
    await editor.getByRole("button", { name: "Save changes" }).click();
    await eventually(flow, "the edited title does not show on the profile after saving", async () => (await listed(edited).count()) > 0, 8000);

    s.step("Withdraw the share");
    const withdrawButton = page.getByRole("button", { name: `Withdraw ${edited}` });
    if (!(await withdrawButton.count())) throw flow.red("the member's own share has no Withdraw control on their profile");
    await withdrawButton.click();
    const confirm = page.getByRole("alertdialog", { name: `Withdraw “${edited}”?` });
    await confirm.waitFor({ timeout: 5000 }).catch(() => { throw flow.red("Withdraw acted without a confirmation"); });
    await confirm.getByRole("button", { name: "Withdraw share" }).click();
    await eventually(flow, "the withdrawn share is still listed on the profile", async () => (await listed(edited).count()) === 0, 8000);
    share = null;
  } finally {
    if (share) await s.request("POST", `/api/v1/discover/shares-needs/${share.id}/status`, { status: "withdrawn" }).catch(() => {});
  }
});
