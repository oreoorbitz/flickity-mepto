(() => {
  // ../Mepto/src/mepto.ts
  var mepto = (function() {
    let $ = {};
    const emptyArray = [];
    const filter = Array.prototype.filter;
    const slice = Array.prototype.slice;
    const arrayReduce = Array.prototype.reduce;
    const document = window.document;
    const elementDisplay = /* @__PURE__ */ new Map();
    const cssNumber = {
      "column-count": 1,
      columns: 1,
      "font-weight": 1,
      "line-height": 1,
      opacity: 1,
      "z-index": 1,
      zoom: 1
    };
    const fragmentRE = /^\s*<(\w+|!)[^>]*>/;
    const singleTagRE = /^<(\w+)\s*\/?>(?:<\/\1>|)$/;
    const tagExpanderRE = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/gi;
    const rootNodeRE = /^(?:body|html)$/i;
    const capitalRE = /([A-Z])/g;
    const doubleColonRE = /::/g;
    const upperUpperLowerRE = /([A-Z]+)([A-Z][a-z])/g;
    const lowerDigitUpperRE = /([a-z\d])([A-Z])/g;
    const underscoreRE = /_/g;
    const methodAttributes = ["val", "css", "html", "text", "data", "width", "height", "offset"];
    const methodAttributesSet = new Set(methodAttributes);
    const adjacencyOperators = ["after", "prepend", "before", "append"];
    const table = document.createElement("table");
    const tableRow = document.createElement("tr");
    const containers = {
      tr: document.createElement("tbody"),
      tbody: table,
      thead: table,
      tfoot: table,
      td: tableRow,
      th: tableRow,
      "*": document.createElement("div")
    };
    const simpleSelectorRE = /^[\w-]*$/;
    const toString = Object.prototype.toString;
    const mepto2 = {};
    const propMap = {
      tabindex: "tabIndex",
      readonly: "readOnly",
      for: "htmlFor",
      class: "className",
      maxlength: "maxLength",
      cellspacing: "cellSpacing",
      cellpadding: "cellPadding",
      rowspan: "rowSpan",
      colspan: "colSpan",
      usemap: "useMap",
      frameborder: "frameBorder",
      contenteditable: "contentEditable"
    };
    const isArray = Array.isArray;
    mepto2.matches = function(element, selector) {
      if (!selector || !element || element.nodeType !== 1) return false;
      try {
        return element.matches(selector);
      } catch {
        return false;
      }
    };
    function type(obj) {
      if (obj === null) return "null";
      if (typeof obj === "undefined") return "undefined";
      const primitiveType = typeof obj;
      const isObject2 = primitiveType === "object";
      const className2 = toString.call(obj);
      const objectType = typeof className2 === "string" ? className2.slice(8, -1).toLowerCase() : "object";
      return isObject2 ? objectType : primitiveType;
    }
    function isFunction(value) {
      return typeof value === "function";
    }
    function isWindow(obj) {
      return obj instanceof Window;
    }
    function isDocument(obj) {
      return obj instanceof Document;
    }
    function isObject(obj) {
      return typeof obj === "object" && obj !== null && !Array.isArray(obj);
    }
    function isPlainObject(obj) {
      if (!isObject(obj) || isWindow(obj)) return false;
      const proto = Object.getPrototypeOf(obj);
      return proto === null || proto === Object.prototype;
    }
    function likeArray(obj) {
      if (isArray(obj)) return true;
      if (!obj || typeof obj !== "object") return false;
      if (isWindow(obj)) return false;
      const length = obj.length;
      if (length === 0) return true;
      return typeof length === "number" && length > 0 && length - 1 in obj;
    }
    function compact(array) {
      const result = [];
      for (let i = 0; i < array.length; i++) {
        const item = array[i];
        if (item != null) result.push(item);
      }
      return result;
    }
    function flatten(array) {
      if (!array || array.length === 0) return [];
      const result = [];
      for (let i = 0; i < array.length; i++) {
        const item = array[i];
        if (isArray(item)) {
          for (let j = 0; j < item.length; j++) result.push(item[j]);
        } else if (mepto2.isZ(item)) {
          const collection = item;
          for (let j = 0; j < collection.length; j++) result.push(collection[j]);
        } else {
          result.push(item);
        }
      }
      return result;
    }
    function camelizeCore(str) {
      return str.replace(
        /-+(.)?/g,
        (_match, chr) => chr ? chr.toUpperCase() : ""
      );
    }
    const camelizeCache = /* @__PURE__ */ new Map();
    function camelize(str) {
      let result = camelizeCache.get(str);
      if (result === void 0) {
        result = camelizeCore(str);
        camelizeCache.set(str, result);
      }
      return result;
    }
    function dasherizeCore(str) {
      if (!str) return str;
      return str.replace(doubleColonRE, "/").replace(upperUpperLowerRE, "$1_$2").replace(lowerDigitUpperRE, "$1_$2").replace(underscoreRE, "-").toLowerCase();
    }
    const dasherizeCache = /* @__PURE__ */ new Map();
    function dasherize(str) {
      let result = dasherizeCache.get(str);
      if (result === void 0) {
        result = dasherizeCore(str);
        dasherizeCache.set(str, result);
      }
      return result;
    }
    const uniq = function(array) {
      if (!array || array.length === 0) return [];
      const seen = /* @__PURE__ */ new Set();
      const result = [];
      for (let i = 0; i < array.length; i++) {
        const item = array[i];
        if (!seen.has(item)) {
          seen.add(item);
          result.push(item);
        }
      }
      return result;
    };
    function eachClass(name, callback) {
      const classes = name.split(/\s+/);
      for (let i = 0; i < classes.length; i++) {
        const klass = classes[i];
        if (klass) callback(klass);
      }
    }
    function maybeAddPx(name, value) {
      return typeof value === "number" && !cssNumber[dasherize(name)] ? value + "px" : value;
    }
    function defaultDisplay(nodeName) {
      let display = elementDisplay.get(nodeName);
      if (display === void 0) {
        const element = document.createElement(nodeName);
        document.body.appendChild(element);
        display = getComputedStyle(element, "").getPropertyValue("display");
        const parent = element.parentNode;
        if (parent) {
          parent.removeChild(element);
        }
        if (display === "none") {
          display = "block";
        }
        elementDisplay.set(nodeName, display);
      }
      return display;
    }
    function setInnerHTML(element, html) {
      element.innerHTML = html;
    }
    function getContainer(name) {
      const key = name !== void 0 && name in containers ? name : "*";
      return containers[key];
    }
    function children(element) {
      return element instanceof Element ? slice.call(element.children) : [];
    }
    const Z = function(dom, selector) {
      const len = dom ? dom.length : 0;
      for (let i = 0; i < len; i++) {
        if (dom) {
          ;
          this[i] = dom[i];
        }
      }
      this.length = len;
      this.selector = selector || "";
    };
    mepto2.fragment = function(html, name, properties) {
      let dom;
      let htmlContent = html;
      let effectiveName = name;
      const singleMatch = singleTagRE.exec(htmlContent);
      if (singleMatch) {
        dom = [document.createElement(singleMatch[1])];
      } else {
        htmlContent = htmlContent.replace(tagExpanderRE, "<$1></$2>");
        if (effectiveName === void 0) {
          const fragMatch = fragmentRE.exec(htmlContent);
          effectiveName = fragMatch ? fragMatch[1] : void 0;
        }
        const container = getContainer(effectiveName);
        setInnerHTML(container, htmlContent);
        const childNodes = slice.call(container.childNodes);
        dom = $.each(childNodes, function() {
          container.removeChild(this);
        });
      }
      if (isPlainObject(properties)) {
        const nodes = $(dom);
        const keys = Object.keys(properties);
        for (let i = 0; i < keys.length; i++) {
          const key = keys[i];
          const value = properties[key];
          if (methodAttributesSet.has(key)) {
            const method = nodes[key];
            method.call(nodes, value);
          } else {
            nodes.attr(key, value);
          }
        }
      }
      return dom;
    };
    mepto2.Z = function(dom, selector) {
      return new Z(dom, selector);
    };
    mepto2.isZ = function(object) {
      return object instanceof mepto2.Z;
    };
    mepto2.init = function(selector, context) {
      let dom;
      let finalSelector = selector;
      if (!selector) {
        return mepto2.Z();
      } else if (typeof selector === "string") {
        const str = selector.trim();
        finalSelector = str;
        const fragMatch = str[0] === "<" ? fragmentRE.exec(str) : null;
        if (fragMatch) {
          dom = mepto2.fragment(
            str,
            fragMatch[1],
            context
          );
          finalSelector = null;
        } else if (context !== void 0) {
          return $(context).find(str);
        } else {
          dom = mepto2.qsa(document, str);
        }
      } else if (isFunction(selector)) {
        return $(document).ready(selector);
      } else if (mepto2.isZ(selector)) {
        return selector;
      } else {
        if (isArray(selector)) {
          dom = compact(selector);
        } else if (isObject(selector)) {
          dom = [selector];
          finalSelector = null;
        } else {
          const fragMatch = fragmentRE.exec(String(selector));
          if (fragMatch) {
            dom = mepto2.fragment(
              String(selector).trim(),
              fragMatch[1],
              context
            );
            finalSelector = null;
          } else if (context !== void 0) {
            return $(context).find(selector);
          } else {
            dom = mepto2.qsa(document, String(selector));
          }
        }
      }
      return mepto2.Z(dom, finalSelector);
    };
    $ = function(selector, context) {
      return mepto2.init(selector, context);
    };
    function extend(target, source, deep) {
      const keys = Object.keys(source);
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const sourceValue = source[key];
        if (deep && (isPlainObject(sourceValue) || isArray(sourceValue))) {
          if (isPlainObject(sourceValue) && !isPlainObject(target[key])) {
            target[key] = {};
          }
          if (isArray(sourceValue) && !isArray(target[key])) {
            target[key] = [];
          }
          extend(target[key], sourceValue, deep);
        } else if (sourceValue !== void 0) {
          target[key] = sourceValue;
        }
      }
    }
    $.extend = function(target, ...rest) {
      let deep = false;
      let destination;
      if (typeof target === "boolean") {
        deep = target;
        destination = rest.shift();
      } else {
        destination = target;
      }
      rest.forEach((arg) => {
        if (arg) extend(destination, arg, deep);
      });
      return destination;
    };
    mepto2.qsa = function(element, selector) {
      const maybeID = selector[0] === "#";
      const maybeClass = !maybeID && selector[0] === ".";
      const nameOnly = maybeID || maybeClass ? selector.slice(1) : selector;
      const isSimple = simpleSelectorRE.test(nameOnly);
      if (maybeID && isSimple) {
        if ("getElementById" in element) {
          const found = element.getElementById(nameOnly);
          if (found && element instanceof Element && !element.contains(found)) return [];
          return found ? [found] : [];
        }
      }
      const nodeType = element.nodeType;
      if (nodeType !== 1 && nodeType !== 9 && nodeType !== 11) {
        return [];
      }
      if (isSimple && !maybeID) {
        if (maybeClass && "getElementsByClassName" in element) {
          const results = element.getElementsByClassName(nameOnly);
          return slice.call(results);
        }
        if (!maybeClass && "getElementsByTagName" in element) {
          const results = element.getElementsByTagName(selector);
          return slice.call(results);
        }
      }
      return slice.call(element.querySelectorAll(selector));
    };
    mepto2.getElementsByClassName = function(className2, context) {
      const root = context || document;
      if (!("getElementsByClassName" in root)) return $();
      const elements = root.getElementsByClassName(className2);
      return $(slice.call(elements));
    };
    mepto2.getElementsByTagName = function(tagName, context) {
      const root = context || document;
      const elements = root.getElementsByTagName(tagName);
      return $(slice.call(elements));
    };
    mepto2.getElementById = function(id, context) {
      const root = context || document;
      if (!("getElementById" in root)) return $();
      const found = root.getElementById(id);
      if (found && root instanceof Element && !root.contains(found))
        return $();
      return found ? $([found]) : $();
    };
    mepto2.findFast = function(selector, context) {
      const root = context || document;
      const s = selector.trim();
      if (/^#[\w-]+$/.test(s) && "getElementById" in root) {
        const found = root.getElementById(s.slice(1));
        if (found && root instanceof Element && !root.contains(found))
          return $();
        return found ? $([found]) : $();
      }
      if (/^\.[\w-]+$/.test(s) && "getElementsByClassName" in root) {
        const els = root.getElementsByClassName(s.slice(1));
        return $(slice.call(els));
      }
      if (/^[a-zA-Z][\w-]*$/.test(s) && "getElementsByTagName" in root) {
        const els = root.getElementsByTagName(s);
        return $(slice.call(els));
      }
      return $(slice.call(root.querySelectorAll(s)));
    };
    function filtered(nodes, selector) {
      if (selector == null) return $(nodes);
      return $(nodes).filter(selector);
    }
    $.contains = function(parent, node) {
      return parent !== node && parent.contains(node);
    };
    function setAttribute(node, name, value) {
      value == null ? node.removeAttribute(name) : node.setAttribute(name, value);
    }
    function className(node, value) {
      const klass = node?.className;
      const svg = !!klass && typeof klass === "object" && "baseVal" in klass;
      if (value === void 0) {
        return svg ? klass.baseVal : klass;
      }
      if (svg) {
        ;
        klass.baseVal = value;
      } else {
        ;
        node.className = value;
      }
    }
    function deserializeValue(value) {
      if (!value) return value;
      if (value === "true") return true;
      if (value === "false") return false;
      if (value === "null") return null;
      const num = +value;
      if ("" + num === value) return num;
      const c0 = value.charCodeAt(0);
      if (c0 === 91 || c0 === 123) {
        try {
          return $.parseJSON(value);
        } catch {
          return value;
        }
      }
      return value;
    }
    $.type = type;
    $.isFunction = isFunction;
    $.isWindow = isWindow;
    $.isArray = isArray;
    $.isPlainObject = isPlainObject;
    $.isEmptyObject = function(obj) {
      for (const _name in obj) return false;
      return true;
    };
    $.isNumeric = function(val) {
      const num = Number(val);
      const t = typeof val;
      return val != null && t !== "boolean" && (t !== "string" || val.length > 0) && !isNaN(num) && isFinite(num) || false;
    };
    $.inArray = function(elem, array, i) {
      return emptyArray.indexOf.call(array, elem, i);
    };
    $.camelCase = camelize;
    $.trim = function(str) {
      return str == null ? "" : String.prototype.trim.call(str);
    };
    $.uuid = 0;
    $.support = {};
    $.expr = {};
    $.noop = function() {
    };
    $.map = function(elements, callback) {
      const values = [];
      if (likeArray(elements)) {
        for (let i = 0; i < elements.length; i++) {
          const value = callback(elements[i], i);
          if (value != null) values.push(value);
        }
      } else {
        const obj = elements;
        for (const key in obj) {
          const value = callback(obj[key], key);
          if (value != null) values.push(value);
        }
      }
      return flatten(values);
    };
    $.each = function(elements, callback) {
      if (likeArray(elements)) {
        for (let i = 0, len = elements.length; i < len; i++) {
          const item = elements[i];
          if (callback.call(item, i, item) === false) return elements;
        }
      } else {
        const obj = elements;
        for (const key in obj) {
          const item = obj[key];
          if (callback.call(item, key, item) === false) return elements;
        }
      }
      return elements;
    };
    $.grep = function(elements, callback) {
      return filter.call(elements, callback);
    };
    $.parseJSON = JSON.parse;
    function setElementScrollTop(value) {
      this.scrollTop = value;
    }
    function setWindowScrollTop(value) {
      this.scrollTo(this.scrollX, value);
    }
    function setElementScrollLeft(value) {
      this.scrollLeft = value;
    }
    function setWindowScrollLeft(value) {
      this.scrollTo(value, this.scrollY);
    }
    function readStyle(el, camelName, dashedName) {
      return el.style[camelName] || getComputedStyle(el, "").getPropertyValue(dashedName);
    }
    $.fn = {
      constructor: mepto2.Z,
      length: 0,
      // Because a collection acts like an array,
      // copy over these useful native array methods.
      // Explicit functions are used over emptyArray.* to satisfy unbound-method linter rules
      // while preserving the dynamic `this` binding required for array-like operations.
      forEach(callback, thisArg) {
        return emptyArray.forEach.call(this, callback, thisArg);
      },
      reduce(callback, initialValue) {
        return arguments.length > 1 ? arrayReduce.call(this, callback, initialValue) : arrayReduce.call(this, callback);
      },
      push(...items) {
        return emptyArray.push.apply(this, items);
      },
      sort(compareFn) {
        return emptyArray.sort.call(this, compareFn);
      },
      splice(...args) {
        return emptyArray.splice.apply(this, args);
      },
      indexOf(searchElement, fromIndex) {
        return emptyArray.indexOf.call(this, searchElement, fromIndex);
      },
      /**
       * Merges the collection with additional elements, arrays, or MeptoCollections.
       * MeptoCollection arguments are flattened to their underlying element arrays
       * before merging, matching `Array.prototype.concat` semantics.
       *
       * @param args - Elements, arrays, or MeptoCollections to concatenate.
       * @returns A new plain array containing all merged elements.
       */
      concat(...args) {
        const flattened = args.map(
          (arg) => mepto2.isZ(arg) ? arg.toArray() : arg
        );
        return emptyArray.concat(mepto2.isZ(this) ? this.toArray() : this, ...flattened);
      },
      // `map` and `slice` follow jQuery conventions, not Array.prototype:
      // - `map` invokes the callback as `(index, element)` with `this` bound to
      //   the element, and excludes null/undefined results from the output.
      // - `slice` wraps the result in a new Mepto collection instead of a plain array.
      map(fn) {
        return $($.map(this, (el, i) => fn.call(el, i, el)));
      },
      slice(start, end) {
        return $(slice.call(this, start, end));
      },
      /**
       * Executes `callback` when the DOM is ready (DOMContentLoaded).
       * If the DOM is already loaded, the callback is scheduled via `setTimeout`.
       *
       * @param callback - Function receiving the `$` factory.
       * @returns The collection for chaining.
       */
      ready(callback) {
        if (document.readyState !== "loading") {
          setTimeout(() => callback($), 0);
        } else {
          document.addEventListener("DOMContentLoaded", () => callback($), { once: true });
        }
        return this;
      },
      /**
       * Retrieves an element by index, or the entire collection as an array.
       * Negative indices count from the end (`-1` is the last element).
       *
       * @param idx - Zero-based index, or `undefined` for the full array.
       * @returns A single DOM element, or an array of all elements.
       */
      get(idx) {
        return idx === void 0 ? slice.call(this) : this[idx >= 0 ? idx : idx + this.length];
      },
      toArray() {
        return this.get();
      },
      size() {
        return this.length;
      },
      remove() {
        return this.each(function() {
          if (this.parentNode != null) this.parentNode.removeChild(this);
        });
      },
      /**
       * Iterates over the collection, calling `callback` for each element.
       * Returning `false` from the callback breaks the loop.
       *
       * @param callback - Function called with `(index, element)`, `this` bound to the element.
       * @returns The collection for chaining.
       */
      each(callback) {
        for (let i = 0, len = this.length; i < len; i++) {
          const element = this[i];
          if (callback.call(element, i, element) === false) break;
        }
        return this;
      },
      /**
       * Filters the collection by a CSS selector or predicate function.
       * When a function is provided, keeps elements for which it returns `true`.
       * When a string is provided, keeps elements matching the selector.
       *
       * @param selector - CSS selector string or predicate function.
       * @returns A new Mepto collection of matching elements.
       */
      filter(selector) {
        if (selector == null) return $();
        let predicate;
        if (isFunction(selector)) {
          predicate = (el, i) => selector.call(el, i, el);
        } else if (selector[0] === "." && simpleSelectorRE.test(selector.slice(1))) {
          const cls = selector.slice(1);
          predicate = (el) => el.classList.contains(cls);
        } else if (simpleSelectorRE.test(selector) && /^[a-zA-Z][\w-]*$/.test(selector)) {
          const tag = selector.toUpperCase();
          predicate = (el) => el.tagName === tag;
        } else {
          predicate = (el) => mepto2.matches(el, selector);
        }
        const result = [];
        for (let i = 0, len = this.length; i < len; i++) {
          const el = this[i];
          if (predicate(el, i)) result.push(el);
        }
        return $(result);
      },
      add(selector, context) {
        return $(
          uniq(
            this.concat($(selector, context))
          )
        );
      },
      /**
       * Checks whether the first element matches the given CSS selector,
       * or compares `selector` properties when passed a Mepto collection.
       *
       * @param selector - CSS selector string or Mepto collection to compare.
       * @returns `true` if the first element matches.
       */
      is(selector) {
        return typeof selector === "string" ? this.length > 0 && mepto2.matches(this[0], selector) : !!(selector && this.selector == selector.selector);
      },
      /**
       * Returns a new collection excluding elements matched by the selector,
       * element(s), or predicate function.
       *
       * @param selector - CSS selector string, element(s), or predicate function.
       * @returns A new Mepto collection of non-matching elements.
       */
      not(selector) {
        if (isFunction(selector)) {
          const result2 = [];
          for (let i = 0, len = this.length; i < len; i++) {
            const el = this[i];
            if (!selector.call(el, i)) result2.push(el);
          }
          return $(result2);
        }
        const excludes = typeof selector === "string" ? this.filter(selector) : likeArray(selector) && isFunction(selector.item) ? slice.call(selector) : $(selector);
        const excludeSet = /* @__PURE__ */ new Set();
        for (let i = 0, len = excludes.length; i < len; i++) {
          excludeSet.add(excludes[i]);
        }
        const result = [];
        for (let i = 0, len = this.length; i < len; i++) {
          const el = this[i];
          if (!excludeSet.has(el)) result.push(el);
        }
        return $(result);
      },
      /**
       * Filters elements to those that contain a descendant matching the
       * given selector, or that contain the given DOM node.
       *
       * @param selector - CSS selector string or DOM node.
       * @returns A new Mepto collection of matching elements.
       */
      has(selector) {
        return this.filter(function() {
          return isObject(selector) ? $.contains(this, selector) : $(this).find(selector).length > 0;
        });
      },
      /**
       * Returns the element at the given index as a Mepto collection.
       * Negative indices count from the end.
       *
       * @param idx - Zero-based index (negative counts from end).
       * @returns A new Mepto collection containing the single element.
       */
      eq(idx) {
        return idx === -1 ? this.slice(idx) : this.slice(idx, +idx + 1);
      },
      first() {
        return $(this[0]);
      },
      last() {
        return $(this[this.length - 1]);
      },
      /**
       * Finds descendant elements matching the given CSS selector,
       * or filters for elements containing the given element(s).
       *
       * @param selector - CSS selector string, element, or array-like of elements.
       * @returns A new Mepto collection of matched descendants.
       */
      find(selector) {
        if (!selector) return $();
        if (typeof selector === "object") {
          const nodes = $(selector);
          const result2 = [];
          const parents = this;
          for (let i = 0, nlen = nodes.length; i < nlen; i++) {
            const node = nodes[i];
            if (!(node instanceof Element)) continue;
            for (let j = 0, plen = parents.length; j < plen; j++) {
              if ($.contains(parents[j], node)) {
                result2.push(node);
                break;
              }
            }
          }
          return $(result2);
        }
        if (this.length == 1) return $(mepto2.qsa(this[0], selector));
        const seen = /* @__PURE__ */ new Set();
        const result = [];
        for (let i = 0, len = this.length; i < len; i++) {
          const found = mepto2.qsa(this[i], selector);
          for (let j = 0, foundLen = found.length; j < foundLen; j++) {
            const el = found[j];
            if (!seen.has(el)) {
              seen.add(el);
              result.push(el);
            }
          }
        }
        return $(result);
      },
      /**
       * Traverses ancestors of each element, returning the first that matches
       * `selector`. Stops at `context` or the document root.
       *
       * @param selector - CSS selector string, element, or array-like of elements to match.
       * @param context  - Optional boundary element; traversal stops here.
       * @returns A new Mepto collection of closest matching ancestors.
       */
      closest(selector, context) {
        const nodes = [];
        const collection = typeof selector === "object" && $(selector);
        const seen = /* @__PURE__ */ new Set();
        if (collection) {
          const matchers = /* @__PURE__ */ new Set();
          for (let i = 0, len = collection.length; i < len; i++) {
            const el = collection[i];
            if (el instanceof Element) matchers.add(el);
          }
          for (let i = 0, len = this.length; i < len; i++) {
            const el = this[i];
            if (!(el instanceof Element)) continue;
            let node = el;
            while (node) {
              if (matchers.has(node)) {
                if (!seen.has(node)) {
                  seen.add(node);
                  nodes.push(node);
                }
                break;
              }
              if (node === context || isDocument(node)) break;
              node = node.parentNode;
            }
          }
          return $(nodes);
        }
        for (let i = 0, len = this.length; i < len; i++) {
          const el = this[i];
          if (!(el instanceof Element)) continue;
          const found = el.closest(selector);
          if (found && (!context || context.contains(found)) && !seen.has(found)) {
            seen.add(found);
            nodes.push(found);
          }
        }
        return $(nodes);
      },
      /**
       * Like {@link closest}, but returns **only the first match** from the
       * first element in the collection — mirroring the native
       * `Element.closest()` semantics.
       *
       * This is the preferred bridge toward vanilla JS: an LLM or developer
       * reading `singleClosest` knows the result is always either a
       * single-element collection or an empty one.
       *
       * @param selector - CSS selector string to match.
       * @param context  - Optional boundary element; traversal stops here.
       * @returns A Mepto collection containing at most one element.
       */
      singleClosest(selector, context) {
        if (this.length === 0) return $();
        const firstEl = this[0];
        if (typeof selector === "string") {
          const found = firstEl.closest(selector);
          if (!found) return $();
          if (context && !context.contains(found)) return $();
          return $(found);
        }
        const collection = $(selector);
        const matchers = /* @__PURE__ */ new Set();
        for (let i = 0, len = collection.length; i < len; i++) {
          const el = collection[i];
          if (el instanceof Element) matchers.add(el);
        }
        let node = firstEl;
        while (node) {
          if (node instanceof Element && matchers.has(node)) {
            return $(node);
          }
          if (node === context || isDocument(node)) break;
          node = node.parentNode;
        }
        return $();
      },
      parents(selector) {
        const ancestors = [];
        const seen = /* @__PURE__ */ new Set();
        let nodes = this;
        while (nodes.length > 0) {
          nodes = $.map(nodes, (node) => {
            const parent = node.parentNode;
            if (parent && !isDocument(parent) && parent instanceof Element && !seen.has(parent)) {
              seen.add(parent);
              ancestors.push(parent);
              return parent;
            }
            return null;
          });
        }
        return filtered(ancestors, selector);
      },
      parent(selector) {
        const parents = [];
        const seen = /* @__PURE__ */ new Set();
        for (let i = 0, len = this.length; i < len; i++) {
          const parent = this[i].parentNode;
          if (parent && !seen.has(parent)) {
            seen.add(parent);
            parents.push(parent);
          }
        }
        return filtered(parents, selector);
      },
      children(selector) {
        return filtered(
          // the map callback returns plain arrays, which $.map flattens
          this.map(function() {
            return children(this);
          }),
          selector
        );
      },
      contents() {
        return this.map(function() {
          return this.contentDocument || slice.call(this.childNodes);
        });
      },
      siblings(selector) {
        return filtered(
          this.map((_i, el) => {
            const parent = el.parentNode;
            if (!parent) return [];
            const result = [];
            for (let sib = parent.firstElementChild; sib; sib = sib.nextElementSibling) {
              if (sib !== el) result.push(sib);
            }
            return result;
          }),
          selector
        );
      },
      empty() {
        return this.each(function() {
          setInnerHTML(this, "");
        });
      },
      // `pluck` is borrowed from Prototype.js
      pluck(property) {
        return $.map(this, (el) => {
          return el[property];
        });
      },
      show() {
        return this.each(function() {
          this.style.display == "none" && (this.style.display = "");
          if (getComputedStyle(this, "").getPropertyValue("display") == "none")
            this.style.display = defaultDisplay(this.nodeName);
        });
      },
      /**
       * Replaces each element in the collection with `newContent`.
       *
       * @param newContent - HTML string, element, or Mepto collection to insert.
       * @returns The original (now detached) collection.
       */
      replaceWith(newContent) {
        return this.before(newContent).remove();
      },
      /**
       * Wraps `structure` around each element in the collection.
       * `structure` can be an HTML string, DOM element, or a function
       * returning one.
       *
       * @param structure - Wrapper element, HTML string, or function.
       * @returns The original collection for chaining.
       */
      wrap(structure) {
        const isCallable = isFunction(structure);
        let wrapperElement;
        let shouldClone = false;
        if (this[0] && !isCallable) {
          wrapperElement = $(structure).get(0);
          shouldClone = !!wrapperElement && (!!wrapperElement.parentNode || this.length > 1);
        }
        return this.each(function(index) {
          const wrapper = isCallable ? structure.call(this, index) : shouldClone ? wrapperElement.cloneNode(true) : wrapperElement;
          $(this).wrapAll(wrapper);
        });
      },
      /**
       * Wraps `structure` around the entire collection as a single group,
       * inserting it before the first element and moving all elements inside.
       *
       * @param structure - Wrapper element, HTML string, or Mepto collection.
       * @returns The original collection for chaining.
       */
      wrapAll(structure) {
        if (!this[0]) return this;
        const wrapper = $(structure);
        $(this[0]).before(wrapper);
        let innermost = wrapper;
        let kids = innermost.children();
        while (kids.length) {
          innermost = kids.first();
          kids = innermost.children();
        }
        $(innermost).append(this);
        return this;
      },
      /**
       * Wraps the inner contents of each element with `structure`.
       * Pass `null` to skip wrapping.
       *
       * @param structure - Wrapper element, HTML string, or function returning one.
       * @returns The original collection for chaining.
       */
      wrapInner(structure) {
        if (structure == null) return this;
        const isCallable = isFunction(structure);
        return this.each(function(index) {
          const self = $(this);
          const contents = self.contents();
          const wrappingContent = isCallable ? structure.call(this, index) : structure;
          if (contents.length) {
            ;
            contents.wrapAll(wrappingContent);
          } else {
            self.append(wrappingContent);
          }
        });
      },
      unwrap() {
        this.parent().each(function() {
          $(this).replaceWith($(this).children());
        });
        return this;
      },
      clone() {
        return this.map(function() {
          return this.cloneNode(true);
        });
      },
      hide() {
        return this.css("display", "none");
      },
      toggle(setting) {
        return this.each(function() {
          const el = $(this);
          (setting === void 0 ? el.css("display") == "none" : setting) ? el.show() : el.hide();
        });
      },
      prev(selector) {
        return $(this.pluck("previousElementSibling")).filter(selector || "*");
      },
      next(selector) {
        return $(this.pluck("nextElementSibling")).filter(selector || "*");
      },
      /**
       * Gets or sets the `innerHTML` of elements.
       * When called without arguments, returns the HTML of the first element.
       * Accepts a function receiving `(index, currentHtml)`.
       *
       * @param html - HTML string or function returning HTML.
       * @returns HTML string (getter) or the collection (setter).
       */
      html(html) {
        return arguments.length > 0 ? this.each(function(idx) {
          const originHtml = this.innerHTML;
          $(this).empty().append(isFunction(html) ? html.call(this, idx, originHtml) : html);
        }) : 0 in this ? this[0].innerHTML : null;
      },
      /**
       * Gets or sets the `textContent` of elements.
       * When called without arguments, returns the concatenated text of all elements.
       * Accepts a function receiving `(index, currentText)`.
       *
       * @param text - Text string, number, or function returning text.
       * @returns Text string (getter) or the collection (setter).
       */
      text(text) {
        return arguments.length > 0 ? this.each(function(idx) {
          const newText = isFunction(text) ? text.call(this, idx, this.textContent) : text;
          this.textContent = newText == null ? "" : "" + newText;
        }) : 0 in this ? this.pluck("textContent").join("") : null;
      },
      /**
       * Gets or sets HTML attributes on elements.
       * - `.attr(name)` — get attribute of first element.
       * - `.attr(name, value)` — set attribute on all elements.
       * - `.attr({ name: value, ... })` — set multiple attributes.
       * - `.attr(name, fn)` — set via function receiving `(index, oldValue)`.
       *
       * @param name  - Attribute name, or object of name/value pairs.
       * @param value - Attribute value, function, or `null` to remove.
       * @returns Attribute value (getter) or the collection (setter).
       */
      attr(name, value) {
        if (typeof name === "string" && arguments.length < 2) {
          if (this.length > 0 && this[0].nodeType === 1) {
            const result = this[0].getAttribute(name);
            return result != null ? result : void 0;
          }
          return void 0;
        }
        const nameIsObject = isObject(name);
        const valueIsFunction = isFunction(value);
        for (let i = 0, len = this.length; i < len; i++) {
          const el = this[i];
          if (el.nodeType !== 1) continue;
          if (nameIsObject) {
            const attrs = name;
            for (const k in attrs) setAttribute(el, k, attrs[k]);
          } else {
            setAttribute(el, name, valueIsFunction ? value.call(el, i, el.getAttribute(name)) : value);
          }
        }
        return this;
      },
      /**
       * Removes one or more space-separated attributes from every element.
       *
       * @param name - Space-separated attribute names to remove.
       * @returns The collection for chaining.
       */
      removeAttr(name) {
        const attributes = name.split(" ");
        return this.each(function() {
          if (this.nodeType !== 1) return;
          for (let i = 0; i < attributes.length; i++) {
            setAttribute(this, attributes[i]);
          }
        });
      },
      /**
       * Gets or sets DOM properties on elements. Normalises property names
       * via `propMap` (e.g. `"for"` → `"htmlFor"`, `"class"` → `"className"`).
       *
       * - `.prop(name)` — get property of first element.
       * - `.prop(name, value)` — set property on all elements.
       * - `.prop({ name: value })` — set multiple properties.
       *
       * @param name  - Property name or object of name/value pairs.
       * @param value - Property value or function receiving `(index, oldValue)`.
       * @returns Property value (getter) or the collection (setter).
       */
      prop(name, value) {
        const resolvedName = typeof name === "string" ? propMap[name] || name : name;
        if (typeof resolvedName === "string" && arguments.length < 2) {
          return this[0] && this[0][resolvedName];
        }
        const nameIsObject = isObject(resolvedName);
        const valueIsFunction = isFunction(value);
        return this.each(function(idx) {
          const el = this;
          if (nameIsObject) {
            const props = resolvedName;
            for (const k in props) el[propMap[k] || k] = props[k];
          } else {
            const key = resolvedName;
            el[key] = valueIsFunction ? value.call(this, idx, el[key]) : value;
          }
        });
      },
      /**
       * Deletes a DOM property from every element. Normalises via `propMap`.
       *
       * @param name - Property name to delete.
       * @returns The collection for chaining.
       */
      removeProp(name) {
        const resolvedName = propMap[name] || name;
        return this.each(function() {
          delete this[resolvedName];
        });
      },
      /**
       * Reads or writes a `data-*` attribute. The attribute name is
       * dasherized automatically (e.g. `data("myVal")` reads `data-my-val`).
       * Values are deserialized via `deserializeValue`.
       *
       * @param name  - Data key name.
       * @param value - Value to set (omitted for getter).
       * @returns Deserialized value (getter) or the collection (setter).
       */
      data(name, value) {
        const attrName = "data-" + name.replace(capitalRE, "-$1").toLowerCase();
        if (arguments.length > 1) {
          return this.attr(attrName, value);
        }
        const data = this.attr(attrName);
        return data !== void 0 ? deserializeValue(data) : void 0;
      },
      /**
       * Gets or sets the value of form elements.
       * For `<select multiple>`, returns an array of selected values.
       * Accepts a function receiving `(index, currentValue)`.
       *
       * @param value - Value string, array, or function.
       * @returns Value (getter) or the collection (setter).
       */
      val(value) {
        if (arguments.length > 0) {
          const v = value == null ? "" : value;
          for (let i = 0, len = this.length; i < len; i++) {
            const el2 = this[i];
            el2.value = isFunction(v) ? v.call(el2, i, el2.value) : v;
          }
          return this;
        }
        const el = this[0];
        if (!el) return void 0;
        if (el.multiple) {
          const result = [];
          const options = el.selectedOptions;
          for (let i = 0, len = options.length; i < len; i++) {
            result.push(options[i].value);
          }
          return result;
        }
        return el.value;
      },
      /**
       * Gets or sets the position of the first element relative to the document.
       * As a setter, positions elements relative to their offset parent.
       * Accepts a function receiving `(index, currentOffset)`.
       *
       * @param coordinates - `{ top, left }` object or function returning one.
       * @returns Object with `top`, `left`, `width`, `height` (getter) or the collection (setter).
       */
      offset(coordinates) {
        if (coordinates)
          return this.each(function(index) {
            const $this = $(this);
            const coords = isFunction(coordinates) ? coordinates.call(this, index, $this.offset()) : coordinates;
            const parentOffset = $this.offsetParent().offset();
            const props = {
              top: coords.top - parentOffset.top,
              left: coords.left - parentOffset.left
            };
            if ($this.css("position") == "static") props["position"] = "relative";
            $this.css(props);
          });
        if (!this.length) return null;
        if (document.documentElement !== this[0] && !$.contains(document.documentElement, this[0]))
          return { top: 0, left: 0 };
        const obj = this[0].getBoundingClientRect();
        return {
          left: obj.left + window.pageXOffset,
          top: obj.top + window.pageYOffset,
          width: Math.round(obj.width),
          height: Math.round(obj.height)
        };
      },
      /**
       * Gets or sets CSS properties on elements.
       * - `.css(prop)` — get computed value of a single property.
       * - `.css([prop, ...])` — get multiple properties as an object.
       * - `.css(prop, value)` — set a single property (omit value to remove).
       * - `.css({ prop: value })` — set multiple properties.
       *
       * @param property - CSS property name(s) or an object of name/value pairs.
       * @param value    - CSS value, or omitted/`null` to remove the property.
       * @returns CSS value (getter) or the collection (setter).
       */
      css(property, value) {
        if (arguments.length < 2) {
          const element = this[0];
          if (typeof property === "string") {
            if (!element) return;
            return element.style[camelize(property)] || getComputedStyle(element, "").getPropertyValue(property);
          } else if (isArray(property)) {
            if (!element) return;
            const props = {};
            const computedStyle = getComputedStyle(element, "");
            $.each(property, (_, prop) => {
              props[prop] = element.style[camelize(prop)] || computedStyle.getPropertyValue(prop);
            });
            return props;
          }
        }
        if (type(property) == "string") {
          const dashedName = dasherize(property);
          if (!value && value !== 0) {
            return this.each(function() {
              ;
              this.style.removeProperty(dashedName);
            });
          }
          const cssValue = String(maybeAddPx(property, value));
          return this.each(function() {
            ;
            this.style.setProperty(dashedName, cssValue);
          });
        }
        const propObj = property;
        const entries = [];
        const propKeys = Object.keys(propObj);
        for (let i = 0; i < propKeys.length; i++) {
          const key = propKeys[i];
          const propValue = propObj[key];
          entries.push(
            !propValue && propValue !== 0 ? [dasherize(key), null] : [dasherize(key), String(maybeAddPx(key, propValue))]
          );
        }
        return this.each(function() {
          const style = this.style;
          for (let i = 0; i < entries.length; i++) {
            const entry = entries[i];
            if (entry[1] === null) style.removeProperty(entry[0]);
            else style.setProperty(entry[0], entry[1]);
          }
        });
      },
      /**
       * Returns the index of the first element among its siblings,
       * or the index of `element` within this collection.
       *
       * @param element - Optional selector or element to locate.
       * @returns Zero-based index.
       */
      index(element) {
        return element ? this.indexOf($(element)[0]) : this.parent().children().indexOf(this[0]);
      },
      /**
       * Checks whether any element in the collection has the given CSS class.
       * For space-separated names, every listed class must be present.
       *
       * @param name - CSS class name to check for.
       * @returns `true` if at least one element has the class.
       */
      hasClass(name) {
        if (!name) return false;
        const tokens = name.split(/\s+/);
        for (let i = 0, len = this.length; i < len; i++) {
          const el = this[i];
          if (!(el instanceof Element)) continue;
          let sawToken = false;
          let allPresent = true;
          for (let j = 0; j < tokens.length; j++) {
            const token = tokens[j];
            if (!token) continue;
            sawToken = true;
            if (!el.classList.contains(token)) {
              allPresent = false;
              break;
            }
          }
          if (sawToken && allPresent) return true;
        }
        return false;
      },
      /**
       * Adds one or more CSS classes to every element. Duplicates are skipped.
       * Accepts a function receiving `(index, currentClass)`.
       *
       * @param name - Space-separated class names, or function returning them.
       * @returns The collection for chaining.
       */
      addClass(name) {
        if (!name) return this;
        return this.each(function(idx) {
          if (!("className" in this)) return;
          const newName = isFunction(name) ? name.call(this, idx, className(this) || "") : name;
          const list = this.classList;
          eachClass(newName, (klass) => {
            list.add(klass);
          });
        });
      },
      /**
       * Removes one or more CSS classes from every element.
       * With no arguments, removes all classes. Accepts a function
       * receiving `(index, currentClass)`.
       *
       * @param name - Space-separated class names, or function returning them.
       * @returns The collection for chaining.
       */
      removeClass(name) {
        return this.each(function(idx) {
          if (!("className" in this)) return;
          if (name === void 0) {
            className(this, "");
            return;
          }
          const resolved = isFunction(name) ? name.call(this, idx, className(this) || "") : name;
          const list = this.classList;
          eachClass(resolved, (klass) => {
            list.remove(klass);
          });
        });
      },
      /**
       * Toggles one or more CSS classes on every element.
       * Pass `true`/`false` as `when` to force add/remove.
       * Accepts a function receiving `(index, currentClass)`.
       *
       * @param name - Space-separated class names, or function returning them.
       * @param when - `true` to add, `false` to remove; omit to toggle.
       * @returns The collection for chaining.
       */
      toggleClass(name, when) {
        if (!name) return this;
        return this.each(function(idx) {
          if (!("className" in this)) return;
          const names = isFunction(name) ? name.call(this, idx, className(this) || "") : name;
          const list = this.classList;
          eachClass(names, (klass) => {
            list.toggle(klass, when);
          });
        });
      },
      /**
       * Gets or sets the vertical scroll position of the first element.
       *
       * @param value - Scroll position in pixels (omit to get).
       * @returns Current scroll position (getter) or the collection (setter).
       */
      scrollTop(value) {
        if (!this.length) return;
        const first = this[0];
        const hasScrollTop = "scrollTop" in first;
        if (value === void 0) return hasScrollTop ? first.scrollTop : first.pageYOffset;
        const setter = hasScrollTop ? setElementScrollTop : setWindowScrollTop;
        return this.each(function() {
          setter.call(this, value);
        });
      },
      /**
       * Gets or sets the horizontal scroll position of the first element.
       *
       * @param value - Scroll position in pixels (omit to get).
       * @returns Current scroll position (getter) or the collection (setter).
       */
      scrollLeft(value) {
        if (!this.length) return;
        const first = this[0];
        const hasScrollLeft = "scrollLeft" in first;
        if (value === void 0) return hasScrollLeft ? first.scrollLeft : first.pageXOffset;
        const setter = hasScrollLeft ? setElementScrollLeft : setWindowScrollLeft;
        return this.each(function() {
          setter.call(this, value);
        });
      },
      position() {
        if (!this.length) return;
        const elem = this[0];
        const offsetParent = this.offsetParent();
        const offset = this.offset();
        const parentOffset = rootNodeRE.test(offsetParent[0].nodeName) ? { top: 0, left: 0 } : offsetParent.offset();
        offset.top -= parseFloat(readStyle(elem, "marginTop", "margin-top")) || 0;
        offset.left -= parseFloat(readStyle(elem, "marginLeft", "margin-left")) || 0;
        const offsetParentEl = offsetParent[0];
        parentOffset.top += parseFloat(readStyle(offsetParentEl, "borderTopWidth", "border-top-width")) || 0;
        parentOffset.left += parseFloat(readStyle(offsetParentEl, "borderLeftWidth", "border-left-width")) || 0;
        return {
          top: offset.top - parentOffset.top,
          left: offset.left - parentOffset.left
        };
      },
      offsetParent() {
        return this.map(function() {
          let parent = this.offsetParent || document.body;
          while (parent && !rootNodeRE.test(parent.nodeName) && readStyle(parent, "position", "position") == "static")
            parent = parent.offsetParent;
          return parent;
        });
      }
    };
    $.fn.detach = $.fn.remove;
    Object.defineProperty($.fn, "classList", {
      get() {
        const collection = this;
        return {
          // Tokens are split on whitespace (mirroring addClass/removeClass) so
          // space-separated strings behave like the class helpers instead of
          // throwing, which is what the native DOMTokenList does on ' '.
          add(...tokens) {
            return collection.each(function() {
              const list = this.classList;
              for (const token of tokens) eachClass(token, (klass) => list.add(klass));
            });
          },
          remove(...tokens) {
            return collection.each(function() {
              const list = this.classList;
              for (const token of tokens) eachClass(token, (klass) => list.remove(klass));
            });
          },
          toggle(token, force) {
            return collection.each(function() {
              const list = this.classList;
              eachClass(token, (klass) => list.toggle(klass, force));
            });
          },
          contains(token) {
            return collection.length > 0 && collection[0].classList.contains(token);
          },
          replace(oldToken, newToken) {
            return collection.each(function() {
              this.classList.replace(oldToken, newToken);
            });
          },
          entries() {
            return collection.length > 0 ? collection[0].classList.entries() : [][Symbol.iterator]();
          },
          forEach(callback) {
            if (collection.length > 0) collection[0].classList.forEach(callback);
          },
          item(index) {
            return collection.length > 0 ? collection[0].classList.item(index) : null;
          },
          keys() {
            return collection.length > 0 ? collection[0].classList.keys() : [][Symbol.iterator]();
          },
          values() {
            return collection.length > 0 ? collection[0].classList.values() : [][Symbol.iterator]();
          },
          toString() {
            return collection.length > 0 ? collection[0].classList.toString() : "";
          },
          get length() {
            return collection.length > 0 ? collection[0].classList.length : 0;
          },
          get value() {
            return collection.length > 0 ? collection[0].classList.value : "";
          },
          set value(val) {
            collection.each(function() {
              this.classList.value = val;
            });
          }
        };
      }
    });
    Object.defineProperty($.fn, "attrs", {
      get() {
        const collection = this;
        return {
          get(name) {
            if (collection.length > 0 && collection[0].nodeType === 1) {
              const result = collection[0].getAttribute(name);
              return result != null ? result : void 0;
            }
            return void 0;
          },
          set(name, value) {
            return collection.each(function() {
              if (this.nodeType !== 1) return;
              if (isObject(name)) {
                for (const k in name) setAttribute(this, k, name[k]);
              } else {
                setAttribute(this, name, value);
              }
            });
          },
          remove(names) {
            const attributes = names.split(" ");
            return collection.each(function() {
              if (this.nodeType !== 1) return;
              for (let i = 0; i < attributes.length; i++) {
                if (attributes[i]) this.removeAttribute(attributes[i]);
              }
            });
          }
        };
      }
    });
    Object.defineProperty($.fn, "styles", {
      get() {
        const collection = this;
        return {
          get(name) {
            if (collection.length > 0 && collection[0].nodeType === 1) {
              const element = collection[0];
              return element.style[camelize(name)] || getComputedStyle(element, "").getPropertyValue(name);
            }
            return void 0;
          },
          set(name, value) {
            const entries = [];
            if (typeof name === "string") {
              entries.push(
                !value && value !== 0 ? [dasherize(name), null] : [dasherize(name), String(maybeAddPx(name, value))]
              );
            } else {
              const propKeys = Object.keys(name);
              for (let i = 0; i < propKeys.length; i++) {
                const key = propKeys[i];
                const propValue = name[key];
                entries.push(
                  !propValue && propValue !== 0 ? [dasherize(key), null] : [dasherize(key), String(maybeAddPx(key, propValue))]
                );
              }
            }
            return collection.each(function() {
              if (this.nodeType !== 1) return;
              const style = this.style;
              for (let i = 0; i < entries.length; i++) {
                const entry = entries[i];
                if (entry[1] === null) style.removeProperty(entry[0]);
                else style.setProperty(entry[0], entry[1]);
              }
            });
          }
        };
      }
    });
    ["width", "height"].forEach((dimension) => {
      const dimensionProperty = dimension.replace(/./, (m) => {
        return m[0].toUpperCase();
      });
      $.fn[dimension] = function(value) {
        let offset, el = this[0];
        if (value === void 0)
          return isWindow(el) ? el["inner" + dimensionProperty] : isDocument(el) ? el.documentElement["scroll" + dimensionProperty] : (offset = this.offset(), offset?.[dimension] ?? 0);
        else
          return this.each(function(idx) {
            const $el = $(this);
            $el.css(
              dimension,
              isFunction(value) ? value.call(this, idx, $el[dimension]()) : value
            );
          });
      };
    });
    ["width", "height"].forEach((dimension) => {
      const dimensionProperty = dimension.replace(/./, (m) => {
        return m[0].toUpperCase();
      });
      const offsetProperty = "offset" + dimensionProperty;
      const margins = dimension === "width" ? ["marginLeft", "marginRight"] : ["marginTop", "marginBottom"];
      $.fn["outer" + dimensionProperty] = function(includeMargin) {
        const el = this[0];
        if (el?.nodeType !== 1) return 0;
        let size = el[offsetProperty];
        if (includeMargin) {
          const style = getComputedStyle(el);
          size += parseFloat(style[margins[0]]) + parseFloat(style[margins[1]]);
        }
        return size;
      };
    });
    function traverseNode(node, callback) {
      if (!node) return;
      callback(node);
      const children2 = node.childNodes;
      for (let i = 0, len = children2.length; i < len; i++) {
        traverseNode(children2[i], callback);
      }
    }
    adjacencyOperators.forEach((operator, operatorIndex) => {
      const inside = operatorIndex % 2;
      $.fn[operator] = function(...args) {
        let argType, nodes = $.map(args, (arg) => {
          const arr = [];
          argType = type(arg);
          if (argType == "array") {
            ;
            arg.forEach((el) => {
              if (el.nodeType !== void 0) return arr.push(el);
              else if (mepto2.isZ(el))
                return arr.push(...el.get());
              arr.push(...mepto2.fragment(el));
            });
            return arr;
          }
          return argType === "object" || arg == null || arg.nodeType !== void 0 ? arg : mepto2.fragment(arg);
        }), parent, copyByClone = this.length > 1;
        if (nodes.length < 1) return this;
        return this.each((_, target) => {
          parent = inside ? target : target.parentNode;
          target = operatorIndex == 0 ? target.nextSibling : operatorIndex == 1 ? target.firstChild : operatorIndex == 2 ? target : null;
          const parentInDocument = $.contains(document.documentElement, parent);
          nodes.forEach((node) => {
            if (copyByClone) node = node.cloneNode(true);
            else if (!parent) return $(node).remove();
            parent.insertBefore(node, target);
            if (parentInDocument)
              traverseNode(node, (el) => {
                const script = el;
                if (el.nodeName === "SCRIPT" && (!script.type || script.type === "text/javascript") && !script.src) {
                  const win = script.ownerDocument ? script.ownerDocument.defaultView : window;
                  win["eval"].call(win, script.innerHTML);
                }
              });
          });
        });
      };
      $.fn[inside ? operator + "To" : "insert" + (operatorIndex ? "Before" : "After")] = function(html) {
        ;
        $(html)[operator](this);
        return this;
      };
    });
    mepto2.Z.prototype = Z.prototype = $.fn;
    $.fn.jquery = "3.7.1";
    mepto2.jquery = "3.7.1";
    const elementDataStore = /* @__PURE__ */ new WeakMap();
    function getDataMap(el) {
      let m = elementDataStore.get(el);
      if (!m) {
        m = /* @__PURE__ */ new Map();
        elementDataStore.set(el, m);
      }
      return m;
    }
    ;
    $.data = function(elem, key, value) {
      if (typeof elem === "string") elem = document.querySelector(elem);
      if (!elem || !elem.nodeType) return void 0;
      if (key === void 0) return elementDataStore.get(elem);
      if (arguments.length === 3) {
        getDataMap(elem).set(key, value);
        return value;
      }
      const map = elementDataStore.get(elem);
      if (map && map.has(key)) return map.get(key);
      return $(elem).data(key);
    };
    $.removeData = function(elem, key) {
      if (typeof elem === "string") elem = document.querySelector(elem);
      if (!elem || !elem.nodeType) return;
      if (key === void 0) elementDataStore.delete(elem);
      else elementDataStore.get(elem)?.delete(key);
    };
    $.Event = function(type2, props) {
      let e;
      if (typeof type2 === "string") {
        e = new CustomEvent(type2, { bubbles: true, cancelable: true });
      } else {
        const orig = type2;
        e = new CustomEvent(orig.type, {
          bubbles: true,
          cancelable: true
        });
        for (const k in orig) {
          try {
            ;
            e[k] = orig[k];
          } catch {
          }
        }
      }
      if (props) Object.assign(e, props);
      return e;
    };
    const _origTrigger = $.fn.trigger;
    $.fn.trigger = function(event, extra) {
      const extraArgs = Array.isArray(extra) ? extra : extra !== void 0 ? [extra] : [];
      if (typeof event === "string") {
        return _origTrigger.call(this, event, ...extraArgs);
      }
      const type2 = event.type;
      return this.each(function() {
        const ev = event;
        ev.__extra = extraArgs;
        this.dispatchEvent(ev);
      });
    };
    if (!$.bridget) {
      ;
      $.bridget = function(namespace, Klass) {
        const K = Klass;
        $.fn[namespace] = function(option, ...rest) {
          if (typeof option === "string") {
            if (option.charAt(0) === "_") {
              if (window.console) console.error(namespace + " has no method " + option);
              return this;
            }
            for (let i = 0; i < this.length; i++) {
              const el = this[i];
              const inst = K.data ? K.data(el) : $.data(el, namespace);
              const dataInst = inst || elementDataStore.get(el)?.get(namespace);
              if (!dataInst) {
                if (window.console)
                  console.error(namespace + " not initialized. Cannot call method " + option);
                continue;
              }
              const method = dataInst[option];
              if (!method) {
                if (window.console) console.error(namespace + " has no method " + option);
                continue;
              }
              const ret = method.apply(dataInst, rest);
              if (ret !== void 0 && ret !== dataInst) return ret;
            }
            return this;
          }
          return this.each(function() {
            const el = this;
            const existing = elementDataStore.get(el)?.get(namespace) || K.data?.(el);
            if (existing) {
              const opt = existing;
              if (opt.option) opt.option(option);
            } else {
              const Ctor = K;
              const inst = new Ctor(el, option);
              getDataMap(el).set(namespace, inst);
            }
          });
        };
      };
    }
    ;
    $.batch = function(parent, elements) {
      const frag = document.createDocumentFragment();
      const arr = Array.isArray(elements) ? elements : Array.from(elements);
      for (let i = 0, len = arr.length; i < len; i++) frag.appendChild(arr[i]);
      parent.appendChild(frag);
    };
    const readQueue = [];
    const writeQueue = [];
    let rafScheduled = false;
    function flushRAF() {
      rafScheduled = false;
      const reads = readQueue.splice(0, readQueue.length);
      const writes = writeQueue.splice(0, writeQueue.length);
      for (let i = 0, len = reads.length; i < len; i++) reads[i]();
      for (let i = 0, len = writes.length; i < len; i++) writes[i]();
    }
    function scheduleRAF() {
      if (!rafScheduled) {
        rafScheduled = true;
        requestAnimationFrame(flushRAF);
      }
    }
    ;
    $.raf = function(cb) {
      return requestAnimationFrame(cb);
    };
    $.measure = function(cb) {
      readQueue.push(cb);
      scheduleRAF();
    };
    $.mutate = function(cb) {
      writeQueue.push(cb);
      scheduleRAF();
    };
    mepto2.uniq = uniq;
    mepto2.deserializeValue = deserializeValue;
    $.mepto = mepto2;
    return $;
  })();
  var globalScope = window;
  globalScope.mepto = mepto;
  globalScope.$ === void 0 && (globalScope.$ = mepto);
})();
