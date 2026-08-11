import getSize from 'get-size';

export default class Cell {
  constructor(elem, parent) {
    this.element = elem;
    this.parent = parent;
    this.create();
  }

  create() {
    this.element.style.position = 'absolute';
    this.element.setAttribute('aria-hidden', 'true');
    this.x = 0;
    this.shift = 0;
    this.element.style[this.parent.originSide] = 0;
  }

  destroy() {
    this.unselect();
    this.element.style.position = '';
    const side = this.parent.originSide;
    this.element.style[side] = '';
    this.element.style.transform = '';
    this.element.removeAttribute('aria-hidden');
  }

  getSize() {
    this.size = getSize(this.element);
  }

  setPosition(x) {
    this.x = x;
    this.updateTarget();
    this.renderPosition(x);
  }

  updateTarget() {
    const marginProperty = this.parent.originSide === 'left' ? 'marginLeft' : 'marginRight';
    this.target = this.x + (this.size?.[marginProperty] ?? 0) + this.size.width * this.parent.cellAlign;
  }

  setDefaultTarget() {
    return this.updateTarget();
  }

  renderPosition(x) {
    const sideOffset = this.parent.originSide === 'left' ? 1 : -1;
    const adjustedX = this.parent.options.percentPosition
      ? x * sideOffset * (this.parent.size.innerWidth / this.size.width)
      : x * sideOffset;
    this.element.style.transform = `translateX(${this.parent.getPositionValue(adjustedX)})`;
  }

  select() {
    this.element.classList.add('is-selected');
    this.element.removeAttribute('aria-hidden');
  }

  unselect() {
    this.element.classList.remove('is-selected');
    this.element.setAttribute('aria-hidden', 'true');
  }

  /**
   * @param {number} shift - 0, 1, or -1
   */
  wrapShift(shift) {
    this.shift = shift;
    this.renderPosition(this.x + this.parent.slideableWidth * shift);
  }

  remove() {
    this.element.parentNode?.removeChild(this.element);
  }
}
