// p2-lending-rules-keyboard-1: after submitting advice, recording a position and filing a test report from the keyboard,
// focus lands on the stable heading of what just happened, never on BODY (the submit button disables itself while pending).
import { BASE, MARKER, eventually, focused, move, openProposal, proposal, regression, withdrawProposal } from "./support/fixtures.mjs";

/** Presses Enter on the named submit button, as a keyboard user does, then expects focus on `heading`. */
async function submitAndExpectFocus(flow, page, button, heading, act) {
  await page.getByRole("button", { name: button }).focus();
  await page.keyboard.press("Enter");
  await page.getByText(heading, { exact: true }).first().waitFor({ timeout: 10000 });
  let last = null;
  await eventually(flow, "", async () => (last = await focused(page)).text === heading, 3000)
    .catch(() => { throw flow.red(`after ${act}, focus is on ${last.tag} "${last.text}" instead of the "${heading}" heading`); });
}

await regression("p2-lending-rules-keyboard-1", { pass: "02-act-lifecycle" }, async (flow) => {
  const author = await flow.as("qa-new-sol");
  const member = await flow.as("qa-member-ines");
  const { page } = member;
  let proposalId = null;
  try {
    proposalId = await openProposal(author, flow, `Regression focus after acting (${MARKER})`);
    const url = `${BASE}/proposals/${proposalId}`;

    member.step("Give advice from the keyboard");
    await page.goto(url, { waitUntil: "networkidle" });
    await page.getByRole("tab", { name: /^Advice/ }).click();
    await page.locator("#advice-content").fill(`Regression advice from the keyboard. ${MARKER}`);
    await submitAndExpectFocus(flow, page, "Submit Advice", "You advised in this round", "submitting advice");

    await move(author, proposalId, "consent");
    member.step("Record an objection from the keyboard");
    await page.goto(url, { waitUntil: "networkidle" });
    await page.getByRole("tab", { name: /^Consent/ }).click();
    await page.locator("#consent-position").click();
    await page.getByRole("option", { name: "Object" }).click();
    await page.locator("#objection").fill(`Regression objection, lifted straight after. ${MARKER}`);
    await submitAndExpectFocus(flow, page, "Record my position: Object", "Your position", "recording a position");

    // Consent from the same member meets the quorum of one: the proposal moves to Test by itself.
    const consented = await member.request("POST", `/api/v1/proposals/${proposalId}/consent`, { position: "consent", objection_text: null });
    if (consented.status !== 201 || (await proposal(member, proposalId)).status !== "test") throw new Error(`consent did not move it to test (${consented.status})`);
    member.step("File a test report from the keyboard");
    await page.goto(url, { waitUntil: "networkidle" });
    await page.getByRole("tab", { name: /^Test/ }).click();
    await page.locator("#test-observations").fill(`Regression report: it worked as described. ${MARKER}`);
    await page.locator("#test-outcome").click();
    await page.getByRole("option", { name: "Passed" }).click();
    await submitAndExpectFocus(flow, page, "Submit report: Passed", "You filed a test report", "filing a test report");
  } finally {
    await withdrawProposal(author, proposalId);
  }
});
