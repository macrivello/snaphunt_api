var userdigest = require('../controllers/userdigest.server.controller.js');

module.exports = function(router) {
    router.route('/userdigest')
        .get(userdigest.list) // ADMIN
        .delete(userdigest.delete);

    router.route('/userdigest/:id')
        .get(userdigest.read); // ADMIN

    // Update request object with req.userDigest;
    router.param('id', userdigest.getUserDigest);
    return router;
};
