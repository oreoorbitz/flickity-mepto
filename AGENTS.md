# Flickity-Mepto — Agent Guide

Flickity-Mepto is a Mepto-integrated, jQuery-free drop-in for `Flickity PACKAGED v2.3.0` (GPLv3/Commercial). Goal: keep every Flickity API (`new Flickity`, `Flickity.data`, `Cell/Slide`, `select/destroy`, `data-flickity`, `$(el).flickity` via `$.bridget`) while swapping the 6 jQuery touchpoints for Mepto (`window.mepto || window.jQuery`). See `README.md` for user docs, `CONTRIBUTING.md` for contributor workflow.

**Runtime: Node 22 LTS required** (`.nvmrc` = 22, `engines.node` = `>=18`, `engine-strict` recommended). Run `nvm use`.

---

## Router — read the focused skill for your task

| You are…                                                                                                     | Read this first                                                     |
| ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| Verifying a change, running tests, dealing with ports/build                                                  | `CONTRIBUTING.md` → Test suite                                      |
| Changing DOM/carousel core, batching, rAF, perf                                                              | `PERFORMANCE_GUIDE.md` + `V8_OPTIMIZATION_RULES.md`                 |
| Touching `src/flickity.js` Mepto surface (`$element`, `dispatchEvent`, `bridget`, `removeData`, `setJQuery`) | `src/mepto-bridget.js` + `PERFORMANCE_GUIDE.md`                     |
| Running isolated snippets vs upstream Flickity                                                               | `test/flickity-api.html` + `test/flickity-api.spec.js` (Playwright) |
| Pushing, opening a PR, GitHub                                                                                | `CONTRIBUTING.md` → Git & GitHub workflow                           |
| Human contributor setup, test tiers, PR checklist                                                            | `CONTRIBUTING.md`                                                   |
| End-user install, usage, browser support                                                                     | `README.md`                                                         |
| Claude/Qwen-specific tooling                                                                                 | `CLAUDE.md` / `QWEN.md`                                             |

Do not guess past the router — open the doc. `AGENTS.md` stays short by design.

---

## Minimal verify loop (no build needed for API harness, build for dist)

```bash
npm run build          # Vite esnext + @rollup/plugin-babel (last 3) → ESM+IIFE ~90K/93K → ~70K/52K min (14.8K gzip), needs Node 22
npx playwright test test/flickity-api.spec.js --project=chromium  # API harness, ~1s, file://, 7 groups (30 checks)
npm test               # alias to playwright test --reporter=list
```

`test/flickity-api.html` is the Playwright harness (loads `mepto` + `dist/flickity.pkgd.js` from source, runs 7 API groups on `file://`). No dev server needed. For manual visual check, open `test/flickity-api.html` in browser — `<pre id="results">` shows PASS/FAIL.

---

## Agent entry points

- **All agents** — this file (`AGENTS.md`) auto-loaded. Start here, then router.
- **Claude Code** — also reads `CLAUDE.md` (Claude-specific paths, permissions, `playwright-cli` under `.claude/skills/`).
- **Qwen Code** — also reads `QWEN.md` (Qwen permissions, session plans under `.qwen/`).
- **Cursor** — reads `.cursor/rules/formatting.mdc` for style; otherwise follows this file.

---

## Do not edit

- `.claude/settings.local.json`, `.qwen/` — personal permissions/state (gitignored)
- `dist/`, `playwright-report/`, `.port` — generated outputs
- `src-orig/`, `README.upstream.md`, `package.upstream.json` — verbatim upstream v2.3.0 reference (do not edit)

---

## Quick references

- **Browser target:** evergreen only, Babel `last 3 versions` (esnext→transpiled). Use `WeakMap`/`Map`, `IntersectionObserver`, `requestAnimationFrame`, `classList`, `closest`, `CustomEvent` freely. Mepto provides `$.bridget`, `$.data`/`$.removeData` (WeakMap), `$.Event`, `$.batch`.
- **Current task:** Mepto APIs consumed via `window.mepto || window.jQuery` in `src/flickity.js`. Perf now via `src/scheduler.js` (`measure`/`mutate` rAF), `Map` instances, shape-stable ctors, `IntersectionObserver(root:viewport)` lazyLoad (single QSA at `activate`), drag `pointerMove` coalesced. Verify via `test/flickity-api.html` before/after.
- **Perf:** `PERFORMANCE_GUIDE.md` (consolidated) — Part I DOM (batching, rAF, thrashing) dominates, Part II V8 JIT only for hot internals. Measure reflows, not micro-optimizations. `lazyLoad` is IO, not per-`select` QSA.
