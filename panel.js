/*global _*/
(function () {
  var root = this;
  var hasTouch = 'ontouchstart' in window;
  var START_EV = hasTouch ? 'touchstart' : 'mousedown';
  var MOVE_EV = hasTouch ? 'touchmove' : 'mousemove';
  var END_EV = hasTouch ? 'touchend' : 'mouseup';

  var Panel = function (el, options) {
    this.x = 0;
    this.y = 0;
    this.isMoved = function () {
      return this.x !== 0 || this.y !== 0 || this.status === 'touching';
    };
    this.status = 'free';
    this.animating = false;
    this.el = el;
    this.viewport = $(el[0].parentNode);
    this.currPageX = 0;
    this.currPageY = 0;
    var viewportWidth = this.viewport.width();
    var viewportHeight = this.viewport.height();
    var elWidth = this.el.width();
    var elHeight = this.el.height();
    this.outterBound = [-elWidth, viewportWidth, -elHeight, viewportHeight];
    this.innerBound = [
      viewportWidth >= elWidth ? 0 : viewportWidth - elWidth, // x1
      viewportWidth >= elWidth ? viewportWidth - elWidth : 0, // x2
      viewportHeight >= elHeight ? 0 : viewportHeight - elHeight, // y1
      viewportHeight >= elHeight ? viewportHeight - elHeight : 0 // y2
    ];
    this.options = {
      parent: null,
      snap: false,
      vScroll: true,
      hScroll: true,
      // 如果为true，内容区域小于视窗区域时，不启用任何触屏效果
      auto: false,
      // 边界检查，设为true时，滑动不允许越出边界
      bounce: false,
      // 边界, outter或inner，或者自定义的[x1, x2, y1, y2]
      bound: "inner"
    };
    _.extend(this.options, options);
    this.init();
  };

  Panel.prototype.init = function () {
    var that = this;
    this.bound = (typeof this.options.bound === 'string') ? this[this.options.bound + "Bound"] 
      : this.options.bound;
    // 如果设置auto为true，当内容小于视窗区域时，不添加触摸事件
    if (that.options.auto) {
      var el = this.el;
      var viewport = this.viewport;
      if (el.width() <= viewport.width() && el.height <= viewport.width()) {
        return;
      }
    }
    that.el.bind(START_EV, function (event) {
      that._start(event);
    });
  };

  Panel.prototype._start = function (event) {
    // 父容器移动时，子容器不再触发事件
    if (this.options.parent && this.options.parent.isMoved()) {
      return;
    }
    if (["SELECT", "INPUT"].indexOf(event.target.tagName) === -1) {
      var point = hasTouch ? event.touches[0] : event;
      // 记录下起始点
      this.startX = this.x;
      this.startY = this.y;
      // 记录下当前点
      this.pointX = point.pageX;
      this.pointY = point.pageY;
      this.direction = '';
      this.startTime = event.timeStamp || Date.now();
      var that = this;
      this.el.bind(MOVE_EV, function (event) {
        that._move(event);
      });
      this.el.bind(END_EV, function (event) {
        that._end(event);
      });
    }
  };

  Panel.prototype._move = function (event) {
    event.preventDefault();
    if (this.options.parent && this.options.parent.isMoved()) {
      return;
    }
    this.status = 'touching';
    var point = hasTouch ? event.touches[0] : event;
    // 偏移量
    var offsetX = point.pageX - this.pointX;
    var offsetY = point.pageY - this.pointY;
    // 做方向判定
    if (!this.direction) {
      this.direction = Math.abs(offsetX) > Math.abs(offsetY) ? 'h' : 'v';
    }
    // 是否冒泡给父元素
    if (!this.options.vScroll && this.direction === 'v') {
      event.cancelBubble = false;
    } else {
      event.cancelBubble = true;
    }
    if (!this.options.hScroll && this.direction === 'h') {
      event.cancelBubble = false;
    } else {
      event.cancelBubble = true;
    }

    // 计算出新的位置
    var newX = this.x + offsetX;
    var newY = this.y + offsetY;
    // 记下当前点
    this.pointX = point.pageX;
    this.pointY = point.pageY;
    // 更新位置
    this._pos(newX, newY);
  };

  Panel.prototype._end = function (event) {
    var that = this;
    if (!hasTouch || event.touches.length === 0) {
      this.el.unbind(MOVE_EV);
      this.el.unbind(END_EV);
      this.status = 'free';
      if (this.options.snap) {
        var x = this.x;
        var y = this.y;
        var options = this.options;
        var bound = this.bound;
        // 弹回边界
        if (options.snap === true) {
          x = x > Math.abs(x - bound[1]) ? bound[1] : bound[0];
          this.currPageX = Math.round(-1 * x / this.viewport.width());
        } else {
          var snapWidth = this.el.find(options.snap).width();
          var hColumn = Math.round(x / snapWidth);
          var maxColumn = Math.ceil(this.el.width() / this.viewport.width());
          // 边界检查
          hColumn = Math.min(Math.max(-maxColumn + 1, hColumn), 0);
          x = hColumn * snapWidth;
          this.currPageX = -hColumn;
        }
        if (!options.hScroll) {
          this.currPageX = 0;
          x = 0;
        }
        this.x = x;
        // 弹回边界
        if (options.snap === true) {
          y = y > Math.abs(y - bound[3]) ? bound[3] : bound[2];
          this.currPageY = Math.round(-1 * y / this.viewport.height());
        } else {
          var snapHeight = this.el.find(options.snap).height();
          var vColumn = Math.round(y / snapHeight);
          var vMaxColumn = Math.ceil(this.el.height() / this.viewport.height());
          // 边界检查
          vColumn = Math.min(Math.max(-vMaxColumn + 1, vColumn), 0);
          y = vColumn * snapHeight;
          this.currPageY = -vColumn;
        }
        if (!options.vScroll) {
          this.currPageY = 0;
          y = 0;
        }
        this.y = y;
        this.animating = true;
        this.el.anim({translate3d: x + "px, " + y + "px, 0"}, 0.2, 'ease-in-out', function () {
          that.animating = true;
        });
      }
    }
    if (this.options.onScrollEnd) {
      this.options.onScrollEnd.call(this);
    }
  };

  Panel.prototype._pos = function (x, y) {
    var options = this.options;
    if (options.bounce) {
      var bound = this.bound;
      x = Math.max(Math.min(bound[1], x), bound[0]);
      y = Math.max(Math.min(bound[3], y), bound[2]);
    }
    if (!options.vScroll) {
      y = 0;
    }
    if (!options.hScroll) {
      x = 0;
    }
    this.el.anim({translate3d: x + "px, " + y + "px, 0"}, 0, 'ease');
    this.x = x;
    this.y = y;
  };

  Panel.prototype.refresh = function () {};

  Panel.prototype.scrollTo = function () {};

  Panel.prototype.scrollToPage = function (pageX, pageY, time) {
    var that = this;
    time = time || 400;
    time = time / 1000;

    if (typeof this.options.snap === "string") {
      this.currPageX = pageX === 'next' ? this.currPageX + 1 : pageX === 'prev' ? this.currPageX - 1 : pageX;
      // that.currPageY = pageY === 'next' ? that.currPageY + 1 : pageY === 'prev' ? that.currPageY - 1 : pageY;
      var snap = this.el.find(this.options.snap).width();
      var x = this.currPageX * snap * -1;
      // y = that.currPageX * snap;
      this.el.anim({translate3d: x + "px, " + this.y + "px, 0"}, time, 'ease-in-out', function () {
        that.animating = true;
      });
      this.x = x;
      if (this.options.onScrollEnd) {
        this.options.onScrollEnd.call(this);
      }
    }
  };

  root.Panel = Panel;
}());
