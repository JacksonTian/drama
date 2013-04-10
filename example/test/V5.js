/*global $, _, getStorage, Scape, EventProxy, history*/
/**
 * ```
 * V5.js 0.2.0
 * http://html5ify.com
 * (c) 2011-2013 Jackson Tian
 * V5 may be freely distributed under the MIT license
 * ```
 */
(function (global) {

  /**
   * The Framework's top object. all components will be register under it.
   * Why named as V5, we salute the V8 project.
   * The voice means it contains power in Chinese also.
   */
  var V5 = global.V5 = new EventProxy();

  var $ = window.jQuery || window.Zepto;

  /**
   * 默认选项
   */
  V5.options = {
    // Debug mode. If debug is true, don't cache anything
    debug: false,
    // 资源版本，如果服务端静态资源有更改，修改它可以用于客户端静态资源的更新
    // 如果debug模式开启，静态资源将会每次更新
    version: '',
    // Assets resources path prefix
    prefix: '',
    // 是否预加载
    preload: true,
    // 主卡片页，用于启用应用时打开的页面
    main: "index"
  };

  /**
   * ## Card定义
   */

  /**
   * 卡片页定义，每个卡片页具有声明周期，在初始化、收缩、重打开、销毁时分别调用。
   */
  var Card = function (module) {
    /**
     * The Initialize method.
     */
    this.initialize = function () {};

    /**
     * The Shrink method, will be invoked when hide current card.
     */
    this.shrink = function () {};

    /**
     * The Reappear method, when card reappear after shrink, this function will be invoked.
     */
    this.reappear = function () {};

    /**
     * The Destroy method, should be invoked manually when necessary.
     */
    this.destroy = function () {};

    /**
     * Parameters, store the parameters, for check the card whether changed.
     */
    this.parameters = null;

    /**
     * Flag whether enable localization.
     */
    this.enableL10N = false;

    // Merge the module's methods
    _.extend(this, module);
  };

  // Mixin the eventproxy's prototype
  _.extend(Card.prototype, EventProxy.prototype);

  /**
   * Open an another card from current column or next column.
   * @param blank Indicate whether open another card from next column.
   */
  Card.prototype.openCard = function (hash, blank) {
    var effectColumn;
    if (blank) {
      effectColumn = this.columnIndex + 1;
    } else {
      effectColumn = this.columnIndex;
    }
    var args = hash.split("/");
    var cardName = args.shift();
    V5.trigger("openCard", cardName, effectColumn, args, this.viewport);
  };

  Card.prototype.show = function (previous, callback) {
    if (previous) {
      previous.node.css('display', 'none');
    }
    this.node.css('display', 'block');
    callback();
  };

  /**
   * Open a viewport and display a card.
   */
  Card.prototype.openViewport = function (hash) {
    var args = hash.split("/");
    var cardName  = args.shift();
    var viewport = $("<div></div>").addClass("viewport");
    body.append(viewport);
    V5.trigger("openCard", cardName, 0, args, viewport);
  };

  /**
   * Destroy current card and close current viewport.
   */
  Card.prototype.closeViewport = function () {
    this.destroy();
    this.unbind();
    this.node.remove();
    delete this.node;
    this.initialized = false;
    this.viewport.remove();
    delete this.viewport;
  };

  /**
   * Post message to current Card.
   */
  Card.prototype.postMessage = function (event, data) {
    return this.trigger("card:" + event, data);
  };

  /**
   * Bind message event.
   */
  Card.prototype.onMessage = function (event, callback) {
    return this.bind("card:" + event, callback);
  };

  /**
   * Define a card component. Card will be displayed in a view colomn.
   * @param {Function} module Module object.
   */
  V5.Card = Card;

  /**
   * Lets callback execute at a safely moment.
   * @param {function} callback The callback method that will execute when document is ready.
   */
  V5.ready = function (callback) {
    if (document.readyState === "complete") {
      callback();
    } else {
      var ready = function () {
        if (document.readyState === "complete") {
          callback();
          // Remove the callback listener from readystatechange event.
          document.removeEventListener("readystatechange", ready);
        }
      };
      //  Bind callback to readystatechange
      document.addEventListener("readystatechange", ready);
    }
  };

  /**
   * Gets the V5 mode, detects the V5 runing in which devices.
   * There are two modes current, phone or tablet.
   */
  V5.mode = window.innerWidth < 768 ? "phone" : "tablet";

  // 全局body对象
  var body = $("body");

  /**
   * Default viewport reference. Viewport could contains many view columns, it's detected by mode.
   */
  V5.viewport = null;

  // Hide address bar
  // Must called when ready
  V5.hideAddressBar = function () {
    body.css("height", window.innerHeight + 60);
    window.scrollTo(0, 0);
    body.css("height", window.innerHeight);
  };

  /**
   * Startups V5 framework.
   */
  V5.init = function (options) {
    // 更新选项设置
    _.extend(V5.options, options);
    V5.ready(function () {
      V5.hideAddressBar();
      V5.viewport = $("#container");
      V5.setOrientation();
      // Disable touch move events for integrate with iScroll.
      window.addEventListener("touchmove", function (e) {e.preventDefault(); }, false);
      // Use popstate to handle history go/back.
      window.addEventListener('popstate', function (event) {
        var params = event.state;
        if (params) {
          var args = params.split("/");
          var currentHash = args.shift();
          console.log("Hash Changed: " + currentHash);
          if (V5.hashHistory.length) {
            console.log(V5.hashHistory);
            if (currentHash !== undefined) {
              var topHash = _.map(V5.hashMap, function (val) {
                return _.last(val);
              });
              if (_.include(topHash, params)) {
                console.log("changed, but no action.");
              } else {
                var hashStack = _.compact(_.map(V5.hashMap, function (val, key) {
                  return _.include(val, currentHash) ? key : null;
                }));
                console.log(hashStack);
                V5.hashMap[hashStack[0]].pop();
                V5.trigger("openCard", currentHash, V5.columns.indexOf(hashStack[0]));
                console.log("Forward or back");
              }
            }
          }
        }
      }, false);

      // Handle refresh case or first visit.
      // if (V5.hashHistory.length === 0) {
        // var map = V5.hashMap;
        // if (_.size(map)) {
            // // Restore view from session.
            // console.log("Restore from session.");
            // V5.restoreViews();
        // } else {
            // Init card.
          console.log("Init card.");
          V5.initCard();
        // }
      // }
    });

    // preload card file
    if (V5.options.preload) {
      setTimeout(function () {
        V5.preloadCard();
      }, 100);
    }
  };

  /**
   * Handle orient change events.
   */
  V5.setOrientation = function () {
    var _setOrientation = function (event) {
      var orient;
      if ("orientation" in window) {
        orient = Math.abs(window.orientation) === 90 ? 'landscape' : 'portrait';
      } else {
        var doc = document.documentElement;
        orient = 1.1 > doc.clientWidth / doc.clientHeight ? "portrait": "landscape";
      }
      var aspect = orient === 'landscape' ? 'portrait' : 'landscape';
      body.removeClass(aspect).addClass(orient);
      V5.trigger('orientationchange', orient);
    };
    _setOrientation();
    window.addEventListener('orientationchange', _setOrientation, false);
  };

  /**
   * Cache the card html.
   */
  V5._cardCache = {};

  /**
   * Predefined view columns.
   */
  V5.columns = ["alpha", "beta", "gamma"];

  /**
   * Predefined viewport's state.
   */
  V5.columnModes = ["single", "double", "triple"];

  V5.bind("openCard", function (cardName, effectColumn, args, viewport) {
    if (V5.mode === "phone") {
      effectColumn = 0;
    }
    args = args || [];
    viewport = viewport || V5.viewport;
    V5.displayCard(cardName, effectColumn, args, viewport);
    var hash = [cardName].concat(args).join("/");
    history.pushState(hash, cardName, "#" + hash);
  });

  /**
   * Initializes views when first time visit.
   */
  V5.initCard = function () {
    V5.trigger("openCard", V5.options.main, 0);
  };

  /**
   * Restores views from session storage.
   */
  V5.restoreViews = function () {
    var map = V5.hashMap;
    console.log(map);
    _.each(map, function (viewNames, columnName) {
      var hash = viewNames.pop();
      var args = hash.split("/");
      V5.trigger("openCard", args.shift(), _.indexOf(V5.columns, columnName), args, V5.viewport);
    });
  };

  /**
   * Gets Card from cache or server. If the card file comes from server,
   * the callback will be executed async, and cache it.
   * @param {string} cardName Card name.
   * @param {function} callback Callback function, will be called after got the card from cache or server.
   */
  V5.getCard = function (cardName, callback) {
    var _cardCache = V5._cardCache;
    var card = V5._cards[cardName];
    var proxy = new EventProxy();
    proxy.all("l10n", "card", function (l10n, card) {
      var html = l10n ? V5.localize(card, l10n) : card;
      card.resources = l10n;
      callback($($.trim(html)));
    });

    if (_cardCache[cardName]) {
      proxy.trigger("card", _cardCache[cardName]);
    } else {
      var url = V5.options.prefix + "cards/" + cardName + ".html?_=";
      url += V5.options.debug ? new Date().getTime() : V5.options.version;
      $.get(url, function (text) {
        // Save into cache.
        _cardCache[cardName] = text;
        proxy.trigger("card", _cardCache[cardName]);
      });
    }

    // Fetch the localize resources.
    // enableL10N Flag whether this card's localization enabled.
    // If true, will generate card with localization resources.
    if (card.enableL10N) {
      V5.fetchL10N(cardName, function () {
        proxy.trigger("l10n", V5.L10N[V5.langCode][cardName]);
      });
    } else {
      proxy.trigger("l10n", null);
    }
  };

  /**
   * Preload all card files
   */
  V5.preloadCard = function () {
    var loaded = V5._cardCache;
    var all = V5._cards;
    var unloaded = [];
    for (var name in all) {
      if (!loaded.hasOwnProperty(name)) {
        unloaded.push(name);
      }
    }
    var continueLoad = function () {
      var name = unloaded.shift();
      if (name) {
        V5.getCard(name, continueLoad);
      }
    };
    continueLoad();
  };

  /**
   * 切换卡片页
   */
  V5.switchCard = function (next, callback) {
    var previous = V5.currentCard;
    // 如果前一张card与要打开的不是同一张card，收起它
    if (previous) {
      previous.shrink();
    }
    next.show(previous, callback);
    V5.currentCard = next;
  };

  /**
   * Display card in view column.
   * @private
   * @param {string} hash Card hash, card name.
   * @param {number} effectColumn View column's index.
   * @param {array} args Parameters of view.
   * @param {object} viewport Which viewport, if don't set, will use default viewport.
   */
  V5.displayCard = function (hash, effectColumn, args, viewport) {
    var columnName = V5.columns[effectColumn];
    var column = viewport.find("." + columnName);
    if (column.size() < 1) {
      // 在新的viewport中打开时
      column = $("<div></div>").addClass(columnName);
      viewport.append(column);
    }

    var card = V5._cards[hash];
    if (!card) {
      throw new Error(hash + " module doesn't be defined.");
    }

    // 记录到历史中，供重新打开应用时恢复
    if (viewport === V5.viewport) {
      if (V5.hashMap[columnName]) {
        V5.hashMap[columnName].push([hash].concat(args).join("/"));
      } else {
        V5.hashMap[columnName] = [[hash].concat(args).join("/")];
      }
      V5.hashHistory.push([hash].concat(args));
    }

    V5.getCard(hash, function (node) {
      if (viewport === V5.viewport) {
        viewport.attr("class", V5.columnModes[_.size(V5.hashMap) - 1]);
      }
      card.columnIndex = _.indexOf(V5.columns, columnName);

      // 首次初始化
      if (!card.initialized) {
        card.node = node;
        column.append(node);
        card.initialized = true;
        // 隐藏前一张卡片
        V5.switchCard(card, function () {
          card.initialize.apply(card, args);
        });
      } else if (card.parameters.toString() !== args.toString()) {
        // 打开时参数不同
        card.destroy();
        card.node.remove();
        card.node = node;
        column.append(node);
        // 隐藏前一张卡片
        V5.switchCard(card, function () {
          card.initialize.apply(card, args);
        });
      } else {
      // 重新打开
        // 隐藏前一张卡片
        V5.switchCard(card, function () {
          card.reappear();
        });
      }
      
      // 传递参数和viewport对象
      card.parameters = args;
      card.viewport = viewport;
    });
  };

  /**
   * ## History
   */
  /**
   * History implementation. Stores history actions.
   */
  V5.hashHistory = [];

  /**
   * Store hash and keep in session storage.
   */
  V5.hashMap = (function () {
    var session = getStorage("session");
    var hashMap = session.get("hashMap");
    if (!hashMap) {
      hashMap = {};
    } else {
      session.remove("hashMap");
    }
    // Save hash state into session storeage when unload page
    $(window).bind("unload", function () {
      session.put("hashMap", V5.hashMap);
    });
    return hashMap;
  }());

  /**
   * ## View
   */
  /**
   *
   */
  var View = function (el) {
    this.el = $(el);
  };
  _.extend(View.prototype, EventProxy.prototype);
  // Cached regex to split keys for `delegate`.
  var eventSplitter = /^(\S+)\s*(.*)$/;
  V5.supportTouch = "ontouchend" in document;

  View.prototype.method = function (eventName) {
    var that = this;
    return function () {
      that.emit.apply(that, [eventName].concat([].slice.call(arguments, 0)));
    };
  };

  View.prototype.$ = function (selector) {
    return this.el.find(selector);
  };

  // Set callbacks, where `this.callbacks` is a hash of
  /**
   * ```
   *  {"event selector": "callback"}
   *
   *  {
   *    'mousedown .title':  'edit',
   *    'click .button':     'save'
   *  }
   * ```
   * pairs. Callbacks will be bound to the view, with `this` set properly.
   * Uses event delegation for efficiency.
   * Omitting the selector binds the event to `this.el`.
   * This only works for delegate-able events: not `focus`, `blur`, and
   * not `change`, `submit`, and `reset` in Internet Explorer.
   */
  View.prototype.delegateEvents = function (events) {
    if (!(events || (events = this.events))) {
      return;
    }
    if (_.isFunction(events)) {
      events = events.call(this);
    }
    var that = this;
    this.el.unbind('.delegateEvents');
    var ignores = {
      'swipe': 'click',
      'swipeLeft': 'click', 
      'swipeRight': 'click', 
      'swipeUp': 'click',
      'swipeDown': 'click'
    };
    var fallback = {
      'tap': 'click',
      'singleTap': 'click',
      'doubleTap': 'dblclick',
      'longTap': 'click'
    };
    for (var key in events) {
      var match = key.match(eventSplitter);
      var eventName = match[1], selector = match[2];
      if (!V5.supportTouch) {
        eventName = fallback[eventName] || eventName;
        if (ignores.hasOwnProperty(eventName)) {
          // 在PC上忽略掉不支持的事件
          continue;
        }
      }
      var method = that.method(events[key]);
      eventName += '.delegateEvents';
      if (selector === '') {
        this.el.bind(eventName, method);
      } else {
        this.el.delegate(selector, eventName, method);
      }
    }
  };

  /**
   * undelegate all events
   */
  View.prototype.undelegateEvents = function () {
    $(this.el).unbind();
  };

  /**
   * A factory method to generate View object. Packaged on Backbone.View.
   * @param {node} node a $(Zepto/jQuery) element node.
   * @returns {View} View object, based on Backbone.View.
   */
  V5.View = function (el) {
    return new View(el);
  };

  // Card defined
  /**
   * Card namespace. All card module will be stored at here.
   * @private
   */
  V5._cards = {};

  /**
   * Register a card to V5.
   * @param {string} name Card id, used as key/path, V5 framework find card element by this name
   * @param {function} The module object.
   */
  V5.registerCard = function (name, module) {
    if (typeof module === "function") {
      var card = new V5.Card(module());
      card.name = name;
      V5._cards[name] = card;
    }
  };

  /**
   * ## Common Module
   */
  V5._modules = {};

  /**
   * Register a common module.
   */
  V5.registerModule = function (moduleId, module) {
    V5._modules[moduleId] = module;
  };

  /**
   * Call a common module.
   */
  V5.Card.prototype.invoke = function (moduleId) {
    var module = V5._modules[moduleId];
    if (module) {
      var args = [].slice.call(arguments, 1);
      return module.apply(this, args);
    } else {
      throw new Error(moduleId + " Module doesn't exist");
    }
  };

  /**
   * ## Localization
   */
  /**
   * Local code.
   */
  V5.langCode = "en-US";

  /**
   * All localization resources will be stored at here by locale code.
   * Localization resources namespace.
   */
  V5.L10N = {};

  /**
   * Gets localization resources by card name.
   * @param {string} cardName Card name
   * @param {function} callback Callback that will be invoked when sources is got.
   */
  V5.fetchL10N = function (cardName, callback) {
    var code = V5.langCode;
    var url = V5.options.prefix + "languages/" + cardName + "_" + code + ".lang?_=";
    url += V5.options.debug ? new Date().getTime() : V5.options.version;
    $.getJSON(url, function (data) {
      // Sets l10n resources to V5.L10N
      V5.L10N[code] = V5.L10N[code] || {};
      _.extend(V5.L10N[code], data);
      callback(V5.L10N[code]);
    });
  };

  /**
   * A wrapper method to localize template with the resources
   * @param {String} tpl template string.
   * @param {Object} resources resources object.
   * @returns rendered html string.
   */
  V5.localize = function (tpl, resources) {
    var settings = {
      interpolate : /\{\{(.+?)\}\}/g
    };
    return _.template(tpl, resources, settings);
  };

  /**
   * ## Message mechanism
   */
  /**
   * V5 message mechanism.
   */
  V5.postMessage = function (hash, event, data) {
    var card = V5._cards[hash];
    if (card) {
      card.postMessage(event, data);
    }
  };

  /**
   * ## Model
   */
  /**
   * V5 model layer.
   */
  V5.Model = new Scape();
}(window));
