// Preserve model-visible tool evidence; overflow metadata never expands the payload unboundedly.
export function captureToolData(data, limit = 6000) {
  const text = JSON.stringify(data ?? null);
  if (text.length <= limit) return data;
  const retainedFacts = {};
  if (data && typeof data === 'object') for (const key of ['count', 'status', 'title', 'ecosystem']) {
    const value = data[key];
    if (typeof value === 'string') retainedFacts[key] = value.slice(0, 180);
    else if (typeof value === 'boolean' || typeof value === 'number' && Number.isFinite(value)) retainedFacts[key] = value;
  }
  return {truncated:text.length,preview:text.slice(0,limit),retainedFacts,overflow:{capturedChars:limit,modelDataChars:text.length}};
}
