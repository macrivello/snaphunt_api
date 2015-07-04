var themes = require('../controllers/themes.server.controller.js');

module.exports = function(app, _router) {
    var router = app.Router({mergeParams: true});

    // game/{id}/round/{id}/themes...
    router.route('/themes')
        .get(themes.list)
        .delete(themes.delete);

    _router.route('/themes')
        .get(themes.listAll)
        .post(themes.create);

    router.route('/themes/:themeId')
        .get(themes.readTheme)
        .post(themes.selectTheme);

    router.route('/themes/:themeId/like')
        .get(themes.like);
    router.route('/themes/:themeId/dislike')
        .get(themes.dislike);
    router.route('/themes/:themeId/neutral')
        .get(themes.neutral);

    router.param('themeId',themes.getTheme);
    return router;
};