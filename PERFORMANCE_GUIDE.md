# Performance Guide for Mepto Projects — Consolidated

> **Source:** Consolidated from `V8_OPTIMIZATION_RULES.md` (V8 JIT rules, `Mepto/`) and `OPTIMIZATIONS.md` (DOM/rendering, `Mepto/`) on 2026-08-09. This single file supersedes both in the orchestration directory. Keep `V8_OPTIMIZATION_RULES.md` and `OPTIMIZATIONS.md` as references or remove after review — this guide is the canonical version.
>
> **Audience:** Mepto projects (`Mepto`, `flickity-mepto`, `shopify_option_selection`, `cartjs` + theme). Two cost centers: **Browser layout engine** (dominant) and **V8 JIT** (hot library internals only).

---

# Part I — DOM & Rendering Optimizations (Browser — Dominant Cost)

> _From `OPITMIZATIONS.md` (typo fixed on copy). Priority order for a lightweight jQuery replacement._

**Purpose:** Outperform jQuery in real scenarios by minimizing reflows, repaints, layout thrashing, and DOM queries. Familiar chainable API where useful, but default to fast vanilla.

**Key Mindset:** The live DOM is expensive. Every append/style/query can trigger sync work. jQuery hides per-operation costs (wrappers, Sizzle, abstractions) that compound in loops. Win by batching, caching, scheduling, reusing — zero-dependency, modern code. Always measure with Chrome DevTools Performance (reflow/repaint counts, long tasks, DOM node count) vs jQuery equivalents.

**High-Impact Areas (priority order):** Batching updates → Read/write separation → Caching & minimal queries → Smart scheduling (rAF) → Memory & cleanup → Event delegation.

**Light V8 Reminder (library internals only):** In hot helpers, prefer consistent shapes/types where free (fixed property order). Do not sacrifice API clarity for marginal JIT gains — layout dominates.

## Measurement First

- DevTools Performance recording on realistic scenarios: large lists, frequent updates, mobile.
- Compare reflow/repaint counts, main-thread time, heap growth vs jQuery.
- Target 60fps, good INP (Interaction to Next Paint).

### Step 1: Minimize Live DOM Touches

- Prefer modifying/reusing existing elements over create/remove cycles.
- Library: Default to batching and reuse in multi-element APIs. Offer node pooling/recycling for lists.

### Step 2: Batching DOM Updates (Highest Impact)

- One-by-one insertions trigger multiple reflows — very costly for 50+ items (common jQuery anti-pattern).
- Best practice: `DocumentFragment` internally for bulk ops.
- Library: Expose `batchUpdate(container, updaterFn)` or chainable batch methods. For HTML strings, `insertAdjacentHTML` carefully, but favor fragments for complex trees.

### Step 3: Avoid Layout Thrashing

- Alternating reads (`offsetWidth`, `getBoundingClientRect`) and writes forces sync layout.
- Fix: Strictly separate reads then writes; cache measurements.
- Library: Queue operations or lightweight flush system (optionally tied to rAF). Provide `measure()`/`mutate()` helpers. Encourage `classList` and `cssText` over many `style.prop` sets.

### Step 4: Scheduling with `requestAnimationFrame`

- Batch visual changes to browser paint cycles.
- Library: Optional async/batched mode for animations/high-frequency updates. Auto-schedule tight loops.

### Step 5: Caching and Minimizing DOM Queries

