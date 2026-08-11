# flickity-mepto — Mepto-integrated Flickity 2.3.0

Efficient, drop-in replacement for `Flickity PACKAGED v2.3.0` (last upstream release 2021-12-19, GPLv3/Commercial). Migrate legacy Shopify themes (and any site) off jQuery.

## Why

Legacy themes bundle Flickity via `jquery-bridget` and expect `window.jQuery` (`$.bridget`, `$.data`, `$.Event`, `$element.trigger`). This fork keeps every Flickity API and swaps that surface for Mepto (`window.mepto || window.jQuery`), so themes can drop jQuery.

- Upstream `Flickity PACKAGED = jquery-bridget v2.0.1 + ev-emitter + get-size + fizzy-ui-utils + unidragger/unipointer + flickity core` — the only jQuery touch is the bridget/data/event layer.
- `getSize` is vanilla (0 jQuery) and stays as-is.

## Install

```sh
npm install flickity-mepto meptos
# or via CDN after build: dist/flickity.pkgd.min.js (IIFE) + dist/flickity.min.css
```

## Goal — keep every Flickity API, replace jQuery with Mepto

- `new Flickity(elem, opts)` , `Flickity.data(elem)`, `Flickity.Cell/Slide`, `Flickity.defaults`, `Flickity.createMethods`, `Flickity.setJQuery` — identical to v2.3.0.
- `$(elem).flickity(opts)` plugin via bridget stays, but backed by Mepto (`window.mepto || window.jQuery`).
- No breaking HTML: `data-flickity`, `.flickity-enabled`, `.flickity-viewport`, page-dots, prev/next, lazyload, `flickity-as-nav-for` / `imagesloaded` still work.
- More efficient than PACKAGED: remove `jquery-bridget` UMD, remove dead `imagesloaded/as-nav-for` from bundle, tree-shake via Vite ESM.

## jQuery surface mapped → Mepto

| Upstream `js/flickity.js` line            | jQuery                   | Mepto equivalent                                                              |
| ----------------------------------------- | ------------------------ | ----------------------------------------------------------------------------- |
| 50 `var jQuery = window.jQuery`           | `window.jQuery`          | `window.mepto \|\| window.jQuery \|\| window.$`                               |
| 85 `this.$element = jQuery(this.element)` | `$(el)`                  | `$ (mepto)`, same                                                             |
| 483 `new jQuery.Event(event)`             | `$.Event`                | `new $.Event` (mepto Event) or fallback `new Event`                           |
| 493 `this.$element.trigger($event, args)` | `$().trigger`            | `$.fn.trigger` (mepto)                                                        |
| 897 `jQuery.removeData(el,'flickity')`    | `$.removeData`           | `el.flickityGUID` delete + `delete instances[guid]` (mepto has no removeData) |
| 922 `jQuery.bridget('flickity',F)`        | `$.bridget`              | shim `src/mepto-bridget.js` → `$.fn.flickity`                                 |
| 926 `Flickity.setJQuery(jq)`              | rebind internal `jQuery` | `setMepto = setJQuery` alias, both set `$`                                    |

## Layout

```
flickity-mepto/
  src-orig/          # verbatim v2.3.0 js/ (reference, do not edit)
  src/               # modern ESM (ES2024, Babel → last 3 versions) + perf batching
    flickity.js      # Map instances, shape-stable ctor, DocumentFragment batch, scheduler import
    cell.js/slide.js # class syntax, shape-stable
    animate.js       # hoisted modulo, _boundAnimate per-rAF (no closure per frame)
    drag.js          # rAF-coalesced pointerMove via scheduler.mutate
    lazyload.js      # IntersectionObserver(root:viewport) + native loading/decoding, single QSA at activate
    scheduler.js     # tiny FastDOM measure/mutate (rAF, reads→writes)
    mepto-bridget.js # ESM bridget shim
  css/flickity.css   # verbatim (copy to dist/flickity.css on build if needed)
  dist/              # Vite build output (gitignored, published to npm)
    flickity.esm.js       ~90K ESM unminified (Babel, esnext→last 3)
    flickity.esm.min.js   ~70K ESM minified
    flickity.pkgd.js      ~93K IIFE unminified (global Flickity)
    flickity.pkgd.min.js  ~52K IIFE minified (14.8K gzip)
  vite.config.mjs         # esnext + @rollup/plugin-babel (bundled helpers, last 3)
  vite.min.config.mjs     # esnext + babel + esbuild min
  babel.config.json       # preset-env targets last 3, bugfixes true
```

## Build

```sh
# dev — watch (esnext source, Babel in vite pipeline)
npm run dev      # vite build --watch → dist/*.js (unminified, fast)

# prod — clean + unminified + minified (Babel last 3 → 14.8K gzip)
npm run build    # clean && vite build && vite build --config vite.min.config.mjs && banner
# outputs: dist/flickity.esm.js (~90K), flickity.pkgd.js (~93K), flickity.esm.min.js (~70K), flickity.pkgd.min.js (~52K)

# verify
npm test         # Playwright 7 groups, 30 checks, ~1s

# node 22 LTS required (see .nvmrc, engines >=18)
nvm use
```

## Use

**Shopify theme (IIFE):**

```liquid
{{ 'mepto.js' | asset_url | script_tag }}
{{ 'flickity-mepto.js' | asset_url | script_tag }}
{{ 'flickity.css' | asset_url | stylesheet_tag }}
```

```js
new Flickity('.carousel', { cellAlign: 'left', contain: true })
$('.carousel').flickity({ wrapAround: true }) // bridget via Mepto
Flickity.setJQuery = Flickity.setMepto // compat
```

**ESM:**

```js
import Flickity from 'flickity-mepto' // or 'flickity-mepto/dist/flickity.esm.js'
import 'flickity-mepto/css/flickity.css'
new Flickity(elem, opts)
```

## API

Frozen from v2.3.0 — `new Flickity`, `Flickity.data(elem)` (now `Map`), `defaults`, `Cell`/`Slide` (now `class`), `select/next/previous/destroy/resize/reposition`, events `ready/select/change/settle`, `data-flickity` htmlInit. `lazyLoad` now `IntersectionObserver(root: viewport)` + `loading=lazy`/`decoding=async` (single bulk read at `activate`, no per-`select` QSA). Drag `pointerMove` coalesced via `scheduler.mutate` (one `transform` per `rAF`). See upstream docs at https://flickity.metafizzy.co.

## Performance

`PERFORMANCE_GUIDE.md` Part I (DOM) dominates: batch via `DocumentFragment`, `measure`/`mutate` `rAF` (reads→writes), `Map` instances (no `delete` deopt), shape-stable ctors (V8 hidden classes), hoisted `modulo`/bound `animate`. Measure reflows with Chrome Performance, not micro-benchmarks.

## License

GPLv3 for open source, Commercial for commercial use — same as upstream Flickity. See https://flickity.metafizzy.co for commercial licensing.
