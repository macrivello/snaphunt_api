var games = require('../controllers/games.server.controller.js');

module.exports = function(router) {

    router.route('/games')
        .post(games.create)
        .get(games.list) // ADMIN
        .delete(games.deleteAll);  // ADMIN

    router.route('/games/:gameId')
        .get(games.read)
        .put(games.update)
        .delete(games.delete);

    router.route('/invites')
        .get(games.listInvites)
        .delete(games.deleteInvites);

    router.route('/invites/:gameId/accept')
        .get(games.acceptInvite);

    //router.route('/invites/{gameId}')
    //    .get(games.readInvite)
    //    .put(games.updateInvite);

    // Updates request object with req.game
    router.param('gameId', games.getGame);

    return router;
};