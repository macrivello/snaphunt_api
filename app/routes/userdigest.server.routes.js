var userdigest = require('../controllers/userdigest.server.controller.js');

module.exports = function(router) {
    router.route('/userdigest')
        .get(userdigest.list); // ADMIN

    return router;
};
