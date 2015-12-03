var admin = require('../controllers/admin.server.controller.js'),
    gcm = require('../controllers/gcm.server.controller.js');

module.exports = function(router) {

    // This probably shouldn't be a GET
    router.route('/resetdb')
        .get(admin.resetDB);

    router.route('/gcm')
        .get(gcm.sendGcmMessageToGcmID);
    return router;
};