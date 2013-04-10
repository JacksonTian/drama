/*global drama, $*/
drama.addAct('index', function () {
  return {
    initialize: function () {
      var act = this;
      var actor = new drama.Actor(act.node);
      actor.delegate('button.show', 'tap', function () {
        drama.showSidebar();
      });
      actor.delegate('button.redirect', 'tap', function () {
        drama.openAct('shop', 1000);
      });
    }
  };
});
