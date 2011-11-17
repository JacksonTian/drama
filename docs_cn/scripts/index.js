V5.registerCard("index", function () {
    console.log("Index card");

    var initialize = function () {
        var card = this;
        var view = V5.View(card.node);

        view.bind("redirect", function (event) {
            var target = $(event.currentTarget);
            var hash = target.attr("href");
            // Open view.
            card.openCard(hash.replace("#", ""));
            event.preventDefault();
        });

        view.scroller = new iScroll(view.el[0], {
            useTransform : false,
            onBeforeScrollStart : function (e) {
            }
        });

        view.delegateEvents({
            "click .listview a": "redirect",
        });
    };

    return {
        initialize : initialize
    };

});