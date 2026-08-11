import Flickity from './flickity.js';
import Unipointer from 'unipointer';
import utils from 'fizzy-ui-utils';

class PageDots extends Unipointer {
  constructor(parent) {
    super();
    this.parent = parent;
    this._create();
  }

  _create() {
    this.holder = document.createElement('ol');
    this.holder.className = 'flickity-page-dots';
    this.dots = [];
    this.handleClick = this.onClick.bind(this);
    this.on('pointerDown', this.parent.childUIPointerDown.bind(this.parent));
  }

  activate() {
    this.setDots();
    this.holder.addEventListener('click', this.handleClick);
    this.bindStartEvent(this.holder);
    this.parent.element.appendChild(this.holder);
  }

  deactivate() {
    this.holder.removeEventListener('click', this.handleClick);
    this.unbindStartEvent(this.holder);
    this.parent.element.removeChild(this.holder);
  }

  setDots() {
    const delta = this.parent.slides.length - this.dots.length;
    if (delta > 0) this.addDots(delta);
    else if (delta < 0) this.removeDots(-delta);
  }

  addDots(count) {
    const fragment = document.createDocumentFragment();
    const newDots = [];
    const length = this.dots.length;
    const max = length + count;
    for (let i = length; i < max; i++) {
      const dot = document.createElement('li');
      dot.className = 'dot';
      dot.setAttribute('aria-label', `Page dot ${i + 1}`);
      fragment.appendChild(dot);
      newDots.push(dot);
    }
    this.holder.appendChild(fragment);
    this.dots = this.dots.concat(newDots);
  }

  removeDots(count) {
    const removeDots = this.dots.splice(this.dots.length - count, count);
    removeDots.forEach((dot) => this.holder.removeChild(dot));
  }

  updateSelected() {
    if (this.selectedDot) {
      this.selectedDot.className = 'dot';
      this.selectedDot.removeAttribute('aria-current');
    }
    if (!this.dots.length) return;
    this.selectedDot = this.dots[this.parent.selectedIndex];
    this.selectedDot.className = 'dot is-selected';
    this.selectedDot.setAttribute('aria-current', 'step');
  }

  onClick(event) {
    if (event.target.nodeName !== 'LI') return;
    this.parent.uiChange();
    const index = this.dots.indexOf(event.target);
    this.parent.select(index);
  }

  onTap = this.onClick;

  destroy() {
    this.deactivate();
    this.allOff();
  }
}

Flickity.PageDots = PageDots;

utils.extend(Flickity.defaults, { pageDots: true });
Flickity.createMethods.push('_createPageDots');

const proto = Flickity.prototype;

proto._createPageDots = function () {
  if (!this.options.pageDots) return;
  this.pageDots = new PageDots(this);
  this.on('activate', this.activatePageDots);
  this.on('select', this.updateSelectedPageDots);
  this.on('cellChange', this.updatePageDots);
  this.on('resize', this.updatePageDots);
  this.on('deactivate', this.deactivatePageDots);
};

proto.activatePageDots = function () {
  this.pageDots.activate();
};

proto.updateSelectedPageDots = function () {
  this.pageDots.updateSelected();
};

proto.updatePageDots = function () {
  this.pageDots.setDots();
};

proto.deactivatePageDots = function () {
  this.pageDots.deactivate();
};

export default Flickity;
