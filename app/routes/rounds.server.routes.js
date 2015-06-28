var rounds = require('../controllers/rounds.server.controller.js');
var photos = require('../controllers/photos.server.controller.js');

module.exports = function(app) {

    var router = app.Router({mergeParams: true});

    router.route('/rounds/:roundId')
        .get(rounds.readRound)
        .put(rounds.updateRound);

    router.route('/rounds/')
        .get(rounds.listRounds)
        .delete(rounds.deleteAll);

    // TODO: Add to Photo routes
    //router.route('/rounds/:roundId/photo')
    //    .post(photos.submitPhoto);

    // updates req object with req.round
    router.param('roundId', rounds.getRound);


    return router;
};
