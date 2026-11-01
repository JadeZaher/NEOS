// p3-gold-signup-orient-3: with a toast on screen (sign-up's "Account Created"), the shell has no nameless button and no
// broken list: axe's button-name and list rules find nothing on /dashboard. The toast is raised through the app's own
// toast module (the same Toaster the shell mounts; Vite serves it at /src/...), so no write is needed. The remaining
// aria-hidden-focus nodes are Radix Toast's focus proxies, a recorded library limitation (client/src/AGENTS.md "Toasts and axe").
import { BASE, eventually, regression } from "./support/fixtures.mjs";

await regression("p3-gold-signup-orient-3", { pass: "03-cross-ecosystem-exchange" }, async (flow) => {
  const s = await flow.as("qa-gold-member");  // reads only
  for (const width of [1366, 390]) {
    s.step(`Open the dashboard at ${width} px while a notification is showing`);
    await s.page.setViewportSize({ width, height: width < 500 ? 844 : 900 });
    await s.page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle" });
    await s.page.evaluate(async () => {
      const { toast } = await import("/src/hooks/use-toast.ts");
      toast({ title: "Account Created", description: "Welcome to NEOS!" });
    });
    await eventually(flow, "the test notification never appeared", async () => (await s.page.getByText("Account Created").count()) > 0);
    const violations = await s.axe();
    if (!violations) throw new Error("axe-core is not vendored in the ux-qa-research plugin, so nothing was checked");
    const found = violations.filter((v) => (v.id === "button-name" || v.id === "list") && v.nodes > 0);
    if (found.length) {
      throw flow.red(`at ${width} px with a toast: ${found.map((v) => `${v.id} x${v.nodes}`).join(", ")} (the toast's close button needs a name; its items must stay list items)`);
    }
  }
});
