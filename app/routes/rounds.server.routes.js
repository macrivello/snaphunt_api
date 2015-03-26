var rounds = require('../controllers/photo.server.controller.js');

module.exports = function(router) {

    router.route('/rounds')
        .get(rounds.list);

    router.route('/rounds/:roundId')
        .post(rounds.read);

    // updates req object with req.round
    router.param('roundId', rounds.getRound);

    return router;
};
