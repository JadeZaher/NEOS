// p2-stewards-confirm-and-register-11: a decision's date-only fields show the calendar day it was decided, west of UTC too.
// Run in Los Angeles time, where reading "YYYY-MM-DD" as UTC midnight shows the day before.
import { BASE, regression } from "./support/fixtures.mjs";

await regression("p2-stewards-confirm-and-register-11", { pass: "02-act-lifecycle" }, async (flow) => {
  const s = await flow.as("qa-new-joy");
  const { page } = s;
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Emulation.setTimezoneOverride", { timezoneId: "America/Los_Angeles" });

  const decisions = (await s.request("GET", "/api/v1/decisions?per_page=50")).body?.items || [];
  const decision = decisions.find((d) => /^\d{4}-\d{2}-\d{2}$/.test(d.date || ""));
  if (!decision) throw new Error("no OmniOne decision with a date to check");
  // The same calendar day, in the browser's own locale format.
  const expected = await page.evaluate((day) => new Date(`${day}T12:00:00`).toLocaleDateString(), decision.date);

  s.step("Open the decisions list and the decision");
  await page.goto(`${BASE}/decisions`, { waitUntil: "networkidle" });
  const card = page.locator(`a[href="/decisions/${decision.id}"]`).first();
  const cardText = await card.innerText().catch(() => "");
  if (cardText && !cardText.includes(`Decided ${expected}`)) {
    throw flow.red(`the decisions list shows "${cardText.match(/Decided [^\n]+/)?.[0]}" for a decision dated ${decision.date} (expected Decided ${expected})`);
  }
  await page.goto(`${BASE}/decisions/${decision.id}`, { waitUntil: "networkidle" });
  const body = await page.locator("main").innerText();
  if (!body.includes(`Decided ${expected}`)) {
    throw flow.red(`the decision page shows "${body.match(/Decided [^\n]+/)?.[0]}" for a decision dated ${decision.date} (expected Decided ${expected})`);
  }
});
