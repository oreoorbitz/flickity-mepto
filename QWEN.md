# Qwen — Project Instructions

This file is for Qwen Code only. For the shared overview and router, read `AGENTS.md` first — this file only adds Qwen-specific details.

## What Qwen reads

- `AGENTS.md` — shared router (all agents). Follow the router table to the focused doc.
- `CONTRIBUTING.md` — dev harness (Node 22, `npm ci`, Playwright harness `test/flickity-api.html`, `npm run build`, `npm test`).
- `PERFORMANCE_GUIDE.md` — consolidated DOM + V8 guide; DOM dominates.
- `.qwen/settings.json` / `.qwen/skills/` — Qwen permission allow-list and Qwen-specific skills.
- `.qwen/pending-skills/` and `.zcode/plans/` — session-local scratch; gitignored/treated as ephemeral.

## Permissions

`.qwen/settings.json` mirrors the allow-list approach (safe, read-only/local commands allowed; mutating `git push`/`gh pr create` require per-command confirmation). Do not add mutating commands to `allow`. See `CONTRIBUTING.md` for the full gate.

## Tools and skills

- **Verification** — `CONTRIBUTING.md` for `npm test` (Playwright `test/flickity-api.html`, `file://`), dev-server port handling, and build notes.
- **Mepto surface** — `Mepto/src/mepto.ts` native APIs (`$.bridget`, WeakMap `$.data`, `$.Event`, `$.batch`, `$.raf`) vs `flickity-mepto/src/mepto-bridget.js` shim — check `AGENTS.md` quick refs before touching `src/flickity.js`.
- **Perf** — `PERFORMANCE_GUIDE.md` for hot-path rules (only for proven-hot `src/` loops; don't sacrifice API clarity).
- **Git / GitHub** — `CONTRIBUTING.md` for branch/commit conventions, `qwen review fetch-pr` (never `gh pr checkout`), and posting reviews via `gh api`.

## Session behavior

- Qwen may create session plans under `.zcode/plans/` or `.qwen/pending-skills/` during work — these are ephemeral and not committed as canonical plans.
- After opening a PR, wait for the user to say CodeRabbit is ready before addressing review — same gate as in `CONTRIBUTING.md`.
- Follow `AGENTS.md` → router → skill. Do not infer detailed steps without opening the doc.
