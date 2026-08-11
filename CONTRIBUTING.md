# Contributing to Flickity-Mepto

Thanks for helping out! Flickity-Mepto is a Mepto-integrated, jQuery-free drop-in for `Flickity PACKAGED v2.3.0`. This guide covers dev setup, test harness, CI gates, and style — mirroring `Mepto/` dev harness.

> **Status:** Mepto APIs (`$.bridget`, WeakMap `$.data`/`$.removeData`, `$.Event` + `trigger` 2-arg, `$.batch`, `$.raf`/`$.measure`/`$.mutate`) are implemented in `Mepto/src/mepto.ts`. `flickity-mepto/src/flickity.js` consumes via `window.mepto || window.jQuery` with `mepto-bridget.js` shim fallback. API frozen to upstream v2.3.0.

---

## Table of contents

- [Prerequisites](#prerequisites)
- [Dev setup](#dev-setup)
- [The test suite](#the-test-suite)
- [Code style](#code-style)
- [Pull request checklist](#pull-request-checklist)
- [What not to edit](#what-not-to-edit)
- [Working with an AI coding assistant](#working-with-an-ai-coding-assistant)
- [Git & GitHub workflow](#git--github-workflow)

---

## Prerequisites

**Node.js 22 (LTS) is required.** Pinned to Node 22 (`.nvmrc` = 22, `engines.node` = `>=18`). Any other version may produce lockfile churn.

```sh
node --version    # should print v22.x
nvm use           # reads .nvmrc
```

You'll also need Playwright Chromium for the API harness (installed below).

## Dev setup

```sh
git clone https://github.com/oreoorbitz/flickity-mepto.git
cd flickity-mepto
npm ci                      # install deps (vite, @babel/* + @rollup/plugin-babel, eslint, playwright, esbuild, terser)
npx playwright install --with-deps chromium   # one-time: browser for harness
npm run build               # clean && vite build (ESM+IIFE ~90K/93K) && vite.min (~70K/52K, 14.8K gzip, Babel last 3)
npm run dev                 # watch mode: vite build --watch (esnext→Babel)
```

> **No build step is needed for the API harness itself** — `test/flickity-api.html` loads `dist/flickity.pkgd.js` (built once) and `mepto` from `test/mepto.js` (bundled from `meptos/src/mepto.ts`). For manual visual check, open `test/flickity-api.html` in browser — `<pre id="results">` shows PASS/FAIL.

## The test suite

Single tier — fast, deterministic, API-frozen. Run before every PR.

| Command                                                            | Time | Tests    | What it checks                                                                                                                                                                                                                                              |
| ------------------------------------------------------------------ | ---- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm test`                                                         | ~1s  | 7 groups | Playwright `test/flickity-api.spec.js` — `new Flickity`, `Flickity.data`, `Cell/Slide`, `select/next/previous/resize/reposition`, `EvEmitter` + Mepto `select.flickity`, `$.fn.flickity` bridget, `setJQuery/setMepto`, `destroy`, `data-flickity` htmlInit |
| `npx playwright test test/flickity-api.spec.js --project=chromium` | ~1s  | same     | Same harness, explicit project                                                                                                                                                                                                                              |
| `npm run build && npm test`                                        | ~2s  | same     | Closest local mirror of CI (build + harness)                                                                                                                                                                                                                |

### One-shot full validation

```sh
npm run build && npm test
```

### Where tests live

- **`test/flickity-api.html`** — the 7-group browser harness. Loads Mepto + Flickity from `dist/`, runs on `file://`, exposes `window.__flickityApiResults` / `window.__flickityApiFailed`.
- **`test/flickity-api.spec.js`** — Playwright driver for `flickity-api.html` (`page.goto(fileUrl)`, `waitForFunction`, asserts every `PASS:`).
- **`playwright.config.js`** — `testDir: test`, `timeout: 10000`, `headless: true`, `reporter: list`.

### What's covered vs. not

Covered: all frozen v2.3.0 APIs used by Shopify themes (`new Flickity`, `Flickity.data`, `defaults`, `Cell/Slide`, `select/next/previous/destroy/resize/reposition`, events `ready/select/change/settle`, `data-flickity`, `$(el).flickity`). Not covered: visual pixel diff, `as-nav-for` / `imagesloaded` add-ons (removed from PACKAGED), full perf bench (see `PERFORMANCE_GUIDE.md`).

## Code style

Consistent for humans + LLMs — enforced via VS Code + Cursor + ESLint + Prettier (see `.vscode/settings.json`, `.cursor/rules/formatting.mdc`, `.editorconfig`):

- **Prettier** `requireConfig: true`, `formatOnSave: true`, `eslint --fix` on save.
- **ESLint** `eslint:recommended`, `ecmaVersion 2022`, `browser: true`, `no-unused-vars` warn.
- **Files:** `files.eol = \n`, `indent_size = 2`, `trim_trailing_whitespace = true`.
- **No `dist/` hand-edits** — `dist/` is build artifact (`vite build`). Edit `src/` only.

Run before commit:

```sh
npx eslint src --ext .js
npx prettier --check "src/**/*.{js,json,md}" "test/**/*.{js,html}"
```

## Pull request checklist

- [ ] `nvm use` (Node 22)
- [ ] `npm run build` exits 0, `dist/*.js` ~90K/~93K → ~70K/~52K min present (14.8K gzip), banner `/*! Flickity PACKAGED v2.3.0-mepto`
- [ ] `npm test` — all 7 groups `PASS` (30 checks, Playwright `file://`, `test/flickity-api.html`)
- [ ] No `src-orig/` / `README.upstream.md` edits (verbatim upstream)
- [ ] Mepto APIs used via `window.mepto || window.jQuery` fallback, `setMepto` alias preserved
- [ ] No client store names in `README.md` / `src/` / messages (whiteout check: `grep -r <store-name>`)

## What not to edit

- `src-orig/`, `README.upstream.md`, `package.upstream.json` — verbatim v2.3.0 reference
- `dist/`, `playwright-report/`, `.port` — generated
- `.claude/settings.local.json`, `.qwen/` — personal state (gitignored)

## Working with an AI coding assistant

- Start at `AGENTS.md` router, then focused doc. Each skill is single source of truth.
- For DOM/perf changes, read `PERFORMANCE_GUIDE.md` (Part I DOM dominates, Part II V8 only for hot paths).
- For Mepto surface changes, check `Mepto/src/mepto.ts` APIs (`$.bridget`, WeakMap `$.data`, `$.Event`, `$.batch`, `$.raf`) — `flickity-mepto` consumes via fallback.
- Run `npm test` (Playwright harness) before every push — API frozen.

## Git & GitHub workflow

- Branch from `main`, name `feat/...` or `fix/...`, open PR to `main`.
- Keep `dist/` green between commits (build before push).
- Commit style: `feat|fix|chore|docs(scope): summary` (see `git log`).
- No force push to `main` without admin bypass (branch protection may be enabled).
