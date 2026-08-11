export default class Slide {
  constructor(parent) {
    // shape-stable order (Part II Rule 1) — x/firstMargin/target initialized here
    this.parent = parent;
    this.isOriginLeft = parent.originSide === 'left';
    this.cells = [];
    this.outerWidth = 0;
    this.height = 0;
    this.x = 0;
    this.firstMargin = 0;
    this.target = 0;
  }

  addCell(cell) {
    this.cells.push(cell);
    this.outerWidth += cell.size.outerWidth;
    this.height = Math.max(cell.size.outerHeight, this.height);
    if (this.cells.length === 1) {
      this.x = cell.x;
      const beginMargin = this.isOriginLeft ? 'marginLeft' : 'marginRight';
      this.firstMargin = cell.size[beginMargin];
    }
  }

  updateTarget() {
    const endMargin = this.isOriginLeft ? 'marginRight' : 'marginLeft';
    const lastCell = this.getLastCell();
    const lastMargin = lastCell?.size[endMargin] ?? 0;
    const slideWidth = this.outerWidth - (this.firstMargin + lastMargin);
    this.target = this.x + this.firstMargin + slideWidth * this.parent.cellAlign;
  }

  getLastCell() {
    return this.cells[this.cells.length - 1];
  }

  select() {
    for (let i = 0; i < this.cells.length; i++) this.cells[i].select();
  }

  unselect() {
    for (let i = 0; i < this.cells.length; i++) this.cells[i].unselect();
  }

  getCellElements() {
    return this.cells.map((cell) => cell.element);
  }
}
