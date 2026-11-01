// p2-gold-advise-profile-orient-4: a required orientation video that cannot play must not strand a newcomer on step 1.
// The newcomer acknowledges the missing video and Continue unlocks. Nothing is saved: the flow never presses Continue.
import { BASE, eventually, regression } from "./support/fixtures.mjs";

await regression("p2-gold-advise-profile-orient-4", { pass: "02-act-lifecycle" }, async (flow) => {
  const s = await flow.as("qa-new-kofi");
  const { page } = s;
  // Whatever asset is (or is not) deployed, the video request fails here, so the fallback is what gets checked.
  await page.route(/\.(mp4|webm|mov|m4v)(\?.*)?$/i, (route) => route.fulfill({ status: 404, body: "" }));

  s.step("Open the OmniOne orientation journey");
  await page.goto(`${BASE}/orientation/${flow.omniId}/journey`, { waitUntil: "networkidle" });
  if (!page.url().endsWith("/journey")) {
    s.step("No saved progress yet: start the journey from the gate");
    await page.getByRole("button", { name: /start journey/i }).first().click();
    await page.waitForURL(/\/journey$/, { timeout: 10000 });
  }
  const stepCounter = page.getByText(/^Step \d+ of \d+$/).first();
  await stepCounter.waitFor({ timeout: 10000 });
  for (let tries = 0; tries < 20 && !/^Step 1 of/.test(await stepCounter.innerText()); tries++) {
    await page.getByRole("button", { name: "Previous Step" }).click();
  }
  if (!/^Step 1 of/.test(await stepCounter.innerText())) throw flow.red("could not return to step 1 of the journey");

  s.step("Step 1's video cannot play");
  const unavailable = page.getByRole("status").filter({ hasText: /could not be loaded|No video is available/ });
  await eventually(flow, "step 1 shows no 'This video could not be loaded' message when its video fails",
    async () => (await unavailable.count()) > 0, 10000);

  const acknowledgement = page.getByRole("checkbox", { name: /continue without the video/i });
  if (!(await acknowledgement.count())) throw flow.red("no 'I'll continue without the video' acknowledgement on the unplayable required video");
  const blocked = page.getByRole("button", { name: /Confirm to continue/ });
  if (!(await blocked.isDisabled())) throw flow.red("Continue is open before the newcomer acknowledges the missing video");

  s.step("Acknowledge the missing video");
  await acknowledgement.click();
  const proceed = page.getByRole("button", { name: /^Continue$/ });
  await eventually(flow, "Continue stays disabled after acknowledging the missing video: the newcomer is stuck on step 1",
    async () => (await proceed.count()) > 0 && (await proceed.isEnabled()));
});
