// p3-collaboration-and-moderation-10: every way into quiz management follows the server's quiz rule (a steward of the
// selected ecosystem, or explicit node support authority), so the sidebar link, the Dashboard's "Manage learning" and the /quiz/manage
// route never disagree. Before the review fix the route and the Dashboard read the member's profile: a townhall member was
// offered "Manage learning" and admitted to a page whose writes the server refuses. Reads only.
import { BASE, regression } from "./support/fixtures.mjs";

const ORDINARY = ["an ordinary OmniOne member (not a steward or node admin)", (me, omni) => me.is_node_admin === false && omni?.is_steward === false];
const STEWARD = ["an OmniOne steward without node support authority", (me, omni) => me.is_node_admin === false && omni?.is_steward === true];

/** What one member is offered and where the route lets them in, with OmniOne selected. */
async function quizEntryPoints(session) {
  const { page } = session;
  await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle" });
  const main = page.locator("main");
  await main.getByRole("link", { name: /Draft proposal/ }).waitFor({ timeout: 10000 });
  const dashboard = await main.getByRole("link", { name: /Manage learning/ }).count() > 0;
  const sidebar = await page.locator('[data-sidebar="sidebar"]').first().getByRole("link", { name: "Manage Quizzes" }).count() > 0;

  await page.goto(`${BASE}/quiz/manage`, { waitUntil: "networkidle" });
  const denied = page.getByRole("heading", { name: "Access Denied" });
  const admitted = page.getByRole("heading", { name: "Quiz Management" });
  await denied.or(admitted).first().waitFor({ timeout: 10000 });
  return { dashboard, sidebar, route: await admitted.count() > 0, reason: await page.getByText(/steward of the selected ecosystem/).count() > 0 };
}

await regression("p3-collaboration-and-moderation-10", { pass: "03-cross-ecosystem-exchange" }, async (flow) => {
  const member = await flow.as("qa-gold-member", { requires: ORDINARY });
  member.step("As an ordinary member, look for quiz management on the dashboard and the sidebar, then open it by its address");
  const seen = await quizEntryPoints(member);
  if (seen.dashboard) throw flow.red('an ordinary member is offered "Manage learning", whose quiz writes the server refuses');
  if (seen.sidebar) throw flow.red('an ordinary member is offered "Manage Quizzes", whose quiz writes the server refuses');
  if (seen.route) throw flow.red("/quiz/manage admits an ordinary member, whose quiz writes the server refuses");
  if (!seen.reason) throw flow.red("Access Denied on /quiz/manage does not say who may manage quizzes");

  const steward = await flow.as("qa-steward-amara", { requires: STEWARD });
  steward.step("As a steward, find quiz management on the dashboard and the sidebar, and open it");
  const offered = await quizEntryPoints(steward);
  if (!offered.dashboard || !offered.sidebar) throw flow.red(`a steward is not offered quiz management (Dashboard ${offered.dashboard}, sidebar ${offered.sidebar})`);
  if (!offered.route) throw flow.red("a steward who is offered Manage Quizzes lands on Access Denied");
});
