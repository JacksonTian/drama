V5.registerCard("intro", function () {
    console.log("Introduction card");

    var initialize = function () {
        var card = this;
        var view = V5.View(card.node);

        view.bind("goHome", function (event) {
            card.openCard("index");
        });

        view.delegateEvents({
            "click .home": "goHome",
        });
    };

    return {
        initialize : initialize,
        enableL10N : true
    };

});
