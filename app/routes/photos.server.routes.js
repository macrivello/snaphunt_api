var photos = require('../controllers/photos.server.controller.js');

module.exports = function(app) {

    var router = app.Router({mergeParams: true});

    // game/{id}/round/{id}/photo...
    router.route('/photo')
        .post(photos.submitPhoto);

    router.route('/photo/:id')
        .get(photos.readPhoto);

    router.param('id', photos.getPhoto);

    return router;
};