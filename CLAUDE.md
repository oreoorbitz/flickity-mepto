# Claude — Project Instructions

This file is for Claude Code only. For the shared overview and router, read `AGENTS.md` first — this file only adds Claude-specific details.

## What Claude reads

- `AGENTS.md` — shared router (all agents). Follow the router table to the focused doc for your task.
- `CONTRIBUTING.md` — dev harness (prerequisites Node 22, `npm ci`, `npx playwright install`, `npm run build`, `npm test` harness).
- `PERFORMANCE_GUIDE.md` — consolidated DOM (Part I) + V8 JIT (Part II) guide; DOM dominates, V8 only for hot `src/` loops.
- `.claude/settings.json` / `.claude/settings.local.json` — permission allow-list for this repo.
- `.claude/skills/playwright-cli/SKILL.md` — browser automation skill (if present).

## Permissions

Committed `.claude/settings.json` (if present) allows only safe, read-only/local commands (`git status/log/diff`, `gh pr view/list`, etc.). Mutating commands (`git push`, `gh pr create/merge`, `git reset --hard`, `gh release`) are intentionally in **neither** `allow` nor `deny` — they fall through to the per-command prompt, which is the confirmation gate. See `CONTRIBUTING.md` Git & GitHub workflow for the gate.

Do not add `push`/`merge`/`release` to `allow`. Do not edit `.claude/settings.local.json` (personal, gitignored per `AGENTS.md`).

## Tools and skills

- **Browser / Playwright** — use `test/flickity-api.html` + `test/flickity-api.spec.js` (`npx playwright test test/flickity-api.spec.js --project=chromium`) as described in `CONTRIBUTING.md`. For ad-hoc, use `playwright-cli open/goto/click/fill/eval/snapshot` if `.claude/skills/playwright-cli/SKILL.md` exists.
- **Mepto surface** — `src/mepto-bridget.js` shim fallback vs `Mepto/src/mepto.ts` native `$.bridget`, WeakMap `$.data`, `$.Event`, `$.batch`, `$.raf` — check `AGENTS.md` quick refs before touching `src/flickity.js` Mepto surface.
- **Git / GitHub** — `CONTRIBUTING.md` for branch naming, commit style, PR flow. Use `gh pr view` patterns.

## Workflow

Follow `AGENTS.md` → router → doc. Notify before any push/PR/release (confirmation gate). After opening a PR, wait for the user to say CodeRabbit is ready before addressing review comments.
