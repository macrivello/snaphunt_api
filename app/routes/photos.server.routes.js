var photos = require('../controllers/photos.server.controller.js');

module.exports = function(app, _router) {

    var router = app.Router({mergeParams: true});

    // game/{id}/round/{id}/photo...
    router.route('/photo')
        .post(photos.submitPhoto);

    // This route will not sit on /game routes
    _router.route('/photo/:photoId')
        .get(photos.readPhoto);

    router.route('/photo/:photoId/winner')
        .get(photos.selectWinner);

    router.param('photoId', photos.getPhoto);

    return router;
};