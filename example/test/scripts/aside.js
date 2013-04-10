/*global drama, $*/
drama.addAct('aside', function () {
  return {
    initialize: function () {
      var act = this;
      var actor = new drama.Actor(act.node);
      actor.delegate('button', 'tap', function () {
        drama.hideSidebar();
      });
    }
  };
});
