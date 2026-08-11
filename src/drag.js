import Flickity from './flickity.js';
import Unidragger from 'unidragger';
import utils from 'fizzy-ui-utils';
import { mutate } from './scheduler.js';

const G = globalThis;

utils.extend(Flickity.defaults, {
  draggable: '>1',
  dragThreshold: 3,
});

Flickity.createMethods.push('_createDrag');

const proto = Flickity.prototype;
utils.extend(proto, Unidragger.prototype);
proto._touchActionValue = 'pan-y';

proto._createDrag = function () {
  this.on('activate', this.onActivateDrag);
  this.on('uiChange', this._uiChangeDrag);
  this.on('deactivate', this.onDeactivateDrag);
  this.on('cellChange', this.updateDraggable);
};

proto.onActivateDrag = function () {
  this.handles = [this.viewport];
  this.bindHandles();
  this.updateDraggable();
};

proto.onDeactivateDrag = function () {
  this.unbindHandles();
  this.element.classList.remove('is-draggable');
};

proto.updateDraggable = function () {
  if (this.options.draggable === '>1') {
    this.isDraggable = this.slides.length > 1;
  } else {
    this.isDraggable = this.options.draggable;
  }
  this.element.classList.toggle('is-draggable', !!this.isDraggable);
};

proto.bindDrag = function () {
  this.options.draggable = true;
  this.updateDraggable();
};

proto.unbindDrag = function () {
  this.options.draggable = false;
  this.updateDraggable();
};

proto._uiChangeDrag = function () {
  this.isFreeScrolling = undefined;
};

proto.pointerDown = function (event, pointer) {
  if (!this.isDraggable) {
    this._pointerDownDefault(event, pointer);
    return;
  }
  if (!this.okayPointerDown(event)) return;
  this._pointerDownPreventDefault(event);
  this.pointerDownFocus(event);
  if (document.activeElement !== this.element) this.pointerDownBlur();
  this.dragX = this.x;
  this.viewport.classList.add('is-pointer-down');
  this.pointerDownScroll = getScrollPosition();
  G.addEventListener('scroll', this, { passive: true });
  this._pointerDownDefault(event, pointer);
};

proto._pointerDownDefault = function (event, pointer) {
  this.pointerDownPointer = { pageX: pointer.pageX, pageY: pointer.pageY };
  this._bindPostStartEvents(event);
  this.dispatchEvent('pointerDown', event, [pointer]);
};

const focusNodes = { INPUT: true, TEXTAREA: true, SELECT: true };

proto.pointerDownFocus = function (event) {
  const isFocusNode = focusNodes[event.target.nodeName];
  if (!isFocusNode) this.focus();
};

proto._pointerDownPreventDefault = function (event) {
  const isTouchStart = event.type === 'touchstart';
  const isTouchPointer = event.pointerType === 'touch';
  const isFocusNode = focusNodes[event.target.nodeName];
  if (!isTouchStart && !isTouchPointer && !isFocusNode) event.preventDefault();
};

proto.hasDragStarted = function (moveVector) {
  return Math.abs(moveVector.x) > this.options.dragThreshold;
};

proto.pointerUp = function (event, pointer) {
  this.isTouchScrolling = undefined;
  this.viewport.classList.remove('is-pointer-down');
  this.dispatchEvent('pointerUp', event, [pointer]);
  this._dragPointerUp(event, pointer);
};

proto.pointerDone = function () {
  G.removeEventListener('scroll', this);
  this.pointerDownScroll = undefined;
};

proto.dragStart = function (event, pointer) {
  if (!this.isDraggable) return;
  this.dragStartPosition = this.x;
  this.startAnimation();
  G.removeEventListener('scroll', this);
  this.dispatchEvent('dragStart', event, [pointer]);
};

proto.pointerMove = function (event, pointer) {
  const moveVector = this._dragPointerMove(event, pointer);
  this.dispatchEvent('pointerMove', event, [pointer, moveVector]);
  // coalesce multiple pointerMoves per frame — one mutate per rAF (Part I §4)
  this._pendingDrag = { event, pointer, moveVector };
  if (!this._dragRaf) {
    this._dragRaf = 1;
    const self = this;
    mutate(() => {
      self._dragRaf = 0;
      const p = self._pendingDrag;
      self._pendingDrag = null;
      if (p) self._dragMove(p.event, p.pointer, p.moveVector);
    });
  }
};

