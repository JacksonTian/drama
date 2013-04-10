/*global EventProxy*/
(function (global) {
  var $ = global.jQuery || global.Zepto;
  var Landscape = function () {
    this.version = "0.0.2";
  };

  /**
   * 继承
   * @param {Function} parent 父类
   * @param {Object} properties 新属性
   * @return {Function} 新的子类
   */
  Landscape.extend = function (parent, properties) {
    if (typeof parent !== "function") {
      properties = parent;
      parent = function () {};
    }

    properties = properties || {};
    var sub = function () {
      // Call the parent constructor.
      parent.apply(this, arguments);
      // Only call initialize in self constructor.
      if (this.constructor === parent && this.initialize) {
        this.initialize.apply(this, arguments);
      }
    };
    sub.prototype = new parent();
    sub.prototype.constructor = parent;
    $.extend(sub.prototype, properties);
    return sub;
  };

  global.Landscape = Landscape;

  /**
   * Land定义，是对jQuery的简单封装，用于约束DOM操作在一个确定的视图内进行
   */
  var Land = function (selector, callback) {
    if (!(this instanceof Land)) {
      return new Land(selector, callback);
    }
    return this.ready(selector, callback);
  };

  Land.prototype.ready = function (selector, callback) {
    this.el = $(selector);
    if (this.el.length) {
      callback && callback(this);
    } else {
      // When document ready
      var view = this;
      $(function () {
        view.el = $(selector);
        if (view.el.size()) {
          callback && callback(view);
        } else {
          throw new Error(selector + " block doesn't exist.");
        }
      });
    }
    return this;
  };

  /**
   * 从当前Land视图查找元素
   */
  Land.prototype.$ = function (selector) {
    return $(selector, this.el);
  };

  /**
   * 给前Land视图委托事件
   */
  Land.prototype.delegate = function (selector, events, handler) {
    this.el.delegate(selector, events, handler);
    return this;
  };

  Land.prototype.getTemplate = function (id) {
    return $("#template_" + id).html();
  };

  global.Land = Land;
  /**
   * 数据层定义
   */
  var Scape = Landscape.extend(EventProxy, {
    initialize: function (data) {
      this.data = data || {};
    }
  });

  /**
   * ready方法以key绑定事件，如果该值已经被设置过，回调函数将会立即触发一次
   * @param {String} key 数据键名
   * @param {Function} callback 回调函数
   */
  Scape.prototype.ready = function (key, callback) {
    if (this.data.hasOwnProperty(key)) {
      callback({"newVal": this.data[key]});
    }
    this.bind(key, callback);
    return this;
  };

  /**
   * 设置数据到Scape对象上，会以key触发一个事件。传递值为oldVal和newVal，新旧值
   * @param {String} key 数据键名
   * @param {Mix} value 数据值
   */
  Scape.prototype.set = function (key, value) {
    var oldValue = this.data[key];
    this.data[key] = value;
    this.fire(key, {"oldVal": oldValue, "newVal": value});
    return this;
  };

  /**
   * 获取Scape的值
   */
  Scape.prototype.get = function (key, formatter) {
    var val = key ? this.data[key] : this.data;
    return (typeof formatter === 'function') ? formatter(val) : val;
  };

  /**
   * 删除
   */
  Scape.prototype.remove = function (key) {
    delete this.data[key];
    return this;
  };

  // 无需键值的Scape对象
  var _Scape = function () {
    this.key = 'no_key';
    this.scape = new Scape();
  };

  _Scape.prototype.set = function (val) {
    this.scape.set(this.key, val);
    return this;
  };

  _Scape.prototype.get = function (formatter) {
    return this.scape.get(this.key, formatter);
  };

  _Scape.prototype.ready = function (callback) {
    this.scape.ready(this.key, callback);
    return this;
  };

  _Scape.prototype.remove = function () {
    this.scape.remove(this.key);
    return this;
  };

  /**
   * 返回一个无需键值的Scape对象
   */
  Scape.sample = function () {
    return new _Scape();
  };

  global.Scape = Scape;

}(window));
