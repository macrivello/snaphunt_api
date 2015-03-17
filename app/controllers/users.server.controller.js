var Promise = require('bluebird');

var User = Promise.promisifyAll(require('mongoose').model('User')),
	passport = require('passport'),
    auth = require('./auth.server.controller.js'),
    gcm = require('./gcm.server.controller.js');

// Get a String from Mongo error code.
var getErrorMessage = function(err) {
	var message = '';
	if (err.code) {
		switch (err.code) {
			case 11000:
			case 11001:
				message = 'Username already exists';
				break;
			default:
				message = 'Something went wrong';
		}
	}
	else {
		for (var errName in err.errors) {
			if (err.errors[errName].message)
				message = err.errors[errName].message;
		}
	}

	return message;
};

// I shouldn't ever need to render a login page.
exports.renderLogin = function(req, res, next) {
	if (!req.user) {
		res.render('login', {
			title: 'Log-in Form',
			messages: req.flash('error') || req.flash('info')
		});
	}
	else {
		return res.redirect('/');
	}
};

exports.renderRegister = function(req, res, next) {
	if (!req.user) {
		res.render('register', {
			title: 'Register Form',
			messages: req.flash('error')
		});
	}
	else {
		return res.redirect('/');
	}
};

exports.register = function(req, res, next) {
	if (!req.user) {
        console.log("Registering User")
		var user = new User(req.body);
		var message = null;
		var token = auth.generateAuthToken(user);

        // TODO: add validation check on token
        if (token) {
            user.authToken = token;
        }
        // TODO: add gcm token
        user.provider = 'local';


		user.save(function(err) {
			if (err) {
				var message = getErrorMessage(err);
				req.flash('error', message);
                console.log("Error saving User in database. " + err);
                res.status(500).send("Error registering user: " + user);
				return;
			}

            console.log("Successfully registered user: " + user.username);
            res.json(user);

            // TODO: Implement Passport login. OAuth2 for Google, facebook, twitter.
			//req.login(user, function(err) {
			//	if (err)
			//		return next(err);
            //
             //   // TODO : We want to return user object with auth token.
			//	return res.redirect('/');
			//});
		});
	} else {
	    console.log("No user in request body");
        res.status(401).send("Error registering user. Invalid User in request body: " + req.body);
        return;
	}
};

exports.logout = function(req, res) {
	req.logout();
	res.redirect('/');
};

exports.saveOAuthUserProfile = function(req, profile, done) {
	User.findOne({
			provider: profile.provider,
			providerId: profile.providerId
		},
		function(err, user) {
			if (err) {
				return done(err);
			}
			else {
				if (!user) {
					var possibleUsername = profile.username || ((profile.email) ? profile.email.split('@')[0] : '');
					User.findUniqueUsername(possibleUsername, null, function(availableUsername) {
						profile.username = availableUsername;
						user = new User(profile);

						user.save(function(err) {
							if (err) {
								var message = _this.getErrorMessage(err);
								req.flash('error', message);
								return res.redirect('/register');
							}

							return done(err, user);
						});
					});
				}
				else {
					return done(err, user);
				}
			}
		}
	);
};



exports.create = function(req, res, next) {	
	var user = new User(req.body);
	user.save(function(err) {
		if (err) {
			return next(err);
		}
		else {
			res.json(user);
		}
	});
};

exports.list = function(req, res, next) {
	User.find({}, function(err, users) {
		if (err) {
			return next(err);
		}
		else {
			res.json(users);
		}
	});
};

exports.read = function(req, res) {
	res.json(req.user);
};

exports.userByID = function(req, res, next, id) {
    userByID(id);
};

userByID = Promise.method(function(id) {
    console.log('finding user with id: ' + id);
    return User.findOne({
            _id: id
        },
        function(err, user) {
            if (err) {
                console.log('User.findOne error: ' + err);
                return;
            }
            else {
                console.log('Found user. Returning: ' + JSON.stringify(user));
                return user;
            }
        }
    );
});

exports.update = function(req, res, next) {
	User.findByIdAndUpdate(req.user.id, req.body, function(err, user) {
		if (err) {
			return next(err);
		}
		else {
			res.json(user);
		}
	});
};

exports.delete = function(req, res, next) {

    User.findByIdAndRemoveAsync(req.params.userId).then(function(user){
        console.log("user: " + user.username);
        var username = user.username;
        user.remove(function(err) {
            if (err) {
                return next(err);
            }
            else {
                res.send("Deleted user: " + username);
            }
        })
    }).catch(function(e){
        console.log("Error deleting user. User not found");
        return;
    });
};

// User is passed in after validated from passport authenticate call
exports.updateAuthToken = function (req, res, next, user) {
    if (user) {
        var token = auth.generateAuthToken(user);

    if (token) {
        User.findByIdAndUpdate(user._id, { authToken: token }, function (err, user) {
            if (err) next(err);
            return user;
        });
    }
}
};

// Update the GCM Reg ID for the user (client).
/**
 * This is an authenticated call. If the auth is passed, then the user will
 * be put in the request body as req.user.
 *
 * Update user.gcmRegId.
 * @param req
 * @param res
 * @param next
 * @param gcmRegId
 */
// TODO: This is assuming that there is only ever one device per user. User should have array of gcm ids.
exports.updateGcmRegId = function (req, res, next) {
    console.log("updateGcmReqId");
    var gcmRegId = req.headers['gcm-reg-id'];
    if (!gcmRegId) {
        res.status(401).send("Error updating gcm reg id. 'gcm-reg-id' header required.");
        return;
    }

    if (req.user) {
        var user = req.user;
        console.log("Attemping to update user (" + user._id + ") gcmRegId from " + user.gcmRegId + " to " + gcmRegId);
        user.gcmRegId = gcmRegId;

        user.save(function (err) {
            if (err) {
                console.log("Error saving user.");
                res.status(500).send("Error saving user. GcmRegId no updated");
            }
            else {
                var msg = "GcmRegId updated for user: " + user.username;
                console.log(msg);
                res.send(msg);
            }
        });
    } else {
        console.log("Error updating user GcmRegID. Invalid user.");
    }
};

exports.sendGcmMessage = function (req, res, next) {
    gcm.sendGcmMessageToUserId(req, res, next, req.params.userId);
};