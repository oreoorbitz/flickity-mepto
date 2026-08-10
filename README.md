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
  src/               # mepto-integrated ESM (patched flickity.js + mepto-bridget.js + verbatim others)
  css/flickity.css   # verbatim (copy to dist/flickity.css on build if needed)
  dist/              # Vite build output (gitignored, published to npm)
    flickity.esm.js       79K ESM unminified
    flickity.esm.min.js   59K ESM minified
    flickity.pkgd.js      81K IIFE unminified (global Flickity)
    flickity.pkgd.min.js  45K IIFE minified
  vite.config.mjs         # unminified ESM + IIFE
  vite.min.config.mjs     # minified
```

## Build

```sh
# dev — watch
npm run dev      # vite build --watch → dist/*.js (unminified, fast)

# prod — clean + unminified + minified
npm run build    # clean && vite build && vite build --config vite.min.config.mjs
# outputs: dist/flickity.esm.js, flickity.pkgd.js, flickity.esm.min.js, flickity.pkgd.min.js

# node 18+ required (see .nvmrc)
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

Frozen from v2.3.0 — `new Flickity`, `Flickity.data(elem)`, `defaults`, `Cell`, `Slide`, `select/next/previous/destroy/resize/reposition`, events `ready/select/change/settle`, `data-flickity` htmlInit. See upstream docs at https://flickity.metafizzy.co.

## License

GPLv3 for open source, Commercial for commercial use — same as upstream Flickity. See https://flickity.metafizzy.co for commercial licensing.
