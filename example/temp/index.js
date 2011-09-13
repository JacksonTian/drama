V5.registerPage("index", function () {
    console.log("Index page");

    var initialize = function () {
        var page = this;
        var view = V5.View(page.node);
        var proxy = new EventProxy();
        proxy.assign("template", "data", function (template, data) {
            var html = _.template(template, data);
            view.$("#listing").html(html);
        });
        V5.getTemplate("listview", function (template) {
            proxy.trigger("template", template);
        });

        $.get("ajax/listview.json", function (data) {
            proxy.trigger("data", JSON.parse(data));
        });

        view.bind("getDetail", function (event) {
            var target = $(event.currentTarget);
            var index = target.data("index");
            page.openView("item/" + index);
        });

        view.delegateEvents({
            "click #listing li": "getDetail",
        });
    };

    return {
        initialize : initialize
    };

});
