import EvEmitter from 'ev-emitter';
import getSize from 'get-size';
import utils from 'fizzy-ui-utils';
import Cell from './cell.js';
import Slide from './slide.js';
import { animatePrototype } from './animate.js';

const G = globalThis;
let jQuery = G.mepto ?? G.jQuery ?? G.$ ?? null;
let $ = jQuery;
const getComputedStyle = G.getComputedStyle?.bind(G) ?? (() => ({ content: '' }));
const consoleObj = G.console;

const moveElements = (elems, toElem) => {
  elems = utils.makeArray(elems);
  while (elems.length) toElem.appendChild(elems.shift());
};

let GUID = 0;
const instances = {};

export default class Flickity extends EvEmitter {
  constructor(element, options) {
    super();
    const queryElement = utils.getQueryElement(element);
    if (!queryElement) {
      consoleObj?.error(`Bad element for Flickity: ${queryElement ?? element}`);
      return;
    }
    this.element = queryElement;
    if (this.element.flickityGUID) {
      const instance = instances[this.element.flickityGUID];
      if (instance) instance.option(options);
      return instance;
    }

    if (jQuery) {
      try {
        this.$element = jQuery(this.element);
      } catch (_) {
        this.$element = null;
      }
    }

    this.options = utils.extend({}, this.constructor.defaults);
    this.option(options);
    this._create();
  }

  static defaults = {
    accessibility: true,
    cellAlign: 'center',
    freeScrollFriction: 0.075,
    friction: 0.28,
    namespaceJQueryEvents: true,
    percentPosition: true,
    resize: true,
    selectedAttraction: 0.025,
    setGallerySize: true,
  };

  static createMethods = [];

  static keyboardHandlers = {
    37() {
      const leftMethod = this.options.rightToLeft ? 'next' : 'previous';
      this.uiChange();
      this[leftMethod]();
    },
    39() {
      const rightMethod = this.options.rightToLeft ? 'previous' : 'next';
      this.uiChange();
      this[rightMethod]();
    },
  };

  static data(elem) {
    elem = utils.getQueryElement(elem);
    const id = elem?.flickityGUID;
    return id ? instances[id] : null;
  }

  static setJQuery(jq) {
    jQuery = jq;
    $ = jq;
    G.mepto = G.jQuery = G.$ = jq;
  }

  option(opts) {
    utils.extend(this.options, opts);
  }

  _create() {
    const id = (this.guid = ++GUID);
    this.element.flickityGUID = id;
    instances[id] = this;
    this.selectedIndex = 0;
    this.restingFrames = 0;
    this.x = 0;
    this.velocity = 0;
    this.originSide = this.options.rightToLeft ? 'right' : 'left';
    this.viewport = document.createElement('div');
    this.viewport.className = 'flickity-viewport';
    this._createSlider();

    if (this.options.resize || this.options.watchCSS) {
      G.addEventListener('resize', this);
    }

    for (const eventName in this.options.on ?? {}) {
      const listener = this.options.on[eventName];
      this.on(eventName, listener);
    }

    Flickity.createMethods.forEach((method) => this[method]());

    if (this.options.watchCSS) this.watchCSS();
    else this.activate();
  }

  activate() {
    if (this.isActive) return;
    this.isActive = true;
    this.element.classList.add('flickity-enabled');
    if (this.options.rightToLeft) this.element.classList.add('flickity-rtl');

    this.getSize();
    const cellElems = this._filterFindCellElements(this.element.children);
    moveElements(cellElems, this.slider);
    this.viewport.appendChild(this.slider);
    this.element.appendChild(this.viewport);
    this.reloadCells();

    if (this.options.accessibility) {
      this.element.tabIndex = 0;
      this.element.addEventListener('keydown', this);
    }

    this.emitEvent('activate');
    this.selectInitialIndex();
    this.isInitActivated = true;
    this.dispatchEvent('ready');
  }

  _createSlider() {
    const slider = document.createElement('div');
    slider.className = 'flickity-slider';
    slider.style[this.originSide] = 0;
    this.slider = slider;
  }

  _filterFindCellElements(elems) {
    return utils.filterFindElements(elems, this.options.cellSelector);
  }

  reloadCells() {
    this.cells = this._makeCells(this.slider.children);
    this.positionCells();
    this._getWrapShiftCells();
    this.setGallerySize();
  }

  _makeCells(elems) {
    const cellElems = this._filterFindCellElements(elems);
    return cellElems.map((cellElem) => new Cell(cellElem, this));
  }

  getLastCell() {
    return this.cells[this.cells.length - 1];
  }

  getLastSlide() {
    return this.slides[this.slides.length - 1];
  }

