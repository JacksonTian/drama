/*global drama, $*/
drama.addAct('shop', function () {
  return {
    initialize: function (id) {
      var act = this;
      var actor = new drama.Actor(act.node);
      act.node.find('.test').html(id);
      actor.delegate('button', 'tap', function () {
        drama.showSidebar();
      });
    }
  };
});
