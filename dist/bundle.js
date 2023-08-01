(() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __publicField = (obj, key, value) => {
    __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
    return value;
  };
  var __accessCheck = (obj, member, msg) => {
    if (!member.has(obj))
      throw TypeError("Cannot " + msg);
  };
  var __privateGet = (obj, member, getter) => {
    __accessCheck(obj, member, "read from private field");
    return getter ? getter.call(obj) : member.get(obj);
  };
  var __privateAdd = (obj, member, value) => {
    if (member.has(obj))
      throw TypeError("Cannot add the same private member more than once");
    member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
  };
  var __privateSet = (obj, member, value, setter) => {
    __accessCheck(obj, member, "write to private field");
    setter ? setter.call(obj, value) : member.set(obj, value);
    return value;
  };
  var __privateMethod = (obj, member, method) => {
    __accessCheck(obj, member, "access private method");
    return method;
  };

  // node_modules/mustache/mustache.mjs
  var objectToString = Object.prototype.toString;
  var isArray = Array.isArray || function isArrayPolyfill(object) {
    return objectToString.call(object) === "[object Array]";
  };
  function isFunction(object) {
    return typeof object === "function";
  }
  function typeStr(obj) {
    return isArray(obj) ? "array" : typeof obj;
  }
  function escapeRegExp(string) {
    return string.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, "\\$&");
  }
  function hasProperty(obj, propName) {
    return obj != null && typeof obj === "object" && propName in obj;
  }
  function primitiveHasOwnProperty(primitive, propName) {
    return primitive != null && typeof primitive !== "object" && primitive.hasOwnProperty && primitive.hasOwnProperty(propName);
  }
  var regExpTest = RegExp.prototype.test;
  function testRegExp(re, string) {
    return regExpTest.call(re, string);
  }
  var nonSpaceRe = /\S/;
  function isWhitespace(string) {
    return !testRegExp(nonSpaceRe, string);
  }
  var entityMap = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
    "/": "&#x2F;",
    "`": "&#x60;",
    "=": "&#x3D;"
  };
  function escapeHtml(string) {
    return String(string).replace(/[&<>"'`=\/]/g, function fromEntityMap(s) {
      return entityMap[s];
    });
  }
  var whiteRe = /\s*/;
  var spaceRe = /\s+/;
  var equalsRe = /\s*=/;
  var curlyRe = /\s*\}/;
  var tagRe = /#|\^|\/|>|\{|&|=|!/;
  function parseTemplate(template, tags) {
    if (!template)
      return [];
    var lineHasNonSpace = false;
    var sections = [];
    var tokens = [];
    var spaces = [];
    var hasTag = false;
    var nonSpace = false;
    var indentation = "";
    var tagIndex = 0;
    function stripSpace() {
      if (hasTag && !nonSpace) {
        while (spaces.length)
          delete tokens[spaces.pop()];
      } else {
        spaces = [];
      }
      hasTag = false;
      nonSpace = false;
    }
    var openingTagRe, closingTagRe, closingCurlyRe;
    function compileTags(tagsToCompile) {
      if (typeof tagsToCompile === "string")
        tagsToCompile = tagsToCompile.split(spaceRe, 2);
      if (!isArray(tagsToCompile) || tagsToCompile.length !== 2)
        throw new Error("Invalid tags: " + tagsToCompile);
      openingTagRe = new RegExp(escapeRegExp(tagsToCompile[0]) + "\\s*");
      closingTagRe = new RegExp("\\s*" + escapeRegExp(tagsToCompile[1]));
      closingCurlyRe = new RegExp("\\s*" + escapeRegExp("}" + tagsToCompile[1]));
    }
    compileTags(tags || mustache.tags);
    var scanner = new Scanner(template);
    var start, type, value, chr, token, openSection;
    while (!scanner.eos()) {
      start = scanner.pos;
      value = scanner.scanUntil(openingTagRe);
      if (value) {
        for (var i = 0, valueLength = value.length; i < valueLength; ++i) {
          chr = value.charAt(i);
          if (isWhitespace(chr)) {
            spaces.push(tokens.length);
            indentation += chr;
          } else {
            nonSpace = true;
            lineHasNonSpace = true;
            indentation += " ";
          }
          tokens.push(["text", chr, start, start + 1]);
          start += 1;
          if (chr === "\n") {
            stripSpace();
            indentation = "";
            tagIndex = 0;
            lineHasNonSpace = false;
          }
        }
      }
      if (!scanner.scan(openingTagRe))
        break;
      hasTag = true;
      type = scanner.scan(tagRe) || "name";
      scanner.scan(whiteRe);
      if (type === "=") {
        value = scanner.scanUntil(equalsRe);
        scanner.scan(equalsRe);
        scanner.scanUntil(closingTagRe);
      } else if (type === "{") {
        value = scanner.scanUntil(closingCurlyRe);
        scanner.scan(curlyRe);
        scanner.scanUntil(closingTagRe);
        type = "&";
      } else {
        value = scanner.scanUntil(closingTagRe);
      }
      if (!scanner.scan(closingTagRe))
        throw new Error("Unclosed tag at " + scanner.pos);
      if (type == ">") {
        token = [type, value, start, scanner.pos, indentation, tagIndex, lineHasNonSpace];
      } else {
        token = [type, value, start, scanner.pos];
      }
      tagIndex++;
      tokens.push(token);
      if (type === "#" || type === "^") {
        sections.push(token);
      } else if (type === "/") {
        openSection = sections.pop();
        if (!openSection)
          throw new Error('Unopened section "' + value + '" at ' + start);
        if (openSection[1] !== value)
          throw new Error('Unclosed section "' + openSection[1] + '" at ' + start);
      } else if (type === "name" || type === "{" || type === "&") {
        nonSpace = true;
      } else if (type === "=") {
        compileTags(value);
      }
    }
    stripSpace();
    openSection = sections.pop();
    if (openSection)
      throw new Error('Unclosed section "' + openSection[1] + '" at ' + scanner.pos);
    return nestTokens(squashTokens(tokens));
  }
  function squashTokens(tokens) {
    var squashedTokens = [];
    var token, lastToken;
    for (var i = 0, numTokens = tokens.length; i < numTokens; ++i) {
      token = tokens[i];
      if (token) {
        if (token[0] === "text" && lastToken && lastToken[0] === "text") {
          lastToken[1] += token[1];
          lastToken[3] = token[3];
        } else {
          squashedTokens.push(token);
          lastToken = token;
        }
      }
    }
    return squashedTokens;
  }
  function nestTokens(tokens) {
    var nestedTokens = [];
    var collector = nestedTokens;
    var sections = [];
    var token, section;
    for (var i = 0, numTokens = tokens.length; i < numTokens; ++i) {
      token = tokens[i];
      switch (token[0]) {
        case "#":
        case "^":
          collector.push(token);
          sections.push(token);
          collector = token[4] = [];
          break;
        case "/":
          section = sections.pop();
          section[5] = token[2];
          collector = sections.length > 0 ? sections[sections.length - 1][4] : nestedTokens;
          break;
        default:
          collector.push(token);
      }
    }
    return nestedTokens;
  }
  function Scanner(string) {
    this.string = string;
    this.tail = string;
    this.pos = 0;
  }
  Scanner.prototype.eos = function eos() {
    return this.tail === "";
  };
  Scanner.prototype.scan = function scan(re) {
    var match = this.tail.match(re);
    if (!match || match.index !== 0)
      return "";
    var string = match[0];
    this.tail = this.tail.substring(string.length);
    this.pos += string.length;
    return string;
  };
  Scanner.prototype.scanUntil = function scanUntil(re) {
    var index = this.tail.search(re), match;
    switch (index) {
      case -1:
        match = this.tail;
        this.tail = "";
        break;
      case 0:
        match = "";
        break;
      default:
        match = this.tail.substring(0, index);
        this.tail = this.tail.substring(index);
    }
    this.pos += match.length;
    return match;
  };
  function Context(view, parentContext) {
    this.view = view;
    this.cache = { ".": this.view };
    this.parent = parentContext;
  }
  Context.prototype.push = function push(view) {
    return new Context(view, this);
  };
  Context.prototype.lookup = function lookup(name) {
    var cache = this.cache;
    var value;
    if (cache.hasOwnProperty(name)) {
      value = cache[name];
    } else {
      var context = this, intermediateValue, names, index, lookupHit = false;
      while (context) {
        if (name.indexOf(".") > 0) {
          intermediateValue = context.view;
          names = name.split(".");
          index = 0;
          while (intermediateValue != null && index < names.length) {
            if (index === names.length - 1)
              lookupHit = hasProperty(intermediateValue, names[index]) || primitiveHasOwnProperty(intermediateValue, names[index]);
            intermediateValue = intermediateValue[names[index++]];
          }
        } else {
          intermediateValue = context.view[name];
          lookupHit = hasProperty(context.view, name);
        }
        if (lookupHit) {
          value = intermediateValue;
          break;
        }
        context = context.parent;
      }
      cache[name] = value;
    }
    if (isFunction(value))
      value = value.call(this.view);
    return value;
  };
  function Writer() {
    this.templateCache = {
      _cache: {},
      set: function set(key, value) {
        this._cache[key] = value;
      },
      get: function get(key) {
        return this._cache[key];
      },
      clear: function clear() {
        this._cache = {};
      }
    };
  }
  Writer.prototype.clearCache = function clearCache() {
    if (typeof this.templateCache !== "undefined") {
      this.templateCache.clear();
    }
  };
  Writer.prototype.parse = function parse(template, tags) {
    var cache = this.templateCache;
    var cacheKey = template + ":" + (tags || mustache.tags).join(":");
    var isCacheEnabled = typeof cache !== "undefined";
    var tokens = isCacheEnabled ? cache.get(cacheKey) : void 0;
    if (tokens == void 0) {
      tokens = parseTemplate(template, tags);
      isCacheEnabled && cache.set(cacheKey, tokens);
    }
    return tokens;
  };
  Writer.prototype.render = function render(template, view, partials, config) {
    var tags = this.getConfigTags(config);
    var tokens = this.parse(template, tags);
    var context = view instanceof Context ? view : new Context(view, void 0);
    return this.renderTokens(tokens, context, partials, template, config);
  };
  Writer.prototype.renderTokens = function renderTokens(tokens, context, partials, originalTemplate, config) {
    var buffer = "";
    var token, symbol, value;
    for (var i = 0, numTokens = tokens.length; i < numTokens; ++i) {
      value = void 0;
      token = tokens[i];
      symbol = token[0];
      if (symbol === "#")
        value = this.renderSection(token, context, partials, originalTemplate, config);
      else if (symbol === "^")
        value = this.renderInverted(token, context, partials, originalTemplate, config);
      else if (symbol === ">")
        value = this.renderPartial(token, context, partials, config);
      else if (symbol === "&")
        value = this.unescapedValue(token, context);
      else if (symbol === "name")
        value = this.escapedValue(token, context, config);
      else if (symbol === "text")
        value = this.rawValue(token);
      if (value !== void 0)
        buffer += value;
    }
    return buffer;
  };
  Writer.prototype.renderSection = function renderSection(token, context, partials, originalTemplate, config) {
    var self = this;
    var buffer = "";
    var value = context.lookup(token[1]);
    function subRender(template) {
      return self.render(template, context, partials, config);
    }
    if (!value)
      return;
    if (isArray(value)) {
      for (var j = 0, valueLength = value.length; j < valueLength; ++j) {
        buffer += this.renderTokens(token[4], context.push(value[j]), partials, originalTemplate, config);
      }
    } else if (typeof value === "object" || typeof value === "string" || typeof value === "number") {
      buffer += this.renderTokens(token[4], context.push(value), partials, originalTemplate, config);
    } else if (isFunction(value)) {
      if (typeof originalTemplate !== "string")
        throw new Error("Cannot use higher-order sections without the original template");
      value = value.call(context.view, originalTemplate.slice(token[3], token[5]), subRender);
      if (value != null)
        buffer += value;
    } else {
      buffer += this.renderTokens(token[4], context, partials, originalTemplate, config);
    }
    return buffer;
  };
  Writer.prototype.renderInverted = function renderInverted(token, context, partials, originalTemplate, config) {
    var value = context.lookup(token[1]);
    if (!value || isArray(value) && value.length === 0)
      return this.renderTokens(token[4], context, partials, originalTemplate, config);
  };
  Writer.prototype.indentPartial = function indentPartial(partial, indentation, lineHasNonSpace) {
    var filteredIndentation = indentation.replace(/[^ \t]/g, "");
    var partialByNl = partial.split("\n");
    for (var i = 0; i < partialByNl.length; i++) {
      if (partialByNl[i].length && (i > 0 || !lineHasNonSpace)) {
        partialByNl[i] = filteredIndentation + partialByNl[i];
      }
    }
    return partialByNl.join("\n");
  };
  Writer.prototype.renderPartial = function renderPartial(token, context, partials, config) {
    if (!partials)
      return;
    var tags = this.getConfigTags(config);
    var value = isFunction(partials) ? partials(token[1]) : partials[token[1]];
    if (value != null) {
      var lineHasNonSpace = token[6];
      var tagIndex = token[5];
      var indentation = token[4];
      var indentedValue = value;
      if (tagIndex == 0 && indentation) {
        indentedValue = this.indentPartial(value, indentation, lineHasNonSpace);
      }
      var tokens = this.parse(indentedValue, tags);
      return this.renderTokens(tokens, context, partials, indentedValue, config);
    }
  };
  Writer.prototype.unescapedValue = function unescapedValue(token, context) {
    var value = context.lookup(token[1]);
    if (value != null)
      return value;
  };
  Writer.prototype.escapedValue = function escapedValue(token, context, config) {
    var escape = this.getConfigEscape(config) || mustache.escape;
    var value = context.lookup(token[1]);
    if (value != null)
      return typeof value === "number" && escape === mustache.escape ? String(value) : escape(value);
  };
  Writer.prototype.rawValue = function rawValue(token) {
    return token[1];
  };
  Writer.prototype.getConfigTags = function getConfigTags(config) {
    if (isArray(config)) {
      return config;
    } else if (config && typeof config === "object") {
      return config.tags;
    } else {
      return void 0;
    }
  };
  Writer.prototype.getConfigEscape = function getConfigEscape(config) {
    if (config && typeof config === "object" && !isArray(config)) {
      return config.escape;
    } else {
      return void 0;
    }
  };
  var mustache = {
    name: "mustache.js",
    version: "4.2.0",
    tags: ["{{", "}}"],
    clearCache: void 0,
    escape: void 0,
    parse: void 0,
    render: void 0,
    Scanner: void 0,
    Context: void 0,
    Writer: void 0,
    /**
     * Allows a user to override the default caching strategy, by providing an
     * object with set, get and clear methods. This can also be used to disable
     * the cache by setting it to the literal `undefined`.
     */
    set templateCache(cache) {
      defaultWriter.templateCache = cache;
    },
    /**
     * Gets the default or overridden caching object from the default writer.
     */
    get templateCache() {
      return defaultWriter.templateCache;
    }
  };
  var defaultWriter = new Writer();
  mustache.clearCache = function clearCache2() {
    return defaultWriter.clearCache();
  };
  mustache.parse = function parse2(template, tags) {
    return defaultWriter.parse(template, tags);
  };
  mustache.render = function render2(template, view, partials, config) {
    if (typeof template !== "string") {
      throw new TypeError('Invalid template! Template should be a "string" but "' + typeStr(template) + '" was given as the first argument for mustache#render(template, view, partials)');
    }
    return defaultWriter.render(template, view, partials, config);
  };
  mustache.escape = escapeHtml;
  mustache.Scanner = Scanner;
  mustache.Context = Context;
  mustache.Writer = Writer;
  var mustache_default = mustache;

  // src/lib/guid.ts
  var GUID = class _GUID {
    constructor(str) {
      __publicField(this, "str");
      this.str = str || _GUID.getNewGUIDString();
    }
    toString() {
      return this.str;
    }
    static getNewGUIDString() {
      let d = (/* @__PURE__ */ new Date()).getTime();
      if (window.performance && typeof window.performance.now === "function") {
        d += performance.now();
      }
      return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        let r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c == "x" ? r : r & 3 | 8).toString(16);
      });
    }
  };

  // src/lib/index.ts
  var _uuid, _vTree, _states, _bus, _eventCollector, _computeChildrenProps, computeChildrenProps_fn, _mount, mount_fn, _render, render_fn, _applyVisibilityProp, applyVisibilityProp_fn, _cleanNodeEvents, cleanNodeEvents_fn, _removeNodeEvents, removeNodeEvents_fn, _hardPatchNode, hardPatchNode_fn, _softPatchNode, softPatchNode_fn, _createDefaultNodeMap, createDefaultNodeMap_fn, _isSimilar, isSimilar_fn, _findAndPatchSimilars, findAndPatchSimilars_fn, _compareChildNodes, compareChildNodes_fn, _replaceVirtualChildren, replaceVirtualChildren_fn, _patchNodeLevel, patchNodeLevel_fn, _patchTree, patchTree_fn, _cleanTree, cleanTree_fn, _cleanEvent, cleanEvent_fn, _cleanEvents, cleanEvents_fn, _parseTree, parseTree_fn, _addEventCallback, addEventCallback_fn, _parseEvents, parseEvents_fn;
  var _Component = class _Component {
    constructor(props, components, parentNode, eventBus, template, viewService) {
      __privateAdd(this, _mount);
      __privateAdd(this, _render);
      __privateAdd(this, _applyVisibilityProp);
      __privateAdd(this, _cleanNodeEvents);
      __privateAdd(this, _removeNodeEvents);
      __privateAdd(this, _hardPatchNode);
      __privateAdd(this, _softPatchNode);
      __privateAdd(this, _createDefaultNodeMap);
      __privateAdd(this, _isSimilar);
      __privateAdd(this, _findAndPatchSimilars);
      __privateAdd(this, _compareChildNodes);
      __privateAdd(this, _replaceVirtualChildren);
      __privateAdd(this, _patchNodeLevel);
      __privateAdd(this, _patchTree);
      __privateAdd(this, _cleanTree);
      __privateAdd(this, _cleanEvent);
      __privateAdd(this, _cleanEvents);
      __privateAdd(this, _parseTree);
      __privateAdd(this, _addEventCallback);
      __privateAdd(this, _parseEvents);
      __privateAdd(this, _uuid, void 0);
      __publicField(this, "components", { [_Component.name]: _Component });
      __privateAdd(this, _vTree, void 0);
      __publicField(this, "parentNode");
      __publicField(this, "template");
      __publicField(this, "viewService");
      __privateAdd(this, _states, void 0);
      __privateAdd(this, _bus, void 0);
      __privateAdd(this, _eventCollector, void 0);
      __privateSet(this, _uuid, new GUID());
      this.components = components;
      this.parentNode = parentNode;
      this.template = template;
      const getDefaultView = (props2, changes) => Object.assign({}, props2, changes);
      this.viewService = viewService || getDefaultView;
      __privateSet(this, _bus, eventBus);
      __privateSet(this, _states, this.viewService(props));
      __privateSet(this, _vTree, /* @__PURE__ */ new Map());
      __privateSet(this, _eventCollector, /* @__PURE__ */ new Map());
      __privateMethod(this, _mount, mount_fn).call(this, __privateGet(this, _states));
    }
    static pluralize(num, words) {
      const str1 = words[0];
      const str2 = words[1];
      const str3 = words[2];
      if (num % 10 === 1 && num % 100 !== 11) {
        return str1;
      } else if (num % 10 >= 2 && num % 10 <= 4 && (num % 100 < 10 || num % 100 >= 20)) {
        return str2;
      }
      return str3;
    }
    getComponentId() {
      return __privateGet(this, _uuid);
    }
    isComponent(node) {
      if (!node || node.hasAttribute("x-component") === false)
        return false;
      const name = node.getAttribute("x-component");
      return Object.keys(this.components).some((key) => name === key);
    }
    /**
     * Public component methods
     */
    getState() {
      return __spreadValues({}, __privateGet(this, _states));
    }
    setState(changes) {
      if (typeof changes !== "object")
        return;
      let needReRender = Object.keys(changes).some((key) => {
        return __privateGet(this, _states).hasOwnProperty(key) === false || __privateGet(this, _states).hasOwnProperty(key) && __privateGet(this, _states)[key] !== changes[key];
      });
      if (needReRender === false) {
        return;
      }
      __privateSet(this, _states, this.viewService(__privateGet(this, _states), changes));
      __privateMethod(this, _patchTree, patchTree_fn).call(this, __privateGet(this, _states));
      this.updated(__privateGet(this, _states));
    }
    implose() {
      __privateMethod(this, _cleanEvents, cleanEvents_fn).call(this);
      __privateGet(this, _bus).$unbind(__privateGet(this, _uuid));
      __privateGet(this, _vTree).forEach((instance, uuid) => {
        instance.implose();
        __privateGet(this, _vTree).delete(uuid);
      });
      this.parentNode.innerHTML = "";
      this.destroyed();
    }
    $on(eventName, callback) {
      __privateGet(this, _bus).$on(`${eventName}`, __privateGet(this, _uuid), callback);
    }
    $emit(eventName, ...args) {
      __privateGet(this, _bus).$emit(`${eventName}`, ...args);
    }
    $un(eventName) {
      __privateGet(this, _bus).$un(`${eventName}`, __privateGet(this, _uuid));
    }
    mounted(props) {
    }
    updated(props) {
    }
    destroyed() {
    }
  };
  _uuid = new WeakMap();
  _vTree = new WeakMap();
  _states = new WeakMap();
  _bus = new WeakMap();
  _eventCollector = new WeakMap();
  _computeChildrenProps = new WeakSet();
  computeChildrenProps_fn = function(xKey, xValue, xIterator, props) {
    if (xKey === null || xValue === null || xIterator === null || !Array.isArray(props[xKey]))
      return props;
    return props[xKey].find((item) => String(item[xIterator]) === xValue);
  };
  _mount = new WeakSet();
  mount_fn = function(props) {
    __privateMethod(this, _render, render_fn).call(this, props);
    __privateMethod(this, _parseTree, parseTree_fn).call(this, props);
    __privateMethod(this, _parseEvents, parseEvents_fn).call(this, props);
    this.mounted(props);
  };
  _render = new WeakSet();
  render_fn = function(view) {
    this.parentNode.innerHTML = mustache_default.render(this.template, view);
  };
  _applyVisibilityProp = new WeakSet();
  applyVisibilityProp_fn = function(props) {
    if (props !== null && typeof props === "object" && props.hasOwnProperty("hidden") && typeof props.hidden === "boolean") {
      const display = props && props.display || "block";
      this.parentNode.style.display = props.hidden === false ? display : "none";
    }
  };
  _cleanNodeEvents = new WeakSet();
  cleanNodeEvents_fn = function(domNode) {
    const codes = domNode.getAttribute("x-event-binded");
    if (codes === null)
      return;
    const codesArr = codes.split(",").map((item) => item.trim());
    codesArr.forEach((code) => {
      const callback = __privateGet(this, _eventCollector).get(code);
      if (callback === void 0)
        return;
      __privateMethod(this, _cleanEvent, cleanEvent_fn).call(this, code, callback);
    });
  };
  _removeNodeEvents = new WeakSet();
  removeNodeEvents_fn = function(node) {
    if (node.hasAttribute("x-event-binded")) {
      __privateMethod(this, _cleanNodeEvents, cleanNodeEvents_fn).call(this, node);
    }
    const elementsWithEvents = node.querySelectorAll("[x-event-binded]");
    for (const element of elementsWithEvents) {
      __privateMethod(this, _cleanNodeEvents, cleanNodeEvents_fn).call(this, element);
    }
  };
  _hardPatchNode = new WeakSet();
  hardPatchNode_fn = function(domNode, virtualNode, props) {
    const parent = domNode.parentNode;
    const addNodeEvents = (node, props2, cyclingScope = false) => {
      const eventName = node.getAttribute("x-event");
      const callbackName = node.getAttribute("x-on");
      if (eventName && callbackName)
        __privateMethod(this, _addEventCallback, addEventCallback_fn).call(this, node, props2, eventName, callbackName);
      if (cyclingScope)
        return;
      const elementsWithEvents = node.querySelectorAll(`[x-on][x-event]`);
      for (const element of elementsWithEvents) {
        addNodeEvents(element, props2, true);
      }
    };
    __privateMethod(this, _removeNodeEvents, removeNodeEvents_fn).call(this, domNode);
    parent == null ? void 0 : parent.replaceChild(virtualNode, domNode);
    addNodeEvents(virtualNode, props);
  };
  _softPatchNode = new WeakSet();
  softPatchNode_fn = function(domNode, virtualNode, props) {
    const getAttributeNames = (node) => {
      const rv = {};
      if (node.children.length === 0) {
        rv["textContent"] = node.textContent;
      }
      const attrs = node.attributes;
      for (let index = 0; index < attrs.length; ++index) {
        rv[attrs[index].nodeName] = attrs[index].value;
      }
      return rv;
    };
    const domAttrs = getAttributeNames(domNode);
    const vAttrs = getAttributeNames(virtualNode);
    Object.keys(vAttrs).forEach((attrKey) => {
      const newValue = vAttrs[attrKey];
      const oldValue = domAttrs[attrKey];
      if (newValue !== oldValue) {
        if (attrKey === "textContent") {
          domNode.textContent = newValue;
        } else {
          domNode.setAttribute(attrKey, newValue);
        }
      }
    });
    if (domNode.hasAttribute("x-event-binded")) {
      __privateMethod(this, _cleanNodeEvents, cleanNodeEvents_fn).call(this, domNode);
      const eventName = domNode.getAttribute("x-event");
      const callbackName = domNode.getAttribute("x-on");
      __privateMethod(this, _addEventCallback, addEventCallback_fn).call(this, domNode, props, eventName, callbackName);
    }
  };
  _createDefaultNodeMap = new WeakSet();
  createDefaultNodeMap_fn = function(collection) {
    const map = /* @__PURE__ */ new Map();
    for (const node of collection) {
      map.set(node, false);
    }
    return map;
  };
  _isSimilar = new WeakSet();
  isSimilar_fn = function(firstNode, secondNode) {
    if (firstNode.nodeName !== secondNode.nodeName)
      return false;
    if (firstNode.className === secondNode.className || firstNode.className.includes(secondNode.className) || secondNode.className.includes(firstNode.className))
      return true;
    return false;
  };
  _findAndPatchSimilars = new WeakSet();
  findAndPatchSimilars_fn = function(realNode, virtuals, props) {
    let found = false;
    virtuals.forEach((status, virtualNode) => {
      if (status === true || found === true)
        return;
      if (__privateMethod(this, _isSimilar, isSimilar_fn).call(this, realNode, virtualNode)) {
        __privateMethod(this, _patchNodeLevel, patchNodeLevel_fn).call(this, realNode, virtualNode, props);
        found = true;
        virtuals.set(virtualNode, true);
      }
    });
    return found;
  };
  _compareChildNodes = new WeakSet();
  compareChildNodes_fn = function(realChildren, virtualChildren, parentNode, props) {
    const realChildenMap = __privateMethod(this, _createDefaultNodeMap, createDefaultNodeMap_fn).call(this, realChildren);
    const virtualChildrenMap = __privateMethod(this, _createDefaultNodeMap, createDefaultNodeMap_fn).call(this, virtualChildren);
    realChildenMap.forEach((status, node) => {
      const found = __privateMethod(this, _findAndPatchSimilars, findAndPatchSimilars_fn).call(this, node, virtualChildrenMap, props);
      if (found === true) {
        realChildenMap.set(node, true);
      }
    });
    realChildenMap.forEach((status, node) => {
      if (status === false) {
        if (node.hasAttribute("x-event-binded")) {
          __privateMethod(this, _cleanNodeEvents, cleanNodeEvents_fn).call(this, node);
        }
        node.remove();
      }
    });
    let idx = 0;
    virtualChildrenMap.forEach((status, node) => {
      if (status === false) {
        const sibling = realChildren[idx];
        if (sibling === null)
          parentNode.appendChild(node);
        else
          parentNode.insertBefore(node, sibling);
      }
      idx = idx + 1;
    });
  };
  _replaceVirtualChildren = new WeakSet();
  replaceVirtualChildren_fn = function(domNode, virtualNode, props) {
    const uuidStringAttr = domNode.getAttribute("x-tree-bound");
    if (uuidStringAttr !== null) {
      const instance = __privateGet(this, _vTree).get(uuidStringAttr);
      if (instance) {
        instance.implose();
        __privateGet(this, _vTree).delete(uuidStringAttr);
      }
    }
    const componentName = virtualNode.getAttribute("x-component");
    if (domNode.parentNode) {
      domNode.parentNode.replaceChild(virtualNode, domNode);
    }
    if (componentName !== null) {
      const _Component2 = this.components[componentName];
      if (!_Component2 || !domNode.parentNode)
        return;
      const instance = new _Component2(props, this.components, domNode.parentNode, __privateGet(this, _bus));
      __privateGet(this, _vTree).set(`${instance.getComponentId().toString()}`, instance);
    }
  };
  _patchNodeLevel = new WeakSet();
  patchNodeLevel_fn = function(realNode, virtualNode, props) {
    if (realNode.children.length === 0 && virtualNode.children.length === 0) {
      if (this.isComponent(virtualNode) === true || this.isComponent(realNode) === true) {
        const realNodeComponentName = realNode.getAttribute("x-component");
        const virtualNodeComponentName = virtualNode.getAttribute("x-component");
        if (realNodeComponentName !== virtualNodeComponentName)
          __privateMethod(this, _replaceVirtualChildren, replaceVirtualChildren_fn).call(this, realNode, virtualNode, props);
        return;
      }
      __privateMethod(this, _softPatchNode, softPatchNode_fn).call(this, realNode, virtualNode, props);
      return;
    } else if (realNode.children.length > 0 && virtualNode.children.length > 0) {
      __privateMethod(this, _compareChildNodes, compareChildNodes_fn).call(this, realNode.children, virtualNode.children, realNode, props);
    } else {
      __privateMethod(this, _hardPatchNode, hardPatchNode_fn).call(this, realNode, virtualNode, props);
    }
  };
  _patchTree = new WeakSet();
  patchTree_fn = function(props) {
    __privateMethod(this, _applyVisibilityProp, applyVisibilityProp_fn).call(this, props);
    const compiledTemplate = mustache_default.render(this.template, props);
    const renderer = new DOMParser();
    const memoizedPatch = renderer.parseFromString(compiledTemplate, "text/html");
    const virtualNode = memoizedPatch.documentElement.querySelector("body");
    if (virtualNode === null) {
      return;
    }
    __privateMethod(this, _compareChildNodes, compareChildNodes_fn).call(this, this.parentNode.children, virtualNode.children, this.parentNode, props);
  };
  _cleanTree = new WeakSet();
  cleanTree_fn = function() {
    __privateGet(this, _vTree).forEach((instance, key) => {
      var _a;
      __privateMethod(_a = instance, _cleanTree, cleanTree_fn).call(_a);
      __privateGet(this, _vTree).delete(key);
    });
  };
  _cleanEvent = new WeakSet();
  cleanEvent_fn = function(key, callback) {
    const element = this.parentNode.querySelector(`[x-event-binded=${key}]`);
    if (element === null)
      return;
    const event = key.split("_")[0];
    element.removeEventListener(event, callback);
    __privateGet(this, _eventCollector).delete(key);
  };
  _cleanEvents = new WeakSet();
  cleanEvents_fn = function() {
    __privateGet(this, _eventCollector).forEach(
      (callback, key) => __privateMethod(this, _cleanEvent, cleanEvent_fn).call(this, key, callback)
    );
  };
  _parseTree = new WeakSet();
  parseTree_fn = function(props) {
    __privateMethod(this, _applyVisibilityProp, applyVisibilityProp_fn).call(this, props);
    Object.keys(this.components).forEach((name) => {
      var _a;
      const elements = this.parentNode.querySelectorAll(`[x-component=${name}]:not([x-tree-bound]) `);
      if (elements.length === 0)
        return;
      const _Component2 = this.components[name];
      for (const element of elements) {
        const xKey = element.getAttribute("x-object-key");
        const xValue = element.getAttribute("x-object-value");
        const xIterator = element.getAttribute("x-object-iterator");
        const propsCopy = __spreadValues({}, props);
        if (propsCopy.hasOwnProperty("hidden"))
          delete propsCopy["hidden"];
        const childProps = __privateMethod(_a = _Component, _computeChildrenProps, computeChildrenProps_fn).call(_a, xKey, xValue, xIterator, propsCopy);
        if (childProps === void 0) {
          console.warn("Attention! Jet Surging!\n Cant find children props!", xKey, xValue, xIterator, props);
          continue;
        }
        const instance = new _Component2(childProps, this.components, element, __privateGet(this, _bus));
        const uuid = instance.getComponentId();
        element.setAttribute("x-tree-bound", uuid);
        __privateGet(this, _vTree).set(uuid.toString(), instance);
      }
    });
  };
  _addEventCallback = new WeakSet();
  addEventCallback_fn = function(element, props, eventName, callbackName) {
    if (eventName === null || callbackName === null) {
      console.warn(`Attention! Jet Surging!

        Cant find one of event bound attributes!

        x-event: ${eventName}

        x-on: ${callbackName}

      `, element, props);
      return;
    }
    let callback = this[callbackName];
    if (callback === void 0) {
      console.warn(`Attention! Jet Surging!
 
        Cant find component callback method ${callbackName} for event ${eventName} on template element!
      `, element, props);
      return;
    }
    callback = callback.bind(this, props);
    element.addEventListener(eventName, callback);
    const eventCode = `${eventName}_${__privateGet(this, _uuid).toString()}`;
    element.setAttribute("x-event-binded", eventCode);
    __privateGet(this, _eventCollector).set(eventCode, callback);
  };
  _parseEvents = new WeakSet();
  parseEvents_fn = function(props) {
    const elements = this.parentNode.querySelectorAll(`[x-on][x-event]:not([x-event-binded])`);
    for (const element of elements) {
      const eventName = element.getAttribute("x-event");
      const callbackName = element.getAttribute("x-on");
      __privateMethod(this, _addEventCallback, addEventCallback_fn).call(this, element, props, eventName, callbackName);
    }
  };
  __privateAdd(_Component, _computeChildrenProps);
  var Component = _Component;
})();
/*! Bundled license information:

mustache/mustache.mjs:
  (*!
   * mustache.js - Logic-less {{mustache}} templates with JavaScript
   * http://github.com/janl/mustache.js
   *)
*/
//# sourceMappingURL=bundle.js.map
