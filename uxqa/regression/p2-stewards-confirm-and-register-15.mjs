// p2-stewards-confirm-and-register-15: any navigation closes the communications drawer, so it never covers the page it led to.
import { BASE, eventually, regression } from "./support/fixtures.mjs";

await regression("p2-stewards-confirm-and-register-15", { pass: "02-act-lifecycle" }, async (flow) => {
  const s = await flow.as("qa-new-joy");
  const { page } = s;
  s.step("Open the communications drawer on the dashboard");
  await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Open communications" }).click();
  const drawer = page.getByRole("dialog", { name: "Communications" });
  await drawer.waitFor({ timeout: 5000 });

  s.step("Go to Proposals while it is open");
  await page.locator('[data-sidebar="sidebar"] a[href="/proposals"]').first().click();
  await page.waitForURL(/\/proposals$/, { timeout: 10000 });
  await eventually(flow, "the communications drawer stays open over the page the member navigated to",
    async () => (await drawer.count()) === 0, 3000);
});
