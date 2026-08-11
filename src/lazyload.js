import Flickity from './flickity.js';
import utils from 'fizzy-ui-utils';

Flickity.createMethods.push('_createLazyload');
const proto = Flickity.prototype;

proto._createLazyload = function () {
  this.on('select', this.lazyLoad);
};

proto.lazyLoad = function () {
  const lazyLoad = this.options.lazyLoad;
  if (!lazyLoad) return;
  const adjCount = typeof lazyLoad === 'number' ? lazyLoad : 0;
  const cellElems = this.getAdjacentCellElements(adjCount);
  let lazyImages = [];
  cellElems.forEach((cellElem) => {
    const lazyCellImages = getCellLazyImages(cellElem);
    lazyImages = lazyImages.concat(lazyCellImages);
  });
  lazyImages.forEach((img) => new LazyLoader(img, this), this);
};

const getCellLazyImages = (cellElem) => {
  if (cellElem.nodeName === 'IMG') {
    const lazyloadAttr = cellElem.getAttribute('data-flickity-lazyload');
    const srcAttr = cellElem.getAttribute('data-flickity-lazyload-src');
    const srcsetAttr = cellElem.getAttribute('data-flickity-lazyload-srcset');
    if (lazyloadAttr ?? srcAttr ?? srcsetAttr) return [cellElem];
  }
  const lazySelector =
    'img[data-flickity-lazyload], img[data-flickity-lazyload-src], img[data-flickity-lazyload-srcset]';
  const imgs = cellElem.querySelectorAll(lazySelector);
  return utils.makeArray(imgs);
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
    this.img.src = src;
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
    const cell = this.flickity.getParentCell(this.img);
    const cellElem = cell?.element;
    this.flickity.cellSizeChange(cellElem);
    this.img.classList.add(className);
    this.flickity.dispatchEvent('lazyLoad', event, cellElem);
  }
}

Flickity.LazyLoader = LazyLoader;

export default Flickity;
