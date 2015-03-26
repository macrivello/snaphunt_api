var photos = require('../controllers/photo.server.controller.js');

module.exports = function(router) {

    router.route('/photos')
        .post(photos.submit);

    return router;
};