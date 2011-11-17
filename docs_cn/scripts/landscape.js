V5.registerCard("landscape", function () {
    console.log("Landscape card");

    var initialize = function () {
        var card = this;
        var view = V5.View(card.node);

        view.bind("redirect", function (event) {
            var target = $(event.currentTarget);
            var hash = target.attr("href");
            card.openCard(hash.replace("#", ""));
            event.preventDefault();
        });

        view.scroller = new iScroll(view.$("article")[0], {
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