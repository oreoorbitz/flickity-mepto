/*!
 * Flickity v2.3.0
 * Touch, responsive, flickable carousels
 * Licensed GPLv3 for open source use or Flickity Commercial License for commercial use
 * https://flickity.metafizzy.co
 * Copyright 2015-2021 Metafizzy
 */
import Flickity from './flickity.js';
import './drag.js';
import './prev-next-button.js';
import './page-dots.js';
import './player.js';
import './add-remove-cell.js';
import './lazyload.js';
import './mepto-bridget.js';

import { animatePrototype } from './animate.js';
import Cell from './cell.js';
import Slide from './slide.js';

// re-apply bridget if Mepto/jQuery became available after plugin imports
const G = globalThis;
const jq = G.mepto ?? G.jQuery ?? G.$;
if (jq?.bridget) jq.bridget('flickity', Flickity);
else if (jq?.fn && !jq.fn.flickity) {
  try {
    jq.fn.flickity = function (o, ...args) {
      if (typeof o === 'string') {
        for (let k = 0; k < this.length; k++) {
          const inst = Flickity.data(this[k]);
          if (!inst) {
            G.console?.error(`flickity not initialized. Cannot call ${o}`);
            continue;
          }
          const meth = inst[o];
          if (!meth || o.charAt(0) === '_') {
            G.console?.error(`flickity has no method ${o}`);
            continue;
          }
          const ret = meth.apply(inst, args);
          if (ret !== undefined && ret !== inst) return ret;
        }
        return this;
      }
      return this.each(function () {
        const i = Flickity.data(this);
        if (i) i.option(o ?? {});
        else new Flickity(this, o);
      });
    };
  } catch (_) {}
}

Flickity.Cell = Cell;
Flickity.Slide = Slide;
Flickity.animatePrototype = animatePrototype;

export default Flickity;
