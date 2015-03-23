var users = require('../../app/controllers/users.server.controller'),
	passport = require('passport');

module.exports = function(router) {
    router.route('/users').post(users.register)
        .get(users.list);

    router.route('/users/:userId')
        .get(users.read)
        .put(users.update)
        .delete(users.delete);

    router.route('/register')
		.get(users.renderRegister)
		.post(users.register);

    router.route('/login')
        .post(users.login);

    router.route('/gcmregid').put(users.updateGcmRegId);

    // TESTING PUSHING TO USERID
    router.route('/push/:userId').get(users.sendGcmMessage);

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