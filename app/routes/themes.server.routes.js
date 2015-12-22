var themes = require('../controllers/themes.server.controller.js');

module.exports = function(app, _router) {
    var router = app.Router({mergeParams: true});

    // 'router' -- game/{id}/round/{id}/themes...
    // '_router' -- base path

    router.route('/themes')
        .get(themes.list)
        .delete(themes.delete);

    _router.route('/themes')
        .get(themes.listAll)
        .post(themes.create);

    _router.route('/themes/:themeId')
        .get(themes.readTheme);

    router.route('/themes/:themeId')
        .get(themes.selectTheme);

    router.route('/THEMES/:themeId/like')
        .get(themes.like);
    router.route('/themes/:themeId/dislike')
        .get(themes.dislike);
    router.route('/themes/:themeId/neutral')
        .get(themes.neutral);

    _router.param('themeId',themes.getTheme);
    router.param('themeId',themes.getTheme);

    return router;
};