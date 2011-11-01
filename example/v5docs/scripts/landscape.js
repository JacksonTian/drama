V5.registerPage("landscape", function () {
    console.log("Landscape page");

    var initialize = function () {
        var page = this;
        var view = V5.View(page.node);

        view.bind("redirect", function (event) {
            var target = $(event.currentTarget);
            var hash = target.attr("href");
            page.openView(hash.replace("#", ""));
            event.preventDefault();
        });

        view.delegateEvents({
            "click .listview a": "redirect",
        });
    };

    return {
        initialize : initialize
    };

});