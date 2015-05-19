var games = require('../controllers/games.server.controller.js');

module.exports = function(router) {

    router.route('/games')
        .post(games.create)
        .get(games.list) // ADMIN
        .delete(games.delete);  // ADMIN

    router.route('/games/:gameId')
        .get(games.read)
        .put(games.update)
        .delete(games.delete);

    // Updates request object with req.game
    router.param('gameId', games.getGame);

    return router;
};