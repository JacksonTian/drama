/*global V5, getStorage, _*/
V5.registerCard("index", function () {
  console.log("index card");

  var initialize = function () {
    var card = this;
    var view = V5.View(card.node);

    var localStorage = getStorage('local');
    var tpl = _.template(view.$('.list').html());
    
    card.bind('refresh', function () {
      var list = localStorage.get('todo');
      view.$('article').html(tpl({
        list: list
      }));
    });

    card.emit('refresh');

    // TODO
    view.bind("redirect", function (event) {
      event.preventDefault();
      card.openCard('add');
    });

    var ul = view.$('ul');
    view.bind("toggleDelete", function (event) {
      var li = $(event.currentTarget);
      ul.find('.action.active').removeClass('active');
      li.find('.action').toggleClass('active');
    });

    view.delegateEvents({
      "tap header .add": "redirect",
      "panstart header": "panstart",
      "pan header": "pan",
      "swipe li": "toggleDelete"
    });
  };

  var reappear = function () {
    this.emit('refresh');
  };

  return {
    initialize : initialize,
    reappear: reappear,
    show: function (previous, callback) {
      var current = this.node;
      current.show();
      var pre = previous && previous.name;
      switch (pre) {
      case 'add':
        previous.node.anim({translate3d: '0, 0, 0'}, 0.4, 'ease-out');
        this.node.anim({translate3d: '0, 0, 0'}, 0.4, 'ease-out');
        break;
      default:
        break;
      }
      callback();
    }
  };
});
