import Flickity from './flickity.js';
import utils from 'fizzy-ui-utils';

// Most performant: single IntersectionObserver per instance (root: viewport)
// + native loading/decoding hints. Falls back to per-select QSA on old browsers.
// Keeps html contract: <img data-flickity-lazyload>, .flickity-lazyloaded, lazyLoad event.

Flickity.createMethods.push('_createLazyload');
const proto = Flickity.prototype;

// hoisted selector — avoid string alloc per call (Part II Rule 27)
const LAZY_SELECTOR =
  'img[data-flickity-lazyload],img[data-flickity-lazyload-src],img[data-flickity-lazyload-srcset]';

proto._createLazyload = function () {
  if (!this.options.lazyLoad) return;
  // shape-stable placeholder for observer
  this._lazyObserver = null;

  // fallback for old browsers (no IO) — original per-select path
  if (typeof IntersectionObserver === 'undefined') {
    this.on('select', this.lazyLoad);
    return;
  }

  // one-time bulk read (Part I §3/§5) — not per-select
  const imgs = utils.makeArray(this.slider.querySelectorAll(LAZY_SELECTOR));
  if (!imgs.length) return;

  // native hints — free, compositor-friendly; IO remains authoritative for adjacency
  for (let i = 0; i < imgs.length; i++) {
    const img = imgs[i];
    // don't override explicit loading set by author
    if (!img.hasAttribute('loading')) img.loading = 'lazy';
    if (!img.hasAttribute('decoding')) img.decoding = 'async';
  }

  const lazyOpt = this.options.lazyLoad;
  const margin = typeof lazyOpt === 'number' ? `${lazyOpt * 50}%` : '50%';
  // root is flickity-viewport (overflow:hidden) — correct adjacency, not window
  const obs = new IntersectionObserver(
    (entries) => {
      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        if (!entry.isIntersecting) continue;
        const img = entry.target;
        obs.unobserve(img);
        loadImage(img, this);
      }
    },
    { root: this.viewport, rootMargin: `${margin} 0px`, threshold: 0 }
  );

  for (let i = 0; i < imgs.length; i++) obs.observe(imgs[i]);
  this._lazyObserver = obs;

  // also handle future cells added via insert/append — observe new lazy imgs
  // cellChange fires after insert/remove; observe any still-data- imgs in affected range
  this.on('cellChange', this._observeNewLazyImages);
};

proto._observeNewLazyImages = function () {
  const obs = this._lazyObserver;
  if (!obs) return;
  const imgs = utils.makeArray(this.slider.querySelectorAll(LAZY_SELECTOR));
  for (let i = 0; i < imgs.length; i++) {
    const img = imgs[i];
    if (!img.hasAttribute('loading')) img.loading = 'lazy';
    if (!img.hasAttribute('decoding')) img.decoding = 'async';
    obs.observe(img);
  }
};

proto.lazyLoad = function () {
  // fallback path only (no IO) — original adjacent scan
  const lazyLoad = this.options.lazyLoad;
  if (!lazyLoad) return;
  const adjCount = typeof lazyLoad === 'number' ? lazyLoad : 0;
  const cellElems = this.getAdjacentCellElements(adjCount);
  let lazyImages = [];
  for (let i = 0; i < cellElems.length; i++) {
    const cellLazy = getCellLazyImages(cellElems[i]);
    // push spread avoids concat O(n²)
    for (let j = 0; j < cellLazy.length; j++) lazyImages.push(cellLazy[j]);
  }
  for (let i = 0; i < lazyImages.length; i++) new LazyLoader(lazyImages[i], this);
};

const getCellLazyImages = (cellElem) => {
  if (cellElem.nodeName === 'IMG') {
    const a = cellElem.getAttribute('data-flickity-lazyload');
    const b = cellElem.getAttribute('data-flickity-lazyload-src');
    const c = cellElem.getAttribute('data-flickity-lazyload-srcset');
    if (a ?? b ?? c) return [cellElem];
  }
  const imgs = cellElem.querySelectorAll(LAZY_SELECTOR);
  return utils.makeArray(imgs);
};

const loadImage = (img, flickity) => {
  const onLoad = (e) => complete(img, flickity, e, 'flickity-lazyloaded');
  const onError = (e) => complete(img, flickity, e, 'flickity-lazyerror');
  img.addEventListener('load', onLoad, { once: true });
  img.addEventListener('error', onError, { once: true });
  const src =
    img.getAttribute('data-flickity-lazyload') ??
    img.getAttribute('data-flickity-lazyload-src');
  const srcset = img.getAttribute('data-flickity-lazyload-srcset');
  if (src) img.src = src;
  if (srcset) img.setAttribute('srcset', srcset);
  img.removeAttribute('data-flickity-lazyload');
  img.removeAttribute('data-flickity-lazyload-src');
  img.removeAttribute('data-flickity-lazyload-srcset');
};

const complete = (img, flickity, event, className) => {
  const cell = flickity.getParentCell(img);
  const cellElem = cell?.element;
  flickity.cellSizeChange(cellElem);
  img.classList.add(className);
  flickity.dispatchEvent('lazyLoad', event, cellElem);
};

class LazyLoader {
  constructor(img, flickity) {
    this.img = img;
    this.flickity = flickity;
    this.load();
  }

  handleEvent = utils.handleEvent;

  load() {
    this.img.addEventListener('load', this);
    this.img.addEventListener('error', this);
    const src =
      this.img.getAttribute('data-flickity-lazyload') ??
      this.img.getAttribute('data-flickity-lazyload-src');
    const srcset = this.img.getAttribute('data-flickity-lazyload-srcset');
    if (src) this.img.src = src;
    if (srcset) this.img.setAttribute('srcset', srcset);
    this.img.removeAttribute('data-flickity-lazyload');
    this.img.removeAttribute('data-flickity-lazyload-src');
    this.img.removeAttribute('data-flickity-lazyload-srcset');
  }

  onload(event) {
    this.complete(event, 'flickity-lazyloaded');
  }

  onerror(event) {
    this.complete(event, 'flickity-lazyerror');
  }

  complete(event, className) {
    this.img.removeEventListener('load', this);
    this.img.removeEventListener('error', this);
    complete(this.img, this.flickity, event, className);
  }
}

Flickity.LazyLoader = LazyLoader;

// ensure observer cleaned up on destroy (Part I §7 memory)
const _origDestroy = proto.destroy;
proto.destroy = function () {
  this._lazyObserver?.disconnect();
  this._lazyObserver = null;
  if (this._observeNewLazyImages) this.off('cellChange', this._observeNewLazyImages);
  return _origDestroy.call(this);
};

export default Flickity;
