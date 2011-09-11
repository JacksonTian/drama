V5.registerPage("home", function () {
    console.log("Home page");

    var initialize = function () {
        var page = this;
        var view = V5.View(page.node);

        view.bind("getDetail", function (event) {
            var target = $(event.currentTarget);
            var index = target.data("index");
            page.openView("item/" + index);
        });

        view.delegateEvents({
            //"click #listing li": "getDetail",
        });
    };

    return {
        initialize : initialize
    };

});