  positionCells() {
    this._sizeCells(this.cells);
    this._positionCells(0);
  }

  _positionCells(index) {
    index = index ?? 0;
    this.maxCellHeight = index ? this.maxCellHeight ?? 0 : 0;
    let cellX = 0;
    if (index > 0) {
      const startCell = this.cells[index - 1];
      cellX = startCell.x + startCell.size.outerWidth;
    }
    const len = this.cells.length;
    for (let i = index; i < len; i++) {
      const cell = this.cells[i];
      cell.setPosition(cellX);
      cellX += cell.size.outerWidth;
      this.maxCellHeight = Math.max(cell.size.outerHeight, this.maxCellHeight);
    }
    this.slideableWidth = cellX;
    this.updateSlides();
    this._containSlides();
    this.slidesWidth = len ? this.getLastSlide().target - this.slides[0].target : 0;
  }

  _sizeCells(cells) {
    cells.forEach((cell) => cell.getSize());
  }

  updateSlides() {
    this.slides = [];
    if (!this.cells.length) return;

    let slide = new Slide(this);
    this.slides.push(slide);
    const isOriginLeft = this.originSide === 'left';
    const nextMargin = isOriginLeft ? 'marginRight' : 'marginLeft';
    const canCellFit = this._getCanCellFit();

    this.cells.forEach((cell, i) => {
      if (!slide.cells.length) {
        slide.addCell(cell);
        return;
      }
      const slideWidth =
        slide.outerWidth - slide.firstMargin + (cell.size.outerWidth - cell.size[nextMargin]);
      if (canCellFit.call(this, i, slideWidth)) {
        slide.addCell(cell);
      } else {
        slide.updateTarget();
        slide = new Slide(this);
        this.slides.push(slide);
        slide.addCell(cell);
      }
    });
    slide.updateTarget();
    this.updateSelectedSlide();
  }

  _getCanCellFit() {
    const groupCells = this.options.groupCells;
    if (!groupCells) {
      return () => false;
    } else if (typeof groupCells === 'number') {
      const number = parseInt(groupCells, 10);
      return (i) => i % number !== 0;
    }
    const percentMatch = typeof groupCells === 'string' ? groupCells.match(/^(\d+)%$/) : null;
    const percent = percentMatch ? parseInt(percentMatch[1], 10) / 100 : 1;
    return function (i, slideWidth) {
      return slideWidth <= (this.size.innerWidth + 1) * percent;
    };
  }

  reposition() {
    this.positionCells();
    this.positionSliderAtSelected();
  }

  getSize() {
    this.size = getSize(this.element);
    this.setCellAlign();
    this.cursorPosition = this.size.innerWidth * this.cellAlign;
  }

  setCellAlign() {
    const cellAlignShorthands = {
      center: { left: 0.5, right: 0.5 },
      left: { left: 0, right: 1 },
      right: { right: 0, left: 1 },
    };
    const shorthand = cellAlignShorthands[this.options.cellAlign];
    this.cellAlign = shorthand ? shorthand[this.originSide] : this.options.cellAlign;
  }

  setGallerySize() {
    if (!this.options.setGallerySize) return;
    const height =
      this.options.adaptiveHeight && this.selectedSlide
        ? this.selectedSlide.height
        : this.maxCellHeight;
    this.viewport.style.height = `${height}px`;
  }

  _getWrapShiftCells() {
    if (!this.options.wrapAround) return;
    this._unshiftCells(this.beforeShiftCells);
    this._unshiftCells(this.afterShiftCells);
    let gapX = this.cursorPosition;
    let cellIndex = this.cells.length - 1;
    this.beforeShiftCells = this._getGapCells(gapX, cellIndex, -1);
    gapX = this.size.innerWidth - this.cursorPosition;
    this.afterShiftCells = this._getGapCells(gapX, 0, 1);
  }

  _getGapCells(gapX, cellIndex, increment) {
    const cells = [];
    while (gapX > 0) {
      const cell = this.cells[cellIndex];
      if (!cell) break;
      cells.push(cell);
      cellIndex += increment;
      gapX -= cell.size.outerWidth;
    }
    return cells;
  }

  _containSlides() {
    if (!this.options.contain || this.options.wrapAround || !this.cells.length) return;
    const isRightToLeft = this.options.rightToLeft;
    const beginMargin = isRightToLeft ? 'marginRight' : 'marginLeft';
    const endMargin = isRightToLeft ? 'marginLeft' : 'marginRight';
    const contentWidth = this.slideableWidth - (this.getLastCell()?.size[endMargin] ?? 0);
    const isContentSmaller = contentWidth < this.size.innerWidth;
    const beginBound = this.cursorPosition + (this.cells[0]?.size[beginMargin] ?? 0);
    const endBound = contentWidth - this.size.innerWidth * (1 - this.cellAlign);
    this.slides.forEach((slide) => {
      if (isContentSmaller) {
        slide.target = contentWidth * this.cellAlign;
      } else {
        slide.target = Math.max(slide.target, beginBound);
        slide.target = Math.min(slide.target, endBound);
      }
    });
  }

