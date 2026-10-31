# Skill Routing Bench — governance skills

Purpose: prove that (a) each governance skill ROUTES flawlessly — a fresh agent
given a realistic task selects and loads the right skill from the catalog —
and (b) the skill's prescribed TOOLS map to tools that actually exist.

Method: one subagent per skill, two prompts per skill (one obvious trigger,
one adversarial/ambiguous). The subagent must report which skills it loaded
(via skill_view), quote one line from each loaded skill as proof, and name the
tools it used or would use. Self-reports are cross-checked against the skill
content by the controller.

Score per skill: ROUTE-A (obvious prompt routed), ROUTE-B (adversarial prompt
routed), TOOLS (prescribed tools exist and were named). Pass = 3/3.

## Bench matrix

### guide-driven-ux-hardening
- A: "The compliance page on the NEOS app shows nothing even though the guide
  says compliance summaries must be visible. Diagnose and fix against the
  binding guides."
- B: "Users say the agreements page feels 'sterile and mocked'. What do you do
  first?"
- Expected tools: skill_view, search_files/grep (terminal), read_file,
  patch, tracker logging (conductor/tracks.md).

### hermes-conductor
- A: "Load the current project context and tell me which track I should pick
  up next in this repo."
- B: "The user says 'log this session's work before we lose it' — what's the
  workflow?"
- Expected tools: terminal (conductor CLI), read_file/patch (tracks.md).

### project-router
- A: "I have 17 projects and no idea which one needs attention today. Figure
  out where I should work."
- B: "Something's broken in the roundtable repo — where does that work belong
  and what's its current state?"
- Expected tools: terminal (state checks), session_search, memory.

### grilling-session
- A: "Run the daily project review across all my projects and find what's
  drifting."
- B: "It's been a week since I touched any repo — give me the honest status
  interrogation."
- Expected tools: terminal (git/log sweep), todo, structured report.

### subagent-driven-development
- A: "Execute this implementation plan with parallel workers and a review
  stage before anything merges."
- B: "This task is too big for one context — decompose it and get it done
  safely."
- Expected tools: delegate_task, todo, patch/write_file review gates.

### conductor-sync
- A: "Check the project state and bring the conductor files up to date."
- B: "The tracks file looks stale relative to what actually shipped — fix it."
- Expected tools: terminal (git), read_file/patch (conductor files).

## Scoring notes (fill per run)

| skill | ROUTE-A | ROUTE-B | TOOLS | verdict |
|---|---|---|---|---|
| guide-driven-ux-hardening | | | | |
| hermes-conductor | | | | |
| project-router | | | | |
| grilling-session | | | | |
| subagent-driven-development | | | | |
| conductor-sync | | | | |
