import Flickity from './flickity.js';
import utils from 'fizzy-ui-utils';

const getCellsFragment = (cells) => {
  const fragment = document.createDocumentFragment();
  cells.forEach((cell) => fragment.appendChild(cell.element));
  return fragment;
};

const proto = Flickity.prototype;

proto.insert = function (elems, index) {
  const cells = this._makeCells(elems);
  if (!cells?.length) return;
  const len = this.cells.length;
  index = index ?? len;
  const fragment = getCellsFragment(cells);
  const isAppend = index === len;
  if (isAppend) this.slider.appendChild(fragment);
  else {
    const insertCellElement = this.cells[index].element;
    this.slider.insertBefore(fragment, insertCellElement);
  }
  if (index === 0) this.cells = cells.concat(this.cells);
  else if (isAppend) this.cells = this.cells.concat(cells);
  else {
    const endCells = this.cells.splice(index, len - index);
    this.cells = this.cells.concat(cells).concat(endCells);
  }
  this._sizeCells(cells);
  this.cellChange(index, true);
};

proto.append = function (elems) {
  this.insert(elems, this.cells.length);
};

proto.prepend = function (elems) {
  this.insert(elems, 0);
};

proto.remove = function (elems) {
  const cells = this.getCells(elems);
  if (!cells?.length) return;
  let minCellIndex = this.cells.length - 1;
  cells.forEach((cell) => {
    cell.remove();
    const index = this.cells.indexOf(cell);
    minCellIndex = Math.min(index, minCellIndex);
    utils.removeFrom(this.cells, cell);
  }, this);
  this.cellChange(minCellIndex, true);
};

proto.cellSizeChange = function (elem) {
  const cell = this.getCell(elem);
  if (!cell) return;
  cell.getSize();
  const index = this.cells.indexOf(cell);
  this.cellChange(index);
};

proto.cellChange = function (changedCellIndex, isPositioningSlider) {
  const prevSelectedElem = this.selectedElement;
  this._positionCells(changedCellIndex);
  this._getWrapShiftCells();
  this.setGallerySize();
  const cell = this.getCell(prevSelectedElem);
  if (cell) this.selectedIndex = this.getCellSlideIndex(cell);
  this.selectedIndex = Math.min(this.slides.length - 1, this.selectedIndex);
  this.emitEvent('cellChange', [changedCellIndex]);
  this.select(this.selectedIndex);
  if (isPositioningSlider) this.positionSliderAtSelected();
};

export default Flickity;
