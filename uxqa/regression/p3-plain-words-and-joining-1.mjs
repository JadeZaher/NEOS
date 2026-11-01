// p3-plain-words-and-joining-1: signing up with a taken username keeps the sign-up form and what was typed, and says so
// on the username field. Before the fix the global auth loading state swapped Login for the loading screen, so it came
// back as an empty Sign In form. The server refuses the sign-up (409), so nothing is written.
import { BASE, regression } from "./support/fixtures.mjs";

await regression("p3-plain-words-and-joining-1", { pass: "03-cross-ecosystem-exchange" }, async (flow) => {
  const member = await flow.as("qa-gold-member");  // reads only: whose username is taken
  const taken = (await member.request("GET", "/api/v1/auth/me")).body?.user?.username;
  if (!taken) throw new Error("/auth/me returned no username for qa-gold-member");

  // A signed-out visitor: a cookieless context on the same browser (logging the persona out would end its session).
  const context = await member.page.context().browser().newContext({ viewport: { width: 1366, height: 900 } });
  try {
    const page = await context.newPage();
    member.step("As a visitor, sign up with a username someone already has");
    await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: /Sign up/ }).click();
    await page.getByLabel("Display Name (optional)").fill("Regression Visitor");
    await page.getByLabel("Username").fill(taken);
    await page.getByLabel("Password", { exact: true }).fill("regression-password-1");
    await page.getByLabel("Confirm Password").fill("regression-password-1");
    await page.getByRole("button", { name: "Create Account" }).click();

    const usernameError = page.locator("#reg-username-error");
    await usernameError.waitFor({ timeout: 10000 }).catch(() => {});
    const state = await page.evaluate(() => ({
      signUpForm: !!document.getElementById("reg-username"),
      username: document.getElementById("reg-username")?.value ?? "",
      displayName: document.getElementById("reg-display-name")?.value ?? "",
      invalid: document.getElementById("reg-username")?.getAttribute("aria-invalid"),
      error: document.getElementById("reg-username-error")?.textContent ?? "",
    }));
    if (!state.signUpForm) throw flow.red("a taken username switched the page away from the sign-up form");
    if (state.username !== taken || state.displayName !== "Regression Visitor") {
      throw flow.red(`a taken username dropped the typed values (username "${state.username}", display name "${state.displayName}")`);
    }
    if (state.invalid !== "true" || !/taken/i.test(state.error)) {
      throw flow.red("the taken username is not reported on the username field");
    }
  } finally {
    await context.close().catch(() => {});
  }
});
