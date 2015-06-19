var photos = require('../controllers/photos.server.controller.js');

module.exports = function(router) {

    router.route('/photo')
        .post(photos.submitPhoto);

    router.route('/photo/:id')
        .get(photos.readPhoto);

    router.param('id', photos.getPhoto);

    return router;
};