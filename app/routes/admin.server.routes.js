var admin = require('../controllers/admin.server.controller.js');

module.exports = function(router) {

    // This probably shouldn't be a GET
    router.route('/resetdb')
        .get(admin.resetDB);

    return router;
};