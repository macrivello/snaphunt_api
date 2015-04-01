var themes = require('../controllers/themes.server.controller.js');

module.exports = function(router) {

    // game/{id}/round/{id}/themes...
    router.route('/themes')
        .get(themes.list);

    router.route('/themes/:themeId/like')
        .get(themes.like);
    router.route('/themes/:themeId/dislike')
        .get(themes.dislike);
    router.route('/themes/:themeId/neutral')
        .get(themes.neutral);

    router.param('themeId',themes.getTheme);
    return router;
};