  dispatchEvent(type, event, args) {
    const emitArgs = event ? [event].concat(args ?? []) : args;
    this.emitEvent(type, emitArgs);
    const jq = G.mepto ?? G.jQuery ?? G.$ ?? jQuery ?? $;
    if (jq?.bridget || jq?.fn) {
      // trigger via Mepto/jQuery if available
    }
    // use captured $/jQuery or global
    const activeJQ = (G.mepto ?? G.jQuery ?? G.$ ?? jQuery) ?? $;
    if (activeJQ?.bridget || activeJQ) {
      const triggerJQ = activeJQ;
      if (triggerJQ && this.$element?.trigger) {
        const nsType = `${type}${this.options.namespaceJQueryEvents ? '.flickity' : ''}`;
        let $event = nsType;
        if (event) {
          try {
            const E = triggerJQ.Event ?? $?.Event;
            if (E) {
              const jQEvent = new E(event);
              jQEvent.type = nsType;
              $event = jQEvent;
            }
          } catch (_) {}
        }
        try {
          this.$element.trigger($event, args);
        } catch (_) {}
      } else if (triggerJQ && this.element) {
        // no $element trigger — still try via global jQuery wrapper
        try {
          const maybe = triggerJQ(this.element);
          maybe?.trigger?.(`${type}${this.options.namespaceJQueryEvents ? '.flickity' : ''}`, args);
        } catch (_) {}
      }
    }
  }

  select(index, isWrap, isInstant) {
    if (!this.isActive) return;
    index = parseInt(index, 10);
    this._wrapSelect(index);
    if (this.options.wrapAround || isWrap) {
      index = utils.modulo(index, this.slides.length);
    }
    if (!this.slides[index]) return;
    const prevIndex = this.selectedIndex;
    this.selectedIndex = index;
    this.updateSelectedSlide();
    if (isInstant) this.positionSliderAtSelected();
    else this.startAnimation();
    if (this.options.adaptiveHeight) this.setGallerySize();
    this.dispatchEvent('select', null, [index]);
    if (index !== prevIndex) this.dispatchEvent('change', null, [index]);
    this.dispatchEvent('cellSelect');
  }

  _wrapSelect(index) {
    const len = this.slides.length;
    const isWrapping = this.options.wrapAround && len > 1;
    if (!isWrapping) return index;
    const wrapIndex = utils.modulo(index, len);
    const delta = Math.abs(wrapIndex - this.selectedIndex);
    const backWrapDelta = Math.abs(wrapIndex + len - this.selectedIndex);
    const forewardWrapDelta = Math.abs(wrapIndex - len - this.selectedIndex);
    if (!this.isDragSelect && backWrapDelta < delta) index += len;
    else if (!this.isDragSelect && forewardWrapDelta < delta) index -= len;
    if (index < 0) this.x -= this.slideableWidth;
    else if (index >= len) this.x += this.slideableWidth;
  }

  previous(isWrap, isInstant) {
    this.select(this.selectedIndex - 1, isWrap, isInstant);
  }

  next(isWrap, isInstant) {
    this.select(this.selectedIndex + 1, isWrap, isInstant);
  }

  updateSelectedSlide() {
    const slide = this.slides[this.selectedIndex];
    if (!slide) return;
    this.unselectSelectedSlide();
    this.selectedSlide = slide;
    slide.select();
    this.selectedCells = slide.cells;
    this.selectedElements = slide.getCellElements();
    this.selectedCell = slide.cells[0];
    this.selectedElement = this.selectedElements[0];
  }

  unselectSelectedSlide() {
    this.selectedSlide?.unselect();
  }

  selectInitialIndex() {
    const initialIndex = this.options.initialIndex;
    if (this.isInitActivated) {
      this.select(this.selectedIndex, false, true);
      return;
    }
    if (initialIndex && typeof initialIndex === 'string') {
      const cell = this.queryCell(initialIndex);
      if (cell) {
        this.selectCell(initialIndex, false, true);
        return;
      }
    }
    let index = 0;
    if (initialIndex && this.slides[initialIndex]) index = initialIndex;
    this.select(index, false, true);
  }

  selectCell(value, isWrap, isInstant) {
    const cell = this.queryCell(value);
    if (!cell) return;
    const index = this.getCellSlideIndex(cell);
    this.select(index, isWrap, isInstant);
  }

