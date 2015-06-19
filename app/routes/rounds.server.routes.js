var rounds = require('../controllers/rounds.server.controller.js');
var photos = require('../controllers/photos.server.controller.js');

module.exports = function(router) {

    //var router = app.Router();

    router.route('/rounds/:roundId')
        .get(rounds.readRound);

    router.route('/rounds')
        .get(rounds.listRounds);

    // Theme selection
    //router.route('/games/:gameId/rounds/:roundId/:themeId')
    //    .get(rounds.selectTheme);

    router.route('/rounds/:roundId/photo')
        .post(photos.submitPhoto);

    // updates req object with req.round
    router.param('roundId', rounds.getRound);
    //router.param('gameId', games.getGame);

    return router;
};
