/*global EventProxy, _, Land, Scape, Touch*/
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
    // 后台应用，比如通知
    background: "",
    // 侧边栏
    sidebar: "",
    // 右侧边栏
    rightSidebar: ""
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

  // ## 幕
  var Act = function (module) {
    this._actors = {};
    _.extend(this, module);
    EventProxy.call(this);
  };
  // 继承事件
  Act.prototype = new EventProxy();
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

  Act.prototype.openAct = function (name) {
    // 仅在sidebar中或stage处于初始状态时能够打开新页 
    if (this.isSidebar || !drama.stage.isMoved()) {
      var args = [].slice.call(arguments, 1);
      drama.displayAct.call(drama, name, args);
    }
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
    drama.hideAddressBar();
    if (orient === 'portrait') {
      if (drama.landscape) {
        drama.landscape.undelegate().unbind().empty();
      }
    }
    if (drama.mainStage && drama.mainStage.currentAct) {
      var currentAct = drama.mainStage.currentAct;
      currentAct.trigger('orientationchange', orient);
      currentAct.trigger(orient, drama.landscape);
      drama.trigger(orient + '_' + currentAct.name, currentAct);
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
    // Disable touch move events for integrate with scroll.
    window.addEventListener("touchmove", function (event) {
      // 对于没有申明不阻止的移动事件，一律干掉
      if (!event.noPreventMove) {
        event.preventDefault();
      }
    }, false);
    // 双击隐藏地址栏
    window.addEventListener("doubletap", function () {
      drama.hideAddressBar();
    }, false);
    drama.hideAddressBar();

    // ref to landscape node
    drama.landscape = $("#landscape");
    drama.stageNode = $("#stage");
    drama.sidebar = $("#sidebar");
    drama.rightSidebar = $("#right_sidebar");
    drama.background = $("#background");

    drama.mainStage = new Stage('main', drama.stageNode);
    drama.displayAct = function (name, args) {
      drama.mainStage.displayAct(name, args);
    };

    drama.displayAct(drama.options.main, []);

    drama.initBackground();

    // preload card file
    if (drama.options.preload) {
      setTimeout(function () {
        drama.preloadActs();
      }, 100);
    }
  };

  drama.initBackground = function () {
    var name = drama.options.background;
    if (!name) {
      return;
    }
    var act = drama._acts[name];
    act.isBackground = true;
    var args = [].slice.call(arguments, 0);
    drama.getAct(name, function (node) {
      act.node = node;
      drama.background.html(node);
      drama.trigger('initialize', act);
      act.initialize.apply(act, args);
    });
    drama._backgroundInitialized = true;
  };

  drama.stage = {};

  drama.initStage = function () {
    drama.stage = new Touch(drama.stageNode);
    drama.stage.once('move', function () {
      if (!drama._sidebarInitialized) {
        drama.initSidebar();
      }
    });
    drama.stage.on('show_left', function () {
      drama.sidebar.css({
        'z-index': 2,
        'display': 'block'
      });
      drama.rightSidebar.css({
        'z-index': 1,
        'display': 'none'
      });
    });
    drama.stage.on('show_right', function () {
      drama.sidebar.css({
        'z-index': 1,
        'display': 'none'
      });
      drama.rightSidebar.css({
        'z-index': 2,
        'display': 'block'
      });
    });
    drama.stageNode.bind('tap', function (event) {
      if (drama.stage.x !== 0) {
        drama.hideSidebar();
      }
    });
  };

  drama.initSidebar = function () {
    var name = drama.options.sidebar;
    if (name) {
      var act = drama._acts[name];
      act.isSidebar = true;
      var args = [].slice.call(arguments, 0);
      drama.getAct(name, function (node) {
        act.node = node;
        drama.sidebar.append(node);
        drama.trigger('initialize', act);
        act.initialize.apply(act, args);
      });
      drama._sidebarInitialized = true;
    }
  };

  drama.initRightSidebar = function (name) {
    var args = [].slice.call(arguments, 1);
    if (!drama._rightSidebarInitialized) {
      drama.rightStage = new Stage('rightSidebar', drama.rightSidebar);
      drama._rightSidebarInitialized = true;
    }
    var act = drama._acts[name];
    act.isSidebar = true;
    drama.rightStage.displayAct(name, args);
  };

  drama.showSidebar = function (callback) {
    drama.sidebar.css({
      'z-index': 2,
      'display': 'block'
    });
    drama.rightSidebar.css({
      'z-index': 1,
      'display': 'none'
    });
    var width = window.innerWidth - 60;
    drama.stage.x = width;
    drama.stage.status = 'left';
    drama.stageNode.anim({translate3d: width + "px, 0, 0"}, 0.25, 'ease', callback);
    if (!drama._sidebarInitialized) {
      drama.initSidebar();
    }
  };

  drama.showRightSidebar = function (callback) {
    drama.sidebar.css('z-index', {
      'z-index': 1,
      'display': 'none'
    });
    drama.rightSidebar.css({
      'z-index': 2,
      'display': 'block'
    });
    var width = 120 - window.innerWidth;
    drama.stage.x = width;
    drama.stage.status = 'right';
    drama.stageNode.anim({translate3d: width + "px, 0, 0"}, 0.25, 'ease', callback);
    if (!drama._rightSidebarInitialized) {
      drama.initRightSidebar();
    }
  };

  drama.hideSidebar = function (callback) {
    drama.stage.x = 0;
    drama.stageNode.anim({translate3d: "0, 0, 0"}, 0.25, 'ease', callback);
    drama.stage.trigger('hide');
  };

  drama.toggleSidebar = function (event, callback) {
    if (event) {
      event.cancelBubble = true;
      event.originalEvent.cancelBubble = true;
    }
    var transform = drama.stageNode.css('-webkit-transform');
    var width = window.innerWidth;
    var x = (transform === 'translate3d(0px, 0px, 0px)' || transform === 'none') ? width - 60 : 0;
    drama.stageNode.anim({translate3d: x + "px, 0, 0"}, 0.25, 'ease', callback);
    drama.stage.x = x;
    drama.stage.status = 'left';
    drama.sidebar.css({
      'z-index': 2,
      'display': 'block'
    });
    drama.rightSidebar.css({
      'z-index': 1,
      'display': 'none'
    });
    if (!drama._sidebarInitialized) {
      drama.initSidebar();
    }
  };

  drama.toggleRightSidebar = function (name) {
    var args = [].slice.call(arguments, 0);
    var callback = null;
    if (typeof args[args.length - 1] === 'function') {
      callback = args.pop();
    }
    var transform = drama.stageNode.css('-webkit-transform');
    var width = window.innerWidth;
    var x = (transform === 'translate3d(0px, 0px, 0px)' || transform === 'none') ? 96 - width : 0;
    drama.stageNode.anim({translate3d: x + "px, 0, 0"}, 0.25, 'ease', callback);
    drama.stage.x = x;
    drama.stage.status = 'right';
    drama.sidebar.css({
      'z-index': 1,
      'display': 'none'
    });
    drama.rightSidebar.css({
      'z-index': 2,
      'display': 'block'
    });
    drama.initRightSidebar.apply(drama, args);
  };

  drama.flexHideSidebar = function (callback) {
    var width = window.innerWidth;
    drama.stageNode.anim({translate3d: width + "px, 0, 0"}, 0.1, 'ease', function () {
      setTimeout(function () {
        drama.stage.x = 0;
        drama.stageNode.anim({translate3d: "0, 0, 0"}, 0.3, 'ease', callback);
      }, 10);
    });
  };

  var Stage = function (name, container) {
    this.name = name;
    this.container = container;
  };

  Stage.prototype.displayAct = function (name, args) {
    var that = this;
    var act = drama._acts[name];
    if (!act) {
      throw new Error("Act " + name + ' doesnt be defined');
    }

    drama.getAct(name, function (node) {
      // 初始化
      if (!act.node) {
        act.node = node;
        that.container.append(node);
        that.switchAct(act, function () {
          drama.trigger('initialize', act);
          act.initialize.apply(act, args);
        });
      } else {
        // 初始化过，再次打开
        if (act.args.toString() === args.toString()) {
          that.switchAct(act, function () {
            drama.trigger('reappear', act);
            act.reappear();
          });
        } else {
          // 重新打开，参数改变
          act.destroy();
          act.node.undelegate();
          act.node.remove();
          act.node = node;
          that.container.append(node);
          that.switchAct(act, function () {
            drama.trigger('initialize', act);
            act.initialize.apply(act, args);
          });
        }
      }
      act.args = args;
    });
  };

  /**
   * 切换卡片页
   * 设计思路是所有页面切换的逻辑由新打开的页面来决定如何打开新页和关闭旧页
   */
  Stage.prototype.switchAct = function (next, callback) {
    var that = this;
    var previous = this.currentAct;
    // 如果前一张card与要打开的不是同一张card，收起它
    if (previous) {
      drama.trigger('shrink', previous);
      previous.shrink();
    }

    next.show(previous, function () {
      that.currentAct = next;
      callback();
    });
  };

  Stage.prototype.openAct = function (name) {
    var args = [].slice.call(arguments, 1);
    this.displayAct(name, args);
  };

  drama.supportTouch = "ontouchend" in document;

  // 演员
  var Actor = function (node) {
    this.el = node;
  };
  _.extend(Actor.prototype, EventProxy.prototype);
  _.extend(Actor.prototype, Land.prototype);

  /**
   * 添加事件委托，在PC上降级不支持的事件
   * @param {String} selector 选择器
   * @param {String} events 事件名
   * @param {Function} handler 事件的监听器
   */
  Actor.prototype.delegate = function (selector, events, handler) {
    var ignores = {};
    var fallback = {
      'tap': 'click',
      'doubleTap': 'dblclick'
    };
    events = events.split(',');
    for (var i = 0; i < events.length; i++) {
      var eventName = events[i];
      if (!drama.supportTouch) {
        eventName = fallback[eventName] || eventName;
        if (ignores.hasOwnProperty(eventName)) {
          // 在PC上忽略掉不支持的触摸事件
          continue;
        }
      }
      Land.prototype.delegate.call(this, selector, eventName, handler);
    }
    return this;
  };

  /**
   * 模版的快捷方法
   * @param {String} selector 选择器
   * @param {Object} data 可选的数据，如果不传递，返回编译后的函数
   */
  Actor.prototype.template = function (selector, data) {
    return _.template(this.$(selector).html(), data);
  };

  drama.Actor = function (node) {
    return new Actor(node);
  };

  drama.Model = new Scape();

  // 挂载对象
  root.drama = drama;
}());
