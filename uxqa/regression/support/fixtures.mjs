// Shared plumbing for uxqa/regression flows: probe sessions with OmniOne selected, API fixtures, and a verdict that sets the exit code.
// Not matched by the sweep's `uxqa/regression/*.mjs` glob, so it never runs as a flow itself. See uxqa/regression/AGENTS.md.
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const STUDY_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
process.env.UXQA_STUDY_DIR ??= STUDY_DIR;
const PLUGIN_ROOT = process.env.UXQA_PLUGIN_ROOT || "C:/Users/atooz/.claude/plugins/cache/local/ux-qa-research/0.1.0";
const { uxSession, BASE } = await import(pathToFileURL(path.join(PLUGIN_ROOT, "lib", "ux-lib.mjs")).href);

export { BASE };
export const MARKER = "uxqa";
export const ADVICE_DEADLINE = new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10);

const ecosystemCookie = (id) => ({ name: "neos_selected_ecosystems", value: encodeURIComponent(JSON.stringify([id])), domain: "localhost", path: "/", sameSite: "Lax" });

/**
 * One flow for one defect. `run(flow)` drives the UI and throws `flow.red(reason)` when the fixed behaviour does not hold.
 * Every session it opened is finished (trace + ux.json under passes/<pass>/runs/), then the exit code says green or red.
 */
export async function regression(defectId, { pass }, run) {
  const passId = process.env.UXQA_PASS || pass;
  const sessions = [];
  let omniId = null;
  const flow = {
    defectId,
    /** A probe session for `handle` with OmniOne selected, landed on /dashboard so page fetches are same-origin. */
    async as(handle, options = {}) {
      const s = await uxSession({ handle, task: `regression-${defectId}${sessions.length ? `-${sessions.length + 1}` : ""}`, pass: passId, mode: "probe", ...options });
      sessions.push(s);
      await s.page.goto(BASE + "/dashboard", { waitUntil: "networkidle" });
      if (!omniId) {
        const me = await s.request("GET", "/api/v1/auth/me");
        omniId = (me.body?.ecosystems || []).find((e) => e.name === "OmniOne")?.id;
        if (!omniId) throw new Error(`OmniOne is not among ${handle}'s ecosystems (re-seed the personas)`);
      }
      await s.page.context().addCookies([ecosystemCookie(omniId)]);
      const me = await s.request("GET", "/api/v1/auth/me");
      s.memberId = me.body?.member?.id;  // regression personas belong to OmniOne only
      s.displayName = me.body?.member?.display_name || me.body?.user?.display_name;
      return s;
    },
    get omniId() { return omniId; },
    red(reason) { const error = new Error(reason); error.red = true; return error; },
  };
  let verdict = "GREEN";
  let note = "";
  try {
    await run(flow);
  } catch (error) {
    verdict = "RED";
    note = error.red ? error.message : `flow error: ${String(error?.stack || error).slice(0, 600)}`;
  }
  for (const s of sessions) await s.finish(verdict === "GREEN" ? "COMPLETED" : "BLOCKED", `${verdict} ${note}`.trim()).catch(() => {});
  console.log(`${verdict} ${defectId}${note ? `: ${note}` : ""}`);
  process.exitCode = verdict === "GREEN" ? 0 : 1;
}

/** Fails the flow with `reason` unless `predicate()` turns true within `timeout` ms (polled). */
export async function eventually(flow, reason, predicate, timeout = 5000) {
  const until = Date.now() + timeout;
  for (;;) {
    if (await predicate()) return;
    if (Date.now() > until) throw flow.red(reason);
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
}

/** A short description of the focused element: tag, accessible text and tabindex. */
export async function focused(page) {
  return page.evaluate(() => {
    const el = document.activeElement;
    if (!el || el === document.body) return { tag: "BODY", text: "" };
    return { tag: el.tagName, text: (el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 80) };
  });
}

/** Creates an OmniOne proposal as `s` (its author) and opens it for advice; returns its id. */
export async function openProposal(s, flow, title) {
  const created = await s.request("POST", "/api/v1/proposals", {
    ecosystem_id: flow.omniId, title, type: "operational", decision_type: "consent", urgency: "medium",
    proposed_change: `Regression fixture for ${flow.defectId}; withdrawn when the flow ends. ${MARKER}`,
    rationale: `Drives the fixed behaviour of ${flow.defectId} through the page. ${MARKER}`,
    advice_deadline: ADVICE_DEADLINE, shared_ecosystem_ids: [], act_policy: null, governing_agreement_id: null, proposer: null,
  });
  if (created.status !== 201) throw new Error(`create proposal -> ${created.status} ${JSON.stringify(created.body).slice(0, 200)}`);
  await move(s, created.body.id, "advice");
  return created.body.id;
}

/** A manual status move as `s`; throws unless the API accepts it. */
export async function move(s, proposalId, status) {
  const res = await s.request("POST", `/api/v1/proposals/${proposalId}/status`, { status });
  if (res.status !== 200) throw new Error(`move ${proposalId} to ${status} -> ${res.status} ${JSON.stringify(res.body).slice(0, 200)}`);
  return res.body;
}

/** The proposal as `s` sees it through the API. */
export async function proposal(s, proposalId) {
  const res = await s.request("GET", `/api/v1/proposals/${proposalId}`);
  if (res.status !== 200) throw new Error(`GET proposal ${proposalId} -> ${res.status}`);
  return res.body;
}

/** Withdraws the fixture as its author unless it already left the live stages (cleanup; never fails the flow). */
export async function withdrawProposal(s, proposalId) {
  if (!s || !proposalId) return;
  await s.request("POST", `/api/v1/proposals/${proposalId}/status`, { status: "withdrawn" }).catch(() => {});
}
