// p2-stewards-confirm-and-register-16: closing advice cannot be taken back, so the proposer confirms it first.
// The first press opens a confirmation that says what was received; "Keep advice open" changes nothing; only the confirm moves it.
import { BASE, MARKER, eventually, openProposal, proposal, regression, withdrawProposal } from "./support/fixtures.mjs";

await regression("p2-stewards-confirm-and-register-16", { pass: "02-act-lifecycle" }, async (flow) => {
  const author = await flow.as("qa-new-sol");
  const advisor = await flow.as("qa-new-rafi");
  let proposalId = null;
  try {
    proposalId = await openProposal(author, flow, `Regression close-advice confirmation (${MARKER})`);
    const advised = await advisor.request("POST", `/api/v1/proposals/${proposalId}/advice`,
      { content: `Fine by me; this is regression advice. ${MARKER}`, concerns: null, new_round: false });
    if (advised.status !== 201) throw new Error(`advice -> ${advised.status}`);

    const { page } = author;
    author.step("Open my proposal now that enough advice is in");
    await page.goto(`${BASE}/proposals/${proposalId}`, { waitUntil: "networkidle" });
    // The page offers the act twice (the prompt and the lifecycle buttons); every one of them must confirm first.
    const closeButtons = page.getByRole("button", { name: /^Close advice and move to consent/ });
    await closeButtons.first().waitFor({ timeout: 10000 });
    const dialog = page.getByRole("alertdialog", { name: "Close advice and move to consent?" });
    const offered = await closeButtons.count();

    for (let index = 0; index < offered; index++) {
      author.step(`Press Close advice (control ${index + 1} of ${offered}), then keep advice open`);
      await closeButtons.nth(index).click();
      await eventually(flow, "", async () => (await dialog.count()) > 0, 3000).catch(async () => {
        const now = await proposal(author, proposalId);
        throw flow.red(now.status !== "advice"
          ? `one press on Close advice control ${index + 1} of ${offered} closed advice with no confirmation (status ${now.status})`
          : `Close advice control ${index + 1} of ${offered} opened no confirmation`);
      });
      const said = await dialog.innerText();
      if (!/You are closing advice on your proposal\./.test(said) || !/1 piece of advice in this round/.test(said)) {
        throw flow.red(`the confirmation does not say who is closing and what was received: ${said.replace(/\s+/g, " ").slice(0, 200)}`);
      }
      if ((await proposal(author, proposalId)).status !== "advice") throw flow.red("advice closed before the proposer confirmed");
      await dialog.getByRole("button", { name: "Keep advice open" }).click();
      await eventually(flow, "the confirmation stays open after 'Keep advice open'", async () => (await dialog.count()) === 0);
      if ((await proposal(author, proposalId)).status !== "advice") throw flow.red("'Keep advice open' closed advice");
    }

    author.step("Close advice for real");
    await closeButtons.first().click();
    await dialog.getByRole("button", { name: "Close advice and move to consent" }).click();
    await eventually(flow, "confirming did not move the proposal to consent",
      async () => (await proposal(author, proposalId)).status === "consent", 8000);
  } finally {
    await withdrawProposal(author, proposalId);
  }
});
