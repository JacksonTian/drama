V5.registerCard("add", function () {
  console.log("add card");

  var initialize = function () {
    var card = this;
    var view = V5.View(card.node);
    var storage = getStorage('local');
    var list = storage.get('todo');
    list = list || [];
    // TODO
    view.bind('redirect', function () {
      list.push({
        status: '',
        content: view.$('input').val()
      });
      storage.put('todo', list);
      view.$('input').val('');
      card.openCard('index');
    });

    view.bind('cancel', function () {
      card.openCard('index');
    });

    view.delegateEvents({
      "tap button": "redirect",
      "tap .cancel": "cancel"
    });
  };

  return {
    initialize : initialize,
    show: function (previous, callback) {
      var node = this.node;
      node.css({
        left: "100%",
        top: 0
      });
      var width = window.innerWidth;
      previous.node.anim({translate3d: -width + "px, 0, 0"}, 0.4, 'ease-out');
      node.anim({translate3d: -width + "px, 0, 0"}, 0.4, 'ease-out');
      callback();
    }
  };
});