  getCellSlideIndex(cell) {
    for (let i = 0; i < this.slides.length; i++) {
      const index = this.slides[i].cells.indexOf(cell);
      if (index !== -1) return i;
    }
  }

  getCell(elem) {
    for (let i = 0; i < this.cells.length; i++) {
      if (this.cells[i].element === elem) return this.cells[i];
    }
  }

  getCells(elems) {
    elems = utils.makeArray(elems);
    const cells = [];
    elems.forEach((elem) => {
      const cell = this.getCell(elem);
      if (cell) cells.push(cell);
    });
    return cells;
  }

  getCellElements() {
    return this.cells.map((cell) => cell.element);
  }

  getParentCell(elem) {
    let cell = this.getCell(elem);
    if (cell) return cell;
    elem = utils.getParent(elem, '.flickity-slider > *');
    return this.getCell(elem);
  }

  getAdjacentCellElements(adjCount, index) {
    if (!adjCount) return this.selectedSlide.getCellElements();
    index = index ?? this.selectedIndex;
    const len = this.slides.length;
    if (1 + adjCount * 2 >= len) return this.getCellElements();
    let cellElems = [];
    for (let i = index - adjCount; i <= index + adjCount; i++) {
      const slideIndex = this.options.wrapAround ? utils.modulo(i, len) : i;
      const slide = this.slides[slideIndex];
      if (slide) cellElems = cellElems.concat(slide.getCellElements());
    }
    return cellElems;
  }

  queryCell(selector) {
    if (typeof selector === 'number') return this.cells[selector];
    if (typeof selector === 'string') {
      if (selector.match(/^[#.]?[\d/]/)) return;
      selector = this.element.querySelector(selector);
    }
    return this.getCell(selector);
  }

  uiChange() {
    this.emitEvent('uiChange');
  }

  childUIPointerDown(event) {
    if (event.type !== 'touchstart') event.preventDefault();
    this.focus();
  }

  onresize() {
    this.watchCSS();
    this.resize();
  }

  resize() {
    if (!this.isActive || this.isAnimating || this.isDragging) return;
    this.getSize();
    if (this.options.wrapAround) this.x = utils.modulo(this.x, this.slideableWidth);
    this.positionCells();
    this._getWrapShiftCells();
    this.setGallerySize();
    this.emitEvent('resize');
    const selectedElement = this.selectedElements?.[0];
    this.selectCell(selectedElement, false, true);
  }

  watchCSS() {
    if (!this.options.watchCSS) return;
    const afterContent = getComputedStyle(this.element, ':after').content;
    if (afterContent?.indexOf('flickity') !== -1) this.activate();
    else this.deactivate();
  }

  onkeydown(event) {
    const isNotFocused = document.activeElement && document.activeElement !== this.element;
    if (!this.options.accessibility || isNotFocused) return;
    const handler = Flickity.keyboardHandlers[event.keyCode];
    handler?.call(this);
  }

  focus() {
    const prevScrollY = G.pageYOffset;
    this.element.focus({ preventScroll: true });
    if (G.pageYOffset !== prevScrollY) G.scrollTo(G.pageXOffset, prevScrollY);
  }

  deactivate() {
    if (!this.isActive) return;
    this.element.classList.remove('flickity-enabled', 'flickity-rtl');
    this.unselectSelectedSlide();
    this.cells.forEach((cell) => cell.destroy());
    this.element.removeChild(this.viewport);
    moveElements(this.slider.children, this.element);
    if (this.options.accessibility) {
      this.element.removeAttribute('tabIndex');
      this.element.removeEventListener('keydown', this);
    }
    this.isActive = false;
    this.emitEvent('deactivate');
  }

  destroy() {
    this.deactivate();
    G.removeEventListener('resize', this);
    this.allOff();
    this.emitEvent('destroy');
    try {
      const jq = G.mepto ?? G.jQuery ?? G.$ ?? jQuery;
      if (jq?.removeData) jq.removeData(this.element, 'flickity');
    } catch (_) {}
    delete this.element.flickityGUID;
    delete instances[this.guid];
  }

  handleEvent = utils.handleEvent;

  // bridget fallback installed here via import side-effect, kept for compat
}

// Apply animatePrototype methods
Object.assign(Flickity.prototype, animatePrototype);

// debounce resize
utils.debounceMethod(Flickity, 'onresize', 150);

// htmlInit
utils.htmlInit(Flickity, 'flickity');

// expose Cell/Slide
Flickity.Cell = Cell;
Flickity.Slide = Slide;

Flickity.setMepto = Flickity.setJQuery;

// alias for reposition/init
Flickity.prototype._init = Flickity.prototype.reposition;
