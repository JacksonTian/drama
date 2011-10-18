V5.registerPage("item", function () {
    console.log("Index page");

    var initialize = function (index) {
        var page = this;
        var view = V5.View(page.node);
        view.el.html('<img src="img/s' + index + '.jpg" />');
    };

    return {
        initialize : initialize
    };

});
