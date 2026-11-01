// p2-gold-propose-share-signup-2: the sidebar shows a member only the links whose page admits them.
// A townhall member keeps "Manage Quizzes" and never sees "Manage Shares & Needs" (the admin panel); a builder sees both and the panel opens.
import { BASE, regression } from "./support/fixtures.mjs";

const sidebarLinks = async (page) => {
  await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle" });
  const sidebar = page.locator('[data-sidebar="sidebar"]').first();
  await sidebar.getByRole("link", { name: "Messaging" }).first().waitFor({ timeout: 10000 });
  return (await sidebar.getByRole("link").allInnerTexts()).map((text) => text.trim()).filter(Boolean);
};

await regression("p2-gold-propose-share-signup-2", { pass: "02-act-lifecycle" }, async (flow) => {
  const member = await flow.as("qa-gold-member");  // townhall: manages content, not users
  member.step("Look through the sidebar as an ordinary member");
  const memberLinks = await sidebarLinks(member.page);
  if (!memberLinks.includes("Manage Quizzes")) throw flow.red(`a townhall member lost "Manage Quizzes" (links: ${memberLinks.join(", ")})`);
  if (memberLinks.includes("Manage Shares & Needs")) throw flow.red('an ordinary member is offered "Manage Shares & Needs", which leads to Access Denied');

  const builder = await flow.as("qa-member-ines");  // builder: manages users, so the admin panel admits her
  builder.step("Look through the sidebar as a builder and open the shares and needs admin");
  const builderLinks = await sidebarLinks(builder.page);
  if (!builderLinks.includes("Manage Shares & Needs")) throw flow.red(`a builder no longer sees "Manage Shares & Needs" (links: ${builderLinks.join(", ")})`);
  await builder.page.locator('[data-sidebar="sidebar"]').getByRole("link", { name: "Manage Shares & Needs" }).click();
  await builder.page.waitForURL(/\/admin/, { timeout: 10000 });
  await builder.page.waitForLoadState("networkidle");
  if (await builder.page.getByText(/don't have permission/i).count()) throw flow.red('"Manage Shares & Needs" opens Access Denied for a builder');
});
