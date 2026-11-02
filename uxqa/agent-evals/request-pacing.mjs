// Pace completed chat requests; never retry a whole turn or its tool writes.
export function createRequestPacer(intervalMs = 2000, { now = Date.now, wait = ms => new Promise(resolve => setTimeout(resolve, ms)) } = {}) {
  if (!Number.isSafeInteger(intervalMs) || intervalMs < 0 || intervalMs > 30000) throw new Error('Chat pacing must be an integer from 0 to 30000 milliseconds');
  let readyAt = 0;
  return {
    async before() { const delay = Math.max(0, readyAt - now()); if (delay) await wait(delay); return delay; },
    complete() { readyAt = now() + intervalMs; },
  };
}

export function evalOutputNames({ runLabel, resultFile, defaultName = 'agent-eval.json' } = {}) {
  if (runLabel != null && !/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/.test(runLabel)) throw new Error('Run label must use 1–64 letters, numbers, underscores or hyphens');
  const result = resultFile ?? (runLabel ? `agent-eval-${runLabel}.json` : defaultName);
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,100}\.json$/.test(result) || result.includes('..')) throw new Error('Result file must be a local JSON basename');
  return { result, judge: result.replace(/\.json$/, '-judge.json') };
}
