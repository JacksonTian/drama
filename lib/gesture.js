/*global Zepto*/
(function ($) {
  function parentIfText(node) {
    return 'tagName' in node ? node : node.parentNode;
  }

  function copyEvent(type, source) {
    var ev = $.Event(type);
    var properties = ["screenX", "screenY", "clientX", "clientY", "pageX", "pageY"];
    properties.forEach(function (p) {
      ev[p] = source[p];
    });
    return ev;
  }

  var gestures = {};
  var el;
  $(document).ready(function () {
    var body = $(document.body);
    function start(event) {
      if (Object.getOwnPropertyNames(gestures).length === 0) {
        el = $(parentIfText(event.touches[0].target));
        if (!el.is('select, input, textarea')) {
          body.bind("touchmove", move);
          body.bind("touchend", end);
          body.bind('touchcancel', cancel);
        } else {
          return;
        }
      }

      [].forEach.call(event.changedTouches, function (touch) {
        var touchRecord = {};
        for (var p in touch) {
          touchRecord[p] = touch[p];
        }
        var gesture = {
          startTouch: touchRecord,
          startTime: Date.now(),
          status: "tapping",
          pressingHandler: setTimeout(function () {
            if (gesture.status === "tapping") {
              gesture.status = "pressing";
              el.trigger(copyEvent('press', touchRecord));
            }
            clearTimeout(gesture.pressingHandler);
            gesture.pressingHandler = null;
          }, 200)
        };
        gestures[touch.identifier] = gesture;
      });
    }

    function move(event) {
      [].forEach.call(event.changedTouches, function (touch) {
        var gesture = gestures[touch.identifier];
        if (!gesture) {
          return;
        }
        var startTouch = gesture.startTouch;
        var offsetX = touch.clientX - startTouch.clientX;
        var offsetY = touch.clientY - startTouch.clientY;

        var ev;
        if (gesture.status === "pressing") {
          gesture.status = "tapping";
        }
        // magic number 10: moving 10px means pan, not tap
        if (gesture.status === "tapping") {
          var distance = Math.sqrt(Math.pow(offsetX, 2) + Math.pow(offsetY, 2));
          if (distance > 10) {
            gesture.status = "panning";
            ev = copyEvent('panstart', touch);
            ev.offsetX = offsetX;
            ev.offsetY = offsetY;
            el.trigger(ev);
            if (Math.abs(offsetX)  > Math.abs(offsetY)) {
              ev = copyEvent('horizontalpanstart', touch);
              ev.offsetX = offsetX;
              el.trigger(ev);
              gesture.isVertical = false;
            } else {
              ev = copyEvent('verticalpanstart', touch);
              ev.offsetX = offsetX;
              el.trigger(ev);
              gesture.isVertical = true;
            }
          }
        } else if (gesture.status === "panning") {
          ev = copyEvent('pan', touch);
          ev.offsetX = offsetX;
          ev.offsetY = offsetY;
          el.trigger(ev);

          if (gesture.isVertical) {
            ev = copyEvent('verticalpan', touch);
            ev.offsetY = offsetY;
            el.trigger(ev);
          } else {
            ev = copyEvent('horizontalpan', touch);
            ev.offsetX = offsetX;
            el.trigger(ev);
          }
        }
      });
    }

    function end(event) {
      var ev;
      [].forEach.call(event.changedTouches, function (touch) {
        var gesture = gestures[touch.identifier];
        if (!gesture) {
          return;
        }

        if (gesture.pressingHandler) {
          clearTimeout(gesture.pressingHandler);
          gesture.pressingHandler = null;
        }

        if (gesture.status === "tapping") {
          el.trigger(copyEvent('tap', touch));
        }
        if (gesture.status === "panning") {
          ev = copyEvent('panend', touch);
          var startTouch = gesture.startTouch;
          var offsetX = touch.clientX - startTouch.clientX;
          var offsetY = touch.clientY - startTouch.clientY;
          var duration = Date.now() - gesture.startTime;
          ev.duration = duration;
          ev.offsetX = offsetX;
          ev.offsetY = offsetY;
          el.trigger(ev);

          if (duration < 300) {
            ev = copyEvent('flick', touch);
            ev.duration = duration;
            ev.offsetX = offsetX;
            ev.offsetY = offsetY;
            ev.speedX = offsetX / duration;
            ev.speedY = offsetY / duration;
            el.trigger(ev);

            if (gesture.isVertical) {
              ev = copyEvent('verticalflick', touch);
              ev.duration = duration;
              ev.offsetY = offsetY;
              ev.speedY = offsetY / duration;
              el.trigger(ev);
            } else {
              ev = copyEvent('horizontalflick', touch);
              ev.duration = duration;
              ev.offsetX = offsetX;
              ev.speedX = offsetX / duration;
              el.trigger(ev);
            }
          }
        }

        if (gesture.status === "pressing") {
          el.trigger(copyEvent('pressend', touch));
        }
        delete gestures[touch.identifier];
      });

      if (Object.getOwnPropertyNames(gestures).length === 0) {
        body.unbind("touchend", end).unbind("touchmove", move).unbind("touchcancel", cancel);
      }
    }

    function cancel(event) {
      if (Object.keys(gestures).length === 0) {
        body.unbind("touchend", end).unbind("touchmove", move).unbind("touchcancel", cancel);
      }
    }

    //double tap
    var lastTapTime = NaN;

    body.bind("tap", function (event) {
      var now = Date.now();
      if (now - lastTapTime < 500) {
        el.trigger(copyEvent('doubletap', event));
      }
      lastTapTime = now;
    }, false);

    body.bind('touchstart', start);
  });
}(Zepto));
