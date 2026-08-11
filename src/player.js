import EvEmitter from 'ev-emitter';
import utils from 'fizzy-ui-utils';
import Flickity from './flickity.js';

class Player extends EvEmitter {
  constructor(parent) {
    super();
    this.parent = parent;
    this.state = 'stopped';
    this.onVisibilityChange = this.visibilityChange.bind(this);
    this.onVisibilityPlay = this.visibilityPlay.bind(this);
  }

  play() {
    if (this.state === 'playing') return;
    if (document.hidden) {
      document.addEventListener('visibilitychange', this.onVisibilityPlay);
      return;
    }
    this.state = 'playing';
    document.addEventListener('visibilitychange', this.onVisibilityChange);
    this.tick();
  }

  tick() {
    if (this.state !== 'playing') return;
    let time = this.parent.options.autoPlay;
    time = typeof time === 'number' ? time : 3000;
    this.clear();
    this.timeout = setTimeout(() => {
      this.parent.next(true);
      this.tick();
    }, time);
  }

  stop() {
    this.state = 'stopped';
    this.clear();
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
  }

  clear() {
    clearTimeout(this.timeout);
  }

  pause() {
    if (this.state === 'playing') {
      this.state = 'paused';
      this.clear();
    }
  }

  unpause() {
    if (this.state === 'paused') this.play();
  }

  visibilityChange() {
    const isPageHidden = document.hidden;
    this[isPageHidden ? 'pause' : 'unpause']();
  }

  visibilityPlay() {
    this.play();
    document.removeEventListener('visibilitychange', this.onVisibilityPlay);
  }
}

utils.extend(Flickity.defaults, { pauseAutoPlayOnHover: true });
Flickity.createMethods.push('_createPlayer');

const proto = Flickity.prototype;

proto._createPlayer = function () {
  this.player = new Player(this);
  this.on('activate', this.activatePlayer);
  this.on('uiChange', this.stopPlayer);
  this.on('pointerDown', this.stopPlayer);
  this.on('deactivate', this.deactivatePlayer);
};

proto.activatePlayer = function () {
  if (!this.options.autoPlay) return;
  this.player.play();
  this.element.addEventListener('mouseenter', this);
};

proto.playPlayer = function () {
  this.player.play();
};

proto.stopPlayer = function () {
  this.player.stop();
};

proto.pausePlayer = function () {
  this.player.pause();
};

proto.unpausePlayer = function () {
  this.player.unpause();
};

proto.deactivatePlayer = function () {
  this.player.stop();
  this.element.removeEventListener('mouseenter', this);
};

proto.onmouseenter = function () {
  if (!this.options.pauseAutoPlayOnHover) return;
  this.player.pause();
  this.element.addEventListener('mouseleave', this);
};

proto.onmouseleave = function () {
  this.player.unpause();
  this.element.removeEventListener('mouseleave', this);
};

Flickity.Player = Player;

export default Flickity;
