// scheduler.js — tiny FastDOM-style measure/mutate batcher
// Part I §3/§4: separate DOM reads (measure) from writes (mutate), flush in single rAF.
// Coalesces multiple hot calls per frame (pointerMove) to one layout.

const qMeasure = [];
const qMutate = [];
let rafId = 0;

const flush = () => {
  rafId = 0;
  // measure first — all reads before writes avoids forced sync layout
  let fn;
  while ((fn = qMeasure.shift())) {
    try {
      fn();
    } catch (_) {}
  }
  while ((fn = qMutate.shift())) {
    try {
      fn();
    } catch (_) {}
  }
};

const schedule = () => {
  if (!rafId) rafId = requestAnimationFrame(flush);
};

export const measure = (fn) => {
  qMeasure.push(fn);
  schedule();
};

export const mutate = (fn) => {
  qMutate.push(fn);
  schedule();
};

// test helper — flush synchronously
export const flushSync = () => {
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = 0;
  }
  flush();
};

export const clear = () => {
  qMeasure.length = 0;
  qMutate.length = 0;
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = 0;
  }
};
