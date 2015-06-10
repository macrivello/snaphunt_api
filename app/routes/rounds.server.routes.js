var rounds = require('../controllers/rounds.server.controller.js');
var games = require('../controllers/games.server.controller.js');

module.exports = function(router) {

    //router.use('/games/:gameId', )


    //router.route('/games/:gameId/rounds')
    //    .get(rounds.list);

    //router.route('/games/:gameId/rounds/:roundId')
    //    .get(rounds.read);

    //router.route('/rounds/:roundId')
    //    .get(rounds.readRound);

    router.get('/games/:gameId/rounds/:roundId',
        rounds.readRound);
        //function(res, req, next) {
        //console.log("fufano");
    //});

    router.route('/rounds')
        .get(rounds.listRounds);

    // Theme selection
    //router.route('/games/:gameId/rounds/:roundId/:themeId')
    //    .get(rounds.selectTheme);

    // updates req object with req.round
    router.param('roundId', rounds.getRound);
    //router.param('gameId', games.getGame);

    return router;
};
