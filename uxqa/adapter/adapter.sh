#!/usr/bin/env bash
# NEOS session adapter: guard | seed <personas.json> <out.json> [--member-resets-only] | link <handle>. See uxqa/adapter/AGENTS.md.
set -uo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
REPO="$(cd "$HERE/../.." && pwd)"
AGENT_DIR="$REPO/neos-operating-system/agent"
BASE="${UXQA_BASE_URL:-http://localhost:5173}"
# The isolated DB; overrides the Railway DATABASE_URL in agent/.env for every process this adapter starts.
export DATABASE_URL="postgresql+asyncpg://postgres:526152@127.0.0.1:5433/neos_uxqa"
export PYTHONIOENCODING=utf-8

local_guard() {
  case "$BASE" in
    http://localhost:*|http://127.0.0.1:*) ;;
    *) echo "REFUSED base url $BASE is not local"; exit 2 ;;
  esac
  local health
  health="$(curl -s --max-time 10 "$BASE/api/v1/health")" || { echo "REFUSED health unreachable at $BASE"; exit 2; }
  case "$health" in
    *'"status":"healthy"'*'"database":"connected"'*|*'"database":"connected"'*'"status":"healthy"'*) ;;
    *) echo "REFUSED health not healthy+connected"; exit 2 ;;
  esac
}

case "${1:-}" in
  guard)
    local_guard
    # Proves the RUNNING server reads the uxqa DB (sentinel row), not just that something answers on the port.
    node "$HERE/verify-target.mjs" "$BASE" "$REPO/uxqa/.secrets/sessions.json"
    ;;
  seed)
    # --member-resets-only (agent evals): skip study-wide resets such as withdrawing the gold proposals.
    { [ $# -eq 3 ] || { [ $# -eq 4 ] && [ "$4" = "--member-resets-only" ]; }; } \
      || { echo "ERROR usage: adapter.sh seed <personas.json> <out.json> [--member-resets-only]"; exit 1; }
    reset_mode="${4:-}"
    local_guard
    # seed.py runs from the backend dir, so both paths must be absolute before the cd.
    mkdir -p "$(dirname "$3")"
    personas_abs="$(cd "$(dirname "$2")" && pwd)/$(basename "$2")"
    sessions_abs="$(cd "$(dirname "$3")" && pwd)/$(basename "$3")"
    set -- "$1" "$personas_abs" "$sessions_abs"
    out="$(cd "$AGENT_DIR" && py "$HERE/seed.py" "$2" "$3" ${reset_mode:+"$reset_mode"} 2>/dev/null | grep -E '^(SEEDED|REFUSED|ERROR)' | tail -1)"
    case "$out" in
      SEEDED*) ;;
      REFUSED*) echo "$out"; exit 2 ;;
      *) echo "${out:-ERROR seed produced no status line}"; exit 1 ;;
    esac
    verdict="$(node "$HERE/verify-target.mjs" "$BASE" "$3")"
    case "$verdict" in
      OK*) echo "$out" ;;
      *) rm -f "$3"; echo "$verdict"; exit 2 ;;
    esac
    ;;
  link)
    echo "REFUSED link: NEOS has no magic-link sign-in; open a lane session or sign in with a password account"
    exit 2
    ;;
  *)
    echo "ERROR usage: adapter.sh guard | seed <personas.json> <out.json> [--member-resets-only] | link <handle>"
    exit 1
    ;;
esac
