var users = require('../../app/controllers/users.server.controller'),
	passport = require('passport');

module.exports = function(router) {
    router.route('/users').post(users.create).get(users.list);

    router.route('/users/:userId').get(users.read).put(users.update).delete(users.delete);

    // This sets the found user in the request (req) object, if user is found.
    // REQ.USER GETS SET IN EACH CHECK AUTH CALL
    //router.param('userId', users.userByID);

    router.route('/register')
		.get(users.renderRegister)
		.post(users.register);

    // No need to render a login screen.
    router.route('/login')
        // There should be no need to GET /login
        .get(users.renderLogin)
        // This was code from the tutorial.
		//.post(passport.authenticate('local', {
		//	successRedirect: '/',
		//	failureRedirect: '/login',
		//	failureFlash: true
		//}));
        .post(function(req, res, next) {
            passport.authenticate('local', function(err, user, info) {
                if (err) { return next(err); }
                if (!user) { return res.json(401, info); }

                // Not used in v1.
                //req.logIn(user, { session: false }, function(err) {
                //    if (err) { return next(err); }
                //});

                user = users.updateAuthToken(req, res, next, user);
                //user = users.updateGCMRegId(user, req);

                res.json(user);
            })(req, res, next);
        });

    router.route('/gcmregid').post(users.updateGcmRegId);

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