- `querySelector*` and traversals are slower than expected, especially when repeated (jQuery's Sizzle overhead).
- Best practice: Cache element refs internally (`WeakMap` for user data). Scope queries narrowly.
- Library: Internal managed-element cache; simple selector helpers that encourage caching.

### Step 6: Efficient Event Handling

- Per-element listeners waste memory/CPU, especially with dynamic content.
- Use event delegation: single listener on container + `event.target`.
- Library: Built-in delegated events with automatic cleanup on node removal (`AbortController` or explicit remove).

### Step 7: Memory Management and Leak Prevention

- Lingering references (closures, listeners, data) keep DOM nodes alive.
- Use `WeakMap`/`WeakSet` for element-associated data.
- Prefer modify-in-place over destroy/create.
- For large/dynamic lists: virtualization helpers (render visible items only, recycle nodes).

### Step 8: Additional High-Impact Patterns

- Creation: Favor `<template>` cloning + `appendChild`/`insertAdjacentElement` over many `createElement` + sets.
- Animations: Prefer CSS `transform`/`opacity` (compositor thread) over JS style changes.
- Fine-grained updates: Offer paths to update only changed parts (attributes/text) instead of full re-renders.
- Modern option: Evaluate lightweight signals or incremental diffing if it fits API without heavy virtual DOM.

### Step 9: Decision Process for Library Features & Migration

1. Profile in isolation and realistic use (large sets, frequent calls, mobile).
2. Default to batching, read/write separation, and rAF.
3. Provide familiar jQuery-like syntax where it doesn't hurt performance, but document faster native alternatives.
4. Offer escape hatches for power users but guide toward optimized paths.
5. Document anti-patterns (e.g., “Avoid repeated `getBoundingClientRect` in update loops”) and jQuery equivalents with notes.
6. Re-measure reflow counts, node count, bundle size.
7. Test gradual migration: Allow mixed jQuery + Mepto during transition, then encourage full replacement.

---

# Part II — V8 JIT Optimization Rules (Hot Library Internals Only)

> _From `V8_OPTIMIZATION_RULES.md`. For the ~2,200-line TypeScript DOM library core — rules favor "predictable for the JIT" over cleverness. Only hot functions matter; profile first._

**Rule 0 (meta):** V8's pipeline (Ignition → Sparkplug → Maglev → TurboFan) optimizes _observed_ behavior and deopts when assumptions break; only hot functions matter, so profile first (`node --prof`, Chrome DevTools Performance, `--trace-deopt`, `%GetOptimizationStatus` with `--allow-natives-syntax`) and keep code idiomatic. V8's own engineers: _"Write idiomatic JavaScript, let the engine take care of the performance, optimize only when necessary and after careful profiling."_

## A. Object shapes / hidden classes

**1.** Initialize every property an object will ever have inside the constructor, in same order, every time (use `null`/`undefined` placeholders).
**2.** Never add properties to an object conditionally on a hot path (`if (x) obj.feature = ...`).
**3.** Don't `delete` object properties; for deletable entries use a `Map` (or assign `undefined` if "key still exists" semantics ok).
**4.** For string-keyed caches with churn (e.g. `Record<string, RegExp>`), prefer `Map`; use plain object only for small, fixed, write-once key sets.
**5.** Don't mix "struct" and "dictionary" usage on same object.
**6.** `this[i] = ...` in constructor builds _elements_ store, not properties — but hand-rolled array-like is still second-class; `Array.prototype` methods are "highly optimized" for real arrays.
**7.** Keep hot functions monomorphic: one object shape (and one elements kind) per call site; ≤4 shapes tolerable, more is megamorphic (100→900 shapes: 43ms→2,428ms).
**8.** When you must iterate heterogeneous objects, hoist method out of loop instead of megamorphic `obj.method()` inside loop.
**9.** Membership tests on caches: prefer `Map.has`; on plain objects use `key in obj` only on null-prototype objects, never `obj.hasOwnProperty(key)` in hot loop.
**10.** `Object.create(null)` is right _object_ choice for string-keyed dictionaries (no `__proto__` pollution), but for high-churn caches `Map` still wins.

## B. `arguments` and arity dispatch

**11.** Never let `arguments` escape: don't return, pass, store, or `[].slice.call(arguments)` it.
**12.** If you use `arguments`, restrict to safe subset: `arguments.length`, `arguments[i]` (in bounds), and `fn.apply(thisArg, arguments)`.
**13.** Prefer rest parameters `(...args)` over `arguments` for new code — real packed arrays, optimizable.
**14.** For arity dispatch use `arguments.length` (safe) — but avoid `0 in arguments` existence checks, prefer default params.

## C. try/catch

**15.** `try/catch` is no longer optimization killer — `try { JSON.parse(x) } catch {}` is acceptable even in warm code. _Why:_ Crankshaft refused to optimize functions with try/catch; TurboFan (V8 5.3/5.6, Chrome 56+/Node 7+) optimizes whole language.
**16.** Still: don't use exceptions as routine control flow in hot loops — throwing is expensive, not `try` block.

## D. Iteration & arrays

**17.** Never loop past end of array (`for (let i = 0; (item = items[i]) != null; i++)`) — V8's #1 tip, explicitly calling out "jQuery uses this pattern". One out-of-bounds read taints load site; fixing `i <= length` to `i < length` gave **6×** speedup.
**18.** `for...of` and `forEach` now on par with classic indexed `for` — choose most readable.
**19.** Don't repeatedly run array generics on array-likes (`Array.prototype.filter.call(nodeList, fn)`); convert once (`[...nodeList]`, `Array.from`) if more than once, or use `for...of` directly.
**20.** Default to `Object.keys(obj)` + indexed loop for object enumeration; use `for...in` only on objects you control — never on arrays.
**21.** Keep arrays' elements kinds stable and packed: build with literals or `push`, don't mix numbers/strings/objects in one hot array.
**22.** Route hot iteration over many differently-kinded arrays through built-ins rather than own `each()` utility.

## E. RegExp & strings

**23.** Define regexes once at module scope; never add own properties to regex instance or monkey-patch `RegExp.prototype`.
**24.** Never call `.test()`/`.exec()` on shared regex with `/g` (or `/y`) — drop flag for boolean tests or reset `lastIndex`.
**25.** Collapse `.replace()` chains into single pass where practical — k chained replaces allocate k intermediate strings.
**26.** Building strings with `+=` is fine in modern V8 (ropes + constant folding) — don't contort to push+join; less churn = less GC.

## F. Allocation & closures in hot code

**27.** Hoist loop-invariant allocations — compiled regexes, `Set`s, callbacks, cached lookups — out of hot functions/loops.
**28.** Don't allocate closures per iteration in hot paths; define stable callbacks once.

## G. DOM-specific (overlap with Part I — kept for JIT context)

**29.** Use `classList.add/remove/toggle/contains` instead of `className` string surgery; reserve `className = "..."` for wholesale replacement.
**30.** Strictly separate DOM read phases from write phases — read all geometry first, then apply mutations; never `write → read → write` in loop (layout thrashing).
**31.** Treat `getComputedStyle()` as expensive: call once and cache, never per-element in loops.
**32.** Call `getBoundingClientRect()`/offset*/client* only at frame start when values still match last layout, cache within frame.
**33.** Use native `el.closest(selector)`, `node.contains(other)`, and `el.matches(selector)` instead of hand-rolled `parentNode`/`while` climbs.

---

## Still true in modern V8 (2024+) vs. outdated myths

| Claim                                                | Verdict (V8 12.x)                                                            | Evidence                                    |
| ---------------------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------- |
| Hidden classes / ICs / monomorphism                  | **Still true**                                                               | mathiasbynens.be/notes/shapes-ics; mrale.ph |
| `delete` ruins object                                | **Still true** — dictionary mode                                             | v8.dev/blog/fast-properties                 |
| Initialize all fields in constructor, same order     | **Still true**                                                               | shapes-ics                                  |
| Elements-kind transitions one-way; holes forever     | **Still true**                                                               | v8.dev/blog/elements-kinds                  |
| Reading past array length poisons load site          | **Still true** (6× example; jQuery called out)                               | v8.dev/blog/elements-kinds                  |
| Escaping `arguments` toxic; rest params preferred    | **Still true**                                                               | Bluebird wiki                               |
| `Map` beats object for churn-heavy caches            | **Still true**                                                               | MDN; node-lru-cache #54                     |
| Layout thrashing forced sync layout is main DOM cost | **Still true**                                                               | web.dev; Paul Irish gist                    |
| `/g` regex `lastIndex` statefulness                  | **Still true** (spec)                                                        | MDN RegExp/lastIndex                        |
| "try/catch prevents optimization"                    | **Outdated myth** — fixed in V8 5.3/5.6. Only _throwing_ costly              | Bluebird wiki; v8.dev/blog/v8-release-56    |
| "Merely mentioning `arguments` allocates it"         | **Outdated (was always FUD)**                                                | Bluebird wiki                               |
| "`for...in` is always slow"                          | **Outdated** — EnumCache fast path since 2017                                | v8.dev/blog/fast-for-in                     |
| "Manual `for` beats `forEach`/`for...of`"            | **Outdated** — "on par" per V8                                               | v8.dev/blog/elements-kinds                  |
| "String `+=` in loops slow; use join"                | **Mostly outdated** — ropes + constant folding                               | V8-dev SO                                   |
| "Manually cache `array.length` before loops"         | **Outdated** — engines hoist                                                 | v8.dev/blog/elements-kinds                  |
| "Avoid all closures/allocations in loops"            | **Overstated** — young-gen GC cheap; only hoist in _proven-hot_ code         | v8.dev/blog/trash-talk                      |
| Bluebird "Optimization killers" list as whole        | **Mostly historical** — wiki warns "All this is wrong in TurboFan (Node 8+)" | Bluebird wiki                               |

### Verification toolkit

- `node --trace-opt --trace-deopt app.js`, `%GetOptimizationStatus(fn)` / `%HaveSameMap(a,b)` / `%HasFastProperties(obj)` under `--allow-natives-syntax`.
- Chrome DevTools Performance panel: watch for purple "Layout"/"Recalculate Style" flagged _forced reflow_ after library calls.

---

## How to Use This Consolidated Guide

1. **For DOM work (Part I):** Default to batching, read/write separation, rAF, caching, delegation. Measure reflows, INP, 60fps. This is where 90% of gains come from.
2. **For library internals (Part II):** Apply JIT rules only to proven-hot helpers (e.g., `src/` core loops, `flickity-mepto` internals). Keep code idiomatic; don't sacrifice API clarity for marginal JIT wins.
3. **When in doubt:** Profile first. Browser layout costs dominate; V8 micro-optimizations are secondary and only for hot paths confirmed by `--trace-deopt` or Performance panel.
