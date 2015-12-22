var users = require('../../app/controllers/users.server.controller.js');

module.exports = function(router) {
    router.route('/user')
        //TODO Rename functions
        .get(users.read) // ADMIN
        .delete(users.delete);

    router.route('/users')
        .get(users.list) // ADMIN
        .delete(users.deleteAll);

    router.route('/users/:userId')
        .get(users.read)
        .put(users.update)
        .delete(users.delete);

    router.route('/users/:userId/profilephoto')
        .put(users.updateProfilePhoto);

    router.route('/register')
        .post(users.register);

    router.route('/login')
        .get(users.login);

    router.param('userId', users.getUser);


    // TESTING PUSHING TO USERID
    router.route('/push/:userId').get(users.sendGcmMessage);

    // TODO: Revisit. What DO I need to do on logout?
    router.get('/logout', users.logout);

    /**
     * OAuth routes not used in v1.
     */
    //router.get('/oauth/facebook', passport.authenticate('facebook', {
	//	failureRedirect: '/login',
	//	scope:['email']
	//}));
    //
    //router.get('/oauth/facebook/callback', passport.authenticate('facebook', {
	//	failureRedirect: '/login',
	//	successRedirect: '/',
	//	scope:['email']
	//}));
    //
    //router.get('/oauth/twitter', passport.authenticate('twitter', {
	//	failureRedirect: '/login'
	//}));
    //
    //router.get('/oauth/twitter/callback', passport.authenticate('twitter', {
	//	failureRedirect: '/login',
	//	successRedirect: '/'
	//}));

    return router;
};