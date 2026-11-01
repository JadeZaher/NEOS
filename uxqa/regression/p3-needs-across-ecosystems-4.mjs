// p3-needs-across-ecosystems-4 (and -8): a post opened from a link starts on its title, not on Close (-8); deleting it
// from its detail leaves focus on the Shares + needs heading, not the page body (-4). The dialog has no trigger, so
// without the fix Radix returns focus to nothing. The fixture is the member's own share, deleted by the flow itself
// (or in `finally` when the flow fails first).
import { BASE, MARKER, eventually, regression } from "./support/fixtures.mjs";

const activeElement = (page) => page.evaluate(() => {
  const el = document.activeElement;
  return { tag: el?.tagName ?? "", id: el?.id ?? "", text: (el?.textContent ?? "").trim().slice(0, 120) };
});

await regression("p3-needs-across-ecosystems-4", { pass: "03-cross-ecosystem-exchange" }, async (flow) => {
  const s = await flow.as("qa-new-joy");
  const title = `Regression share ${Date.now().toString(36)} (${MARKER})`;

  // A public share in the first OmniOne domain that accepts one (some domains require an agreement first).
  const domains = (await s.request("GET", `/api/v1/domains?ecosystem_id=${flow.omniId}&status=active&per_page=100`)).body?.items || [];
  let share = null;
  for (const domain of domains) {
    const created = await s.request("POST", "/api/v1/discover/shares-needs", {
      ecosystem_id: flow.omniId, domain_id: domain.id, type: "share", title, visibility: "public",
      description: `Regression fixture; deleted by the flow. ${MARKER}`, category: "skills", capacity: "One evening a week",
    });
    if (created.status === 201) { share = created.body; break; }
  }
  if (!share) throw new Error(`no OmniOne domain accepted a share from ${s.displayName}`);

  let deleted = false;
  try {
    const { page } = s;
    s.step("Open the share from its link");
    await page.goto(`${BASE}/discover?tab=shares-needs&post=${encodeURIComponent(share.id)}`, { waitUntil: "networkidle" });
    const dialog = page.getByRole("dialog", { name: title });
    await dialog.waitFor({ timeout: 10000 });
    await eventually(flow, "the post opened with focus off its title (Radix leaves it on Close)", async () => {
      const focus = await activeElement(page);
      return focus.tag === "H2" && focus.text === title;
    }, 5000);

    s.step("Delete it from its detail");
    await dialog.getByRole("button", { name: `Delete: ${title}`, exact: true }).click();
    const confirm = page.getByRole("alertdialog", { name: `Delete “${title}”?` });
    await confirm.waitFor({ timeout: 5000 });
    await confirm.getByRole("button", { name: "Delete for good", exact: true }).click();
    await dialog.waitFor({ state: "detached", timeout: 10000 });
    deleted = true;
    await eventually(flow, "after deleting the post, focus is not on the Shares + needs heading", async () => {
      const focus = await activeElement(page);
      return focus.id === "shares-needs-heading";
    }, 3000).catch(async (error) => {
      const focus = await activeElement(page);
      throw flow.red(`${error.message} (focus is on ${focus.tag}${focus.id ? `#${focus.id}` : ""})`);
    });
  } finally {
    if (!deleted) {
      const removed = await s.request("DELETE", `/api/v1/discover/shares-needs/${share.id}`).catch(() => null);
      if (!removed || removed.status !== 200) {
        await s.request("POST", `/api/v1/discover/shares-needs/${share.id}/status`, { status: "withdrawn" }).catch(() => {});
      }
    }
  }
});
