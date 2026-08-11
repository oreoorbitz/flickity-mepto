import Flickity from './flickity.js';
import Unipointer from 'unipointer';
import utils from 'fizzy-ui-utils';

const svgURI = 'http://www.w3.org/2000/svg';

class PrevNextButton extends Unipointer {
  constructor(direction, parent) {
    super();
    this.direction = direction;
    this.parent = parent;
    this._create();
  }

  _create() {
    this.isEnabled = true;
    this.isPrevious = this.direction === -1;
    const leftDirection = this.parent.options.rightToLeft ? 1 : -1;
    this.isLeft = this.direction === leftDirection;

    const element = (this.element = document.createElement('button'));
    element.className = `flickity-button flickity-prev-next-button${this.isPrevious ? ' previous' : ' next'}`;
    element.setAttribute('type', 'button');
    this.disable();
    element.setAttribute('aria-label', this.isPrevious ? 'Previous' : 'Next');

    const svg = this.createSVG();
    element.appendChild(svg);
    this.parent.on('select', this.update.bind(this));
    this.on('pointerDown', this.parent.childUIPointerDown.bind(this.parent));
  }

  activate() {
    this.bindStartEvent(this.element);
    this.element.addEventListener('click', this);
    this.parent.element.appendChild(this.element);
  }

  deactivate() {
    this.parent.element.removeChild(this.element);
    this.unbindStartEvent(this.element);
    this.element.removeEventListener('click', this);
  }

  createSVG() {
    const svg = document.createElementNS(svgURI, 'svg');
    svg.setAttribute('class', 'flickity-button-icon');
    svg.setAttribute('viewBox', '0 0 100 100');
    const path = document.createElementNS(svgURI, 'path');
    const pathMovements = getArrowMovements(this.parent.options.arrowShape);
    path.setAttribute('d', pathMovements);
    path.setAttribute('class', 'arrow');
    if (!this.isLeft) path.setAttribute('transform', 'translate(100, 100) rotate(180) ');
    svg.appendChild(path);
    return svg;
  }

  handleEvent = utils.handleEvent;

  onclick() {
    if (!this.isEnabled) return;
    this.parent.uiChange();
    const method = this.isPrevious ? 'previous' : 'next';
    this.parent[method]();
  }

  enable() {
    if (this.isEnabled) return;
    this.element.disabled = false;
    this.isEnabled = true;
  }

  disable() {
    if (!this.isEnabled) return;
    this.element.disabled = true;
    this.isEnabled = false;
  }

  update() {
    const slides = this.parent.slides;
    if (this.parent.options.wrapAround && slides.length > 1) {
      this.enable();
      return;
    }
    const lastIndex = slides.length ? slides.length - 1 : 0;
    const boundIndex = this.isPrevious ? 0 : lastIndex;
    const method = this.parent.selectedIndex === boundIndex ? 'disable' : 'enable';
    this[method]();
  }

  destroy() {
    this.deactivate();
    this.allOff();
  }
}

const getArrowMovements = (shape) => {
  if (typeof shape === 'string') return shape;
  return `M ${shape.x0},50 L ${shape.x1},${shape.y1 + 50} L ${shape.x2},${shape.y2 + 50} L ${shape.x3},50  L ${shape.x2},${50 - shape.y2} L ${shape.x1},${50 - shape.y1}  Z`;
};

utils.extend(Flickity.defaults, {
  prevNextButtons: true,
  arrowShape: { x0: 10, x1: 60, y1: 50, x2: 70, y2: 40, x3: 30 },
});

Flickity.createMethods.push('_createPrevNextButtons');
const proto = Flickity.prototype;

proto._createPrevNextButtons = function () {
  if (!this.options.prevNextButtons) return;
  this.prevButton = new PrevNextButton(-1, this);
  this.nextButton = new PrevNextButton(1, this);
  this.on('activate', this.activatePrevNextButtons);
};

proto.activatePrevNextButtons = function () {
  this.prevButton.activate();
  this.nextButton.activate();
  this.on('deactivate', this.deactivatePrevNextButtons);
};

proto.deactivatePrevNextButtons = function () {
  this.prevButton.deactivate();
  this.nextButton.deactivate();
  this.off('deactivate', this.deactivatePrevNextButtons);
};

Flickity.PrevNextButton = PrevNextButton;

export default Flickity;