proto.dragMove = function (event, pointer, moveVector) {
  if (!this.isDraggable) return;
  // preventDefault must stay sync for touch — do here, state update in mutate already coalesced
  event.preventDefault();
  this.previousDragX = this.dragX;
  const direction = this.options.rightToLeft ? -1 : 1;
  if (this.options.wrapAround) moveVector.x %= this.slideableWidth;
  let dragX = this.dragStartPosition + moveVector.x * direction;
  if (!this.options.wrapAround && this.slides.length) {
    const originBound = Math.max(-this.slides[0].target, this.dragStartPosition);
    dragX = dragX > originBound ? (dragX + originBound) * 0.5 : dragX;
    const endBound = Math.min(-this.getLastSlide().target, this.dragStartPosition);
    dragX = dragX < endBound ? (dragX + endBound) * 0.5 : dragX;
  }
  this.dragX = dragX;
  this.dragMoveTime = Date.now();
  this.dispatchEvent('dragMove', event, [pointer, moveVector]);
};

proto.dragEnd = function (event, pointer) {
  if (!this.isDraggable) return;
  if (this.options.freeScroll) this.isFreeScrolling = true;
  let index = this.dragEndRestingSelect();
  if (this.options.freeScroll && !this.options.wrapAround) {
    const restingX = this.getRestingPosition();
    this.isFreeScrolling = -restingX > this.slides[0].target && -restingX < this.getLastSlide().target;
  } else if (!this.options.freeScroll && index === this.selectedIndex) {
    index += this.dragEndBoostSelect();
  }
  delete this.previousDragX;
  this.isDragSelect = this.options.wrapAround;
  this.select(index);
  delete this.isDragSelect;
  this.dispatchEvent('dragEnd', event, [pointer]);
};

proto.dragEndRestingSelect = function () {
  const restingX = this.getRestingPosition();
  const distance = Math.abs(this.getSlideDistance(-restingX, this.selectedIndex));
  const positiveResting = this._getClosestResting(restingX, distance, 1);
  const negativeResting = this._getClosestResting(restingX, distance, -1);
  return positiveResting.distance < negativeResting.distance
    ? positiveResting.index
    : negativeResting.index;
};

proto._getClosestResting = function (restingX, distance, increment) {
  let index = this.selectedIndex;
  let minDistance = Infinity;
  const condition =
    this.options.contain && !this.options.wrapAround
      ? (dist, minDist) => dist <= minDist
      : (dist, minDist) => dist < minDist;
  while (condition(distance, minDistance)) {
    index += increment;
    minDistance = distance;
    distance = this.getSlideDistance(-restingX, index);
    if (distance === null) break;
    distance = Math.abs(distance);
  }
  return { distance: minDistance, index: index - increment };
};

proto.getSlideDistance = function (x, index) {
  const len = this.slides.length;
  const isWrapAround = this.options.wrapAround && len > 1;
  const slideIndex = isWrapAround ? utils.modulo(index, len) : index;
  const slide = this.slides[slideIndex];
  if (!slide) return null;
  const wrap = isWrapAround ? this.slideableWidth * Math.floor(index / len) : 0;
  return x - (slide.target + wrap);
};

proto.dragEndBoostSelect = function () {
  if (
    this.previousDragX === undefined ||
    !this.dragMoveTime ||
    new Date() - this.dragMoveTime > 100
  ) {
    return 0;
  }
  const distance = this.getSlideDistance(-this.dragX, this.selectedIndex);
  const delta = this.previousDragX - this.dragX;
  if (distance > 0 && delta > 0) return 1;
  if (distance < 0 && delta < 0) return -1;
  return 0;
};

proto.staticClick = function (event, pointer) {
  const clickedCell = this.getParentCell(event.target);
  const cellElem = clickedCell?.element;
  const cellIndex = clickedCell ? this.cells.indexOf(clickedCell) : undefined;
  this.dispatchEvent('staticClick', event, [pointer, cellElem, cellIndex]);
};

proto.onscroll = function () {
  const scroll = getScrollPosition();
  const scrollMoveX = this.pointerDownScroll.x - scroll.x;
  const scrollMoveY = this.pointerDownScroll.y - scroll.y;
  if (Math.abs(scrollMoveX) > 3 || Math.abs(scrollMoveY) > 3) this._pointerDone();
};

const getScrollPosition = () => ({
  x: G.pageXOffset,
  y: G.pageYOffset,
});

export default Flickity;
