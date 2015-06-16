var photos = require('../controllers/photos.server.controller.js');

module.exports = function(router) {

    router.route('/photos')
        .post(photos.submit);

    return router;
};