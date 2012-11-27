V5.registerCard("dependencies", function () {
    console.log("Dependencies card");

    var initialize = function () {
        var card = this;
        var view = V5.View(card.node);
        var proxy = new EventProxy();
        proxy.assign("template", "data", function (tmpl, data) {
            view.$(".deps").html(_.template(tmpl, {deps: data}));
            view.scroller = new iScroll(view.$("article")[0], {
                useTransform : false,
                onBeforeScrollStart : function (e) {
                }
            });
        });

        $.getJSON("ajax/dependencies.json", function (data) {
            proxy.fire("data", data);
        });

        V5.getTemplate("dependencies", function (tmpl) {
            proxy.fire("template", tmpl);
        });

        view.bind("goHome", function (event) {
            card.openCard("index");
        });

        view.delegateEvents({
            "click .home": "goHome",
        });
    };

    return {
        initialize : initialize
    };

});
