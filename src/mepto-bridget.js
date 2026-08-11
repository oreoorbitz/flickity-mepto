// mepto-bridget.js — minimal jQuery Bridget for Mepto (ESM, globalThis)
const G = globalThis;
const $ = G.mepto ?? G.jQuery ?? G.$ ?? null;

if ($ && !$.bridget) {
  $.bridget = (namespace, PluginClass) => {
    $.fn[namespace] = function (option, ...args) {
      if (typeof option === 'string') {
        for (let i = 0; i < this.length; i++) {
          const elem = this[i];
          const instance = PluginClass.data(elem);
          if (!instance) {
            G.console?.error(`${namespace} not initialized. Cannot call method ${option}`);
            continue;
          }
          const method = instance[option];
          if (!method || option.charAt(0) === '_') {
            G.console?.error(`${namespace} has no method ${option}`);
            continue;
          }
          const ret = method.apply(instance, args);
          if (ret !== undefined && ret !== instance) return ret;
        }
        return this;
      }
      return this.each(function () {
        const instance = PluginClass.data(this);
        if (instance) instance.option(option ?? {});
        else new PluginClass(this, option);
      });
    };
  };
}

export default $?.bridget ?? null;
export { $ };
