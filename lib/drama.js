/*global EventProxy, _, Land, Landscape, Scape*/
!(function () {
  // 全局对象
  var root = this;
  var $ = root.jQuery || root.Zepto;
  var noop = function () {};

  // 主对象: 戏剧
  var drama = new EventProxy();

  drama.options = {
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
    main: "index",
    // 侧边栏
    sidebar: ""
  };

  drama._acts = {};
  // 添加幕
  drama.addAct = function (name, module) {
    var act = new Act(module());
    act.name = name;
    drama._acts[name] = act;
    return this;
  };

  drama._actsCache = {};

  // 获取幕HTML文件
  drama.getAct = function (name, callback) {
    var _actsCache = drama._actsCache;

    if (_actsCache[name]) {
      callback($(_actsCache[name]));
    } else {
      var url = drama.options.prefix + "html/" + name + ".html?_=";
      url += drama.options.debug ? new Date().getTime() : drama.options.version;
      $.get(url, function (text) {
        // Save into cache.
        _actsCache[name] = $.trim(text);
        callback($(_actsCache[name]));
      });
    }
  };

  /**
   * Preload all card files
   */
  drama.preloadActs = function () {
    var loaded = drama._actsCache;
    var all = drama._acts;
    var unloaded = [];
    for (var name in all) {
      if (!loaded.hasOwnProperty(name)) {
        unloaded.push(name);
      }
    }
    var continueLoad = function () {
      var name = unloaded.shift();
      if (name) {
        drama.getAct(name, continueLoad);
      }
    };
    continueLoad();
  };

  /**
   * 切换卡片页
   * 设计思路是所有页面切换的逻辑由新打开的页面来决定如何打开新页和关闭旧页
   */
  drama.switchAct = function (next, callback) {
    var previous = drama.currentAct;
    // 如果前一张card与要打开的不是同一张card，收起它
    if (previous) {
      drama.trigger('shrink', previous);
      previous.shrink();
    }
    next.show(previous, callback);
    drama.currentAct = next;
  };

  // ## 幕
  var Act = function (module) {
    this._actors = {};
    _.extend(this, module);
  };
  // 继承事件
  _.extend(Act.prototype, EventProxy.prototype);
  Act.prototype.addActor = function (name, actor) {
    actor.name = name;
    this._actors[name] = actor;
    return this;
  };
  Act.prototype.initialize = noop;
  Act.prototype.shrink = noop;
  Act.prototype.reappear = noop;
  Act.prototype.destroy = noop;
  Act.prototype.show = function (previous, callback) {
    if (previous) {
      previous.node.css('display', 'none');
    }
    this.node.css('display', 'block');
    callback();
  };

  // Hide address bar
  // Must called when ready
  drama.hideAddressBar = function () {
    // 非全屏模式时
    if (!navigator.standalone) {
      var body = $('body');
      body.css("height", window.innerHeight + 60);
      window.scrollTo(0, 0);
      body.css("height", window.innerHeight);
    }
  };

  // ## networking
  // 监听网络
  var net = Scape.sample();
  window.addEventListener("online", function () {
    net.set(navigator.onLine);
  }, false);
  window.addEventListener("offline", function () {
    net.set(navigator.onLine);
  }, false);
  // 默认执行一次
  net.set(navigator.onLine);
  drama.net = net;

  // ## 方向
  // 将朝向的改变告知当前幕
  drama.on('orientationchange', function (orient) {
    if (drama.currentAct) {
      drama.currentAct.trigger('orientationchange', orient);
    }
  });

  drama.setOrientation = function () {
    var body = $('body');
    var _setOrientation = function () {
      var orient;
      if ("orientation" in window) {
        orient = Math.abs(window.orientation) === 90 ? 'landscape' : 'portrait';
      } else {
        var doc = document.documentElement;
        orient = 1.1 > doc.clientWidth / doc.clientHeight ? "portrait": "landscape";
      }
      var aspect = orient === 'landscape' ? 'portrait' : 'landscape';
      body.removeClass(aspect).addClass(orient);
      if (body.data('orient') !== orient) {
        body.data('orient', orient);
        drama.trigger('orientationchange', orient);
      }
    };
    _setOrientation();
    window.addEventListener('orientationchange', _setOrientation, false);
  };

  drama.init = function (opts) {
    _.extend(drama.options, opts);
    drama.setOrientation();
    // Disable touch move events for integrate with iScroll.
    window.addEventListener("touchmove", function (e) {e.preventDefault(); }, false);
    window.addEventListener("doubletap", function () {
      drama.hideAddressBar();
    }, false);
    drama.hideAddressBar();
    drama.initStage();
    var sidebar = drama.options.sidebar;
    if (sidebar) {
      drama.initSidebar(sidebar, []);
    }

    // preload card file
    if (drama.options.preload) {
      setTimeout(function () {
        drama.preloadActs();
      }, 100);
    }
  };

  var init = function (node) {
    var stage = {
      x: 0,
      y: 0,
      maxWidth: 260
    };

    var pos = function (x, y) {
      var min = 0, max = stage.maxWidth;
      x = Math.max(Math.min(max, x), min);
      node.anim({translate3d: x + "px, 0, 0"}, 0.3, 'ease-in-out');
      stage.x = x;
      stage.y = y;
    };

    var move = function (event) {
      if (!stage.moved) {
        var i = event.touches[0];
        var offsetX = i.pageX - stage.pointX;
        var offsetY = i.pageY - stage.pointY;
        var x = stage.x + offsetX;
        var y = stage.y + offsetY;
        event.preventDefault();
        stage.pointX = i.pageX,
        stage.pointY = i.pageY,
        pos(x, y);
      }
    };

    var end = function (event) {
      if (event.touches.length === 0) {
        stage.moved = false;
        var x = stage.x - stage.absStartX;
        node.unbind("touchmove");
        node.unbind("touchend");
        if (x !== 0) {
          x = x > Math.abs(x - stage.maxWidth) ? stage.maxWidth : 0;
          stage.x = x;
          stage.y = 0;
          node.anim({translate3d: x + "px, 0, 0"}, 0.2, 'ease-in-out');
        }
      }
    };

    node.bind("touchstart", function (event) {
      var c = event.touches[0];
      if (["SELECT", "INPUT"].indexOf(event.target.tagName) === -1) {
        stage.absStartX = stage.x,
        stage.absStartY = stage.y,
        stage.direction = null;
        stage.startX = stage.x;
        stage.startY = stage.y;
        stage.pointX = c.pageX;
        stage.pointY = c.pageY;
        stage.startTime = event.timeStamp || Date.now();
        node.unbind("touchmove");
        node.unbind("touchend");
        if (!stage.moved) {
          node.bind("touchmove", move);
          node.bind("touchend", end);
        }
        stage.moved = false;
      }
    });
  };

  drama.initStage = function () {
    var name = drama.options.main;
    drama.displayAct(name, []);
    var stage = $("#stage");
    init(stage);
  };

  drama.initSidebar = function () {
    var name = drama.options.sidebar;
    var act = drama._acts[name];
    var sidebar = $("#sidebar");
    drama.getAct(name, function (node) {
      act.node = node;
      sidebar.append(node);
      drama.trigger('initialize', act);
      act.initialize.apply(act, []);
    });
  };

  drama.showSidebar = function (callback) {
    var stage = $("#stage");
    var width = window.innerWidth;
    stage.anim({translate3d: (width - 60) + "px, 0, 0"}, 0.25, 'ease', callback);
  };

  drama.hideSidebar = function (callback) {
    var stage = $("#stage");
    stage.anim({translate3d: "0, 0, 0"}, 0.25, 'ease', callback);
  };

  drama.toggleSidebar = function (callback) {
    var stage = $("#stage");
    var transform = stage.css('-webkit-transform');
    var width = window.innerWidth;
    var x = (transform === 'translate3d(0px, 0px, 0px)' || transform === 'none') ? width - 60 : 0;
    stage.anim({translate3d: x + "px, 0, 0"}, 0.25, 'ease', callback);
  };

  drama.flexHideSidebar = function (callback) {
    var stage = $("#stage");
    var width = window.innerWidth;
    stage.anim({translate3d: width + "px, 0, 0"}, 0.1, 'ease', function () {
      setTimeout(function () {
        stage.anim({translate3d: "0, 0, 0"}, 0.3, 'ease', callback);
      }, 10);
    });
  };

  drama.openAct = function (name) {
    var args = [].slice.call(arguments, 1);
    drama.displayAct.call(drama, name, args);
  };

  // 放映一幕
  drama.displayAct = function (name, args) {
    var stage = $('#stage');
    var act = drama._acts[name];
    if (!act) {
      throw new Error("Act " + name + ' doesnt be defined');
    }

    drama.getAct(name, function (node) {
      // 初始化
      if (!act.node) {
        act.node = node;
        stage.append(node);
        drama.switchAct(act, function () {
          drama.trigger('initialize', act);
          act.initialize.apply(act, args);
        });
      } else {
        // 初始化过，再次打开
        if (act.args.toString() === args.toString()) {
          drama.switchAct(act, function () {
            drama.trigger('reappear', act);
            act.reappear();
          });
        } else {
          // 重新打开，参数改变
          act.destroy();
          act.node.undelegate();
          act.node.remove();
          act.node = node;
          stage.append(node);
          drama.switchAct(act, function () {
            drama.trigger('initialize', act);
            act.initialize.apply(act, args);
          });
        }
      }
      act.args = args;
    });
  };

  drama.supportTouch = "ontouchend" in document;

    // 演员
  var Actor = function (node) {
    this.el = node;
  };
  _.extend(Actor.prototype, EventProxy.prototype);
  _.extend(Actor.prototype, Land.prototype);

  Actor.prototype.delegate = function (selector, events, handler) {
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
    events = events.split(',');
    for (var i = 0; i < events.length; i++) {
      var eventName = events[i];
      if (!drama.supportTouch) {
        eventName = fallback[eventName] || eventName;
        if (ignores.hasOwnProperty(eventName)) {
          // 在PC上忽略掉不支持的事件
          continue;
        }
      }
      Land.prototype.delegate.call(this, selector, eventName, handler);
    }
    return this;
  };

  drama.Actor = function (node) {
    return new Actor(node);
  };

  drama.Model = new Scape();

  // 挂载对象
  root.drama = drama;
}());
