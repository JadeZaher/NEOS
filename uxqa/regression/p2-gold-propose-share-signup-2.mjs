// p2-gold-propose-share-signup-2: the sidebar shows a member only the links whose page admits them.
// Explicit node support authority governs Node Administration; ecosystem profiles confer no node authority.
import { BASE, regression } from "./support/fixtures.mjs";

const ORDINARY = ["an ordinary OmniOne member (not a steward or node admin)", (me, omni) => me.is_node_admin === false && omni?.is_steward === false];
const NODE_ADMIN = ["an explicitly assigned node admin", (me) => me.is_node_admin === true];

const sidebarLinks = async (page) => {
  await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle" });
  const sidebar = page.locator('[data-sidebar="sidebar"]').first();
  await sidebar.getByRole("link", { name: "Messaging" }).first().waitFor({ timeout: 10000 });
  return (await sidebar.getByRole("link").allInnerTexts()).map((text) => text.trim()).filter(Boolean);
};

await regression("p2-gold-propose-share-signup-2", { pass: "02-act-lifecycle" }, async (flow) => {
  const member = await flow.as("qa-gold-member", { requires: ORDINARY });  // townhall: reads only
  member.step("Look through the sidebar as an ordinary member");
  const memberLinks = await sidebarLinks(member.page);
  if (memberLinks.includes("Manage Quizzes")) throw flow.red(`a townhall member is offered "Manage Quizzes", whose writes the server refuses (links: ${memberLinks.join(", ")})`);
  if (memberLinks.includes("Node Administration") || memberLinks.includes("Node admins")) throw flow.red('an ordinary member is offered node support administration');

  const admin = await flow.as("qa-member-oren", { requires: NODE_ADMIN });
  admin.step("Find Node Administration with an explicit node admin assignment and open it");
  const adminLinks = await sidebarLinks(admin.page);
  if (!adminLinks.includes("Node Administration")) throw flow.red(`an assigned node admin cannot find Node Administration (links: ${adminLinks.join(", ")})`);
  await admin.page.locator('[data-sidebar="sidebar"]').getByRole("link", { name: "Node Administration", exact: true }).click();
  await admin.page.waitForURL(/\/admin/, { timeout: 10000 });
  await admin.page.waitForLoadState("networkidle");
  await admin.page.getByRole("heading", { name: "Node Administration", exact: true }).waitFor({ timeout: 10000 });
  if (await admin.page.getByText(/don't have permission|node admin access required/i).count()) throw flow.red('Node Administration refuses an explicitly assigned node admin');
});
