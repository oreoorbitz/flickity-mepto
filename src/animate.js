import utils from 'fizzy-ui-utils';

export const animatePrototype = {
  startAnimation() {
    if (this.isAnimating) return;
    this.isAnimating = true;
    this.restingFrames = 0;
    this.animate();
  },

  animate() {
    this.applyDragForce();
    this.applySelectedAttraction();

    const previousX = this.x;

    this.integratePhysics();
    this.positionSlider();
    this.settle(previousX);

    if (this.isAnimating) {
      requestAnimationFrame(() => this.animate());
    }
  },

  positionSlider() {
    let x = this.x;
    if (this.options.wrapAround && this.cells.length > 1) {
      x = utils.modulo(x, this.slideableWidth);
      x -= this.slideableWidth;
      this.shiftWrapCells(x);
    }
    this.setTranslateX(x, this.isAnimating);
    this.dispatchScrollEvent();
  },

  setTranslateX(x, is3d) {
    x += this.cursorPosition;
    x = this.options.rightToLeft ? -x : x;
    const translateX = this.getPositionValue(x);
    this.slider.style.transform = is3d
      ? `translate3d(${translateX},0,0)`
      : `translateX(${translateX})`;
  },

  dispatchScrollEvent() {
    const firstSlide = this.slides[0];
    if (!firstSlide) return;
    const positionX = -this.x - firstSlide.target;
    const progress = positionX / this.slidesWidth;
    this.dispatchEvent('scroll', null, [progress, positionX]);
  },

  positionSliderAtSelected() {
    if (!this.cells.length) return;
    this.x = -this.selectedSlide.target;
    this.velocity = 0;
    this.positionSlider();
  },

  getPositionValue(position) {
    if (this.options.percentPosition) {
      return `${Math.round((position / this.size.innerWidth) * 10000) * 0.01}%`;
    }
    return `${Math.round(position)}px`;
  },

  settle(previousX) {
    const isResting =
      !this.isPointerDown && Math.round(this.x * 100) === Math.round(previousX * 100);
    if (isResting) this.restingFrames++;
    if (this.restingFrames > 2) {
      this.isAnimating = false;
      delete this.isFreeScrolling;
      this.positionSlider();
      this.dispatchEvent('settle', null, [this.selectedIndex]);
    }
  },

  shiftWrapCells(x) {
    const beforeGap = this.cursorPosition + x;
    this._shiftCells(this.beforeShiftCells, beforeGap, -1);
    const afterGap = this.size.innerWidth - (x + this.slideableWidth + this.cursorPosition);
    this._shiftCells(this.afterShiftCells, afterGap, 1);
  },

  _shiftCells(cells, gap, shift) {
    for (let i = 0; i < (cells?.length ?? 0); i++) {
      const cell = cells[i];
      const cellShift = gap > 0 ? shift : 0;
      cell.wrapShift(cellShift);
      gap -= cell.size.outerWidth;
    }
  },

  _unshiftCells(cells) {
    if (!cells?.length) return;
    for (let i = 0; i < cells.length; i++) {
      cells[i].wrapShift(0);
    }
  },

  // physics
  integratePhysics() {
    this.x += this.velocity;
    this.velocity *= this.getFrictionFactor();
  },

  applyForce(force) {
    this.velocity += force;
  },

  getFrictionFactor() {
    return 1 - this.options[this.isFreeScrolling ? 'freeScrollFriction' : 'friction'];
  },

  getRestingPosition() {
    return this.x + this.velocity / (1 - this.getFrictionFactor());
  },

  applyDragForce() {
    if (!this.isDraggable || !this.isPointerDown) return;
    const dragVelocity = this.dragX - this.x;
    const dragForce = dragVelocity - this.velocity;
    this.applyForce(dragForce);
  },

  applySelectedAttraction() {
    const dragDown = this.isDraggable && this.isPointerDown;
    if (dragDown || this.isFreeScrolling || !this.slides.length) return;
    const distance = this.selectedSlide.target * -1 - this.x;
    const force = distance * this.options.selectedAttraction;
    this.applyForce(force);
  },
};

export default animatePrototype;
