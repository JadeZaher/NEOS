// p2-gold-propose-share-signup-2: the sidebar shows a member only the links whose page admits them.
// An ordinary member sees neither "Manage Quizzes" (quiz writes need a steward or platform admin, pass 03 collab-10) nor
// "Manage Shares & Needs" (the admin panel); a platform admin sees both and the panel opens. The admin is qa-member-oren
// (co_creator on OmniOne in every pass); pass 03 re-seeded the old pick, Ines, as a collaborator, which is not an admin.
import { BASE, regression } from "./support/fixtures.mjs";

const ORDINARY = ["an ordinary OmniOne member (not a steward, not a platform admin)", (me, omni) => !me.is_platform_admin && omni?.is_steward === false];
const PLATFORM_ADMIN = ["a platform admin", (me) => me.is_platform_admin === true];

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
  if (memberLinks.includes("Manage Shares & Needs")) throw flow.red('an ordinary member is offered "Manage Shares & Needs", which leads to Access Denied');

  const admin = await flow.as("qa-member-oren", { requires: PLATFORM_ADMIN });
  admin.step("Look through the sidebar as a platform admin and open the shares and needs admin");
  const adminLinks = await sidebarLinks(admin.page);
  if (!adminLinks.includes("Manage Shares & Needs")) throw flow.red(`a platform admin no longer sees "Manage Shares & Needs" (links: ${adminLinks.join(", ")})`);
  await admin.page.locator('[data-sidebar="sidebar"]').getByRole("link", { name: "Manage Shares & Needs" }).click();
  await admin.page.waitForURL(/\/admin/, { timeout: 10000 });
  await admin.page.waitForLoadState("networkidle");
  if (await admin.page.getByText(/don't have permission/i).count()) throw flow.red('"Manage Shares & Needs" opens Access Denied for a platform admin');
});
