var photos = require('../controllers/photos.server.controller.js');

module.exports = function(app, _router) {

    var router = app.Router({mergeParams: true});
    //var router = app.Router();

    // game/{id}/round/{id}/photo...
    router.route('/photo')
        .get(photos.getPhotoFromUserDigestId)
        .post(photos.submitPhoto);

    // This route will not sit on /game routes
    _router.route('/photo/:photoId')
        .get(photos.readPhoto);

    //router.route('/photo/:userDigestId')
    //    .get(photos.getPhotoFromUserDigestId);

    router.route('/photo/:photoId/winner')
        .get(photos.selectWinner);

    router.param('photoId', photos.getPhoto);
    _router.param('photoId', photos.getPhoto);

    return router;
};