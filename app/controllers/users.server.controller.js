var Promise = require('bluebird');

var mongoose = Promise.promisifyAll(require('mongoose')),
    User = require('mongoose').model('User'),
    UserDigest = require('mongoose').model('UserDigest'),
    passport = require('passport'),
    auth = require('./auth.server.controller.js'),
    gcm = require('./gcm.server.controller.js'),
    bcrypt = Promise.promisifyAll(require('bcrypt')),
    event = require('events'),
    Events = require('../events/events.server'),
    eventEmitter = new event.EventEmitter();

process.on(Events.gameCreated, onNewGameCreated);
process.on(Events.themeSelected, onThemeSelected);

function onNewGameCreated (data) {
    console.log("Adding new game to players invitations.");
    var game = data.game;
    var gameId = data.game._id;
    var userDigestIdOfCreator = data.userDigestIdOfCreator;
    console.log("game: " + JSON.stringify(game));
    console.log("gameId: " + JSON.stringify(gameId));
    console.log("userDigestIdOfCreator: " + JSON.stringify(userDigestIdOfCreator));

    var userDigestIds = [];
    for (var i = 0; i < game.players.length; i++) {
        var userId = game.players[i];
        if (userId != userDigestIdOfCreator) {
            userDigestIds.push(userId);
        }
    }

    console.log("Searching for usersDigests: " + JSON.stringify(userDigestIds));
    UserDigest.findAsync({'_id': { $in: userDigestIds}})
        .then(function(userDigests) {
            console.log("need to send invitations to these userdigest ids: " + userDigests);

            var userIds = [];
            for (var i = 0; i < userDigests.length; i++) {
                userIds.push(userDigests[i].userId);
            }

            return User.update({_id: { $in: userIds}}, {$push: {'invitations': gameId}});
        }).then(function (users){
            // add game to invite for all users.
            console.log("Added game to players invites");
            //_this.sendGcmMessageToGcmId(req, res, next, userIds);

    }).catch(function(e) {
        console.log("Error looking up users. " + e);
    });
}

function onThemeSelected (data) {

}

var SALT_WORK_FACTOR = 10; // This was completely arbitrary


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

// TODO: Input validation with appropriate error codes.
exports.register = function(req, res, next) {
	if (req.body) {
        var users = [];

        console.log("Registering users.");
        if (req.body instanceof Array){

            for (var i = 0; i < req.body.length; i++) {
                console.log("Adding user to list: " + JSON.stringify(req.body[i]));
                users.push(new User(req.body[i]));
            }
        } else {
            console.log("Adding user to list: " + JSON.stringify(req.body));
            users.push(new User(req.body));
        }

        saveUsers(users, res, next);

    } else {
        console.log("No user in request body");
        res.status(401).send("Error registering user. Invalid User in request body: " + req.body);
    }
};

function saveUsers(users, res, next) {
// TODO: add validation check on token

    for (var i = 0; i < users.length; i++) {
        var user = users[i];
        var token = auth.generateAuthToken(user);

        if (token) {
            user.authToken = token;
        }

        // TODO: add gcm token
        user.provider = 'local';
        var salt = bcrypt.genSaltSync(10);
        user.password = bcrypt.hashSync(user.password, salt);
    }

    User.createAsync(users)
        .then(function (usersCreated) {
            for (var i = 0; i < usersCreated.length; i++) {
                var user = usersCreated[i];
                console.log("Successfully registered user: " + user.username);
            }

            res.json(usersCreated);
        }).catch(function (err) {
            console.error('Error: ' + err);
            res.status(500).send("Error registering user. " + err);
        });
}

exports.login = function(req, res, next) {
    // TODO: Update last login, plus... (more?)
    //find user, call user.authenticate(req.param.password)
    var username = req.query.username;
    var password = req.query.password;
    console.log("Login attempt - " + username + ":" + password);
    if (!username || !password) {
        res.send(401, "Username and password params required.");
        return;
    }

    // TODO: validate input

    User.findOneAsync({username : username}).then(function(user) {
        if (user.authenticate(password)) {
            console.log("Updating authtoken for user: " + user.username);

            // This method will return the updated user object
            user.authToken = auth.generateAuthToken(user);

            console.log("prior to save");
            user.save(function (err) {
                console.log("returned from user.save()");
                if (err) return next(err);
                res.json(user);
            });
        } else {
            res.send(401, "Invalid password");
        }
    }).catch(function(e) {
        res.send(401, "Error finding user: "+ username);
    });
};

exports.logout = function(req, res) {
	req.logout();
	res.redirect('/');
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

            }
            else {
                console.log('Found user. Returning: ' + JSON.stringify(user));
                return user;
            }
        }
    );
});

// TODO: Don't allow certain fields to be updates, such as userID.
// add this to middleware save hook.
exports.update = function(req, res, next) {
    console.log('Update User called. ID: ', req.user._id);

    // TODO: replace 'findbyidandupdate' with another function -- doesn't return upadated doc.
    User.findByIdAndUpdate(req.user._id, req.body, function(err, user) {

		if (err) {
            console.log('Error updating user.');
			return res.status(500).send("Error updating user: " + err);
		}
		else {
            console.log('Successfully updated user.');
			return res.json(user);
		}
	});
};

exports.delete = function(req, res, next) {
    //TODO: Delete UserDigest doc too
    User.findByIdAndRemoveAsync(req.params.userId).then(function(user){
        console.log("user: " + user.username);
        var username = user.username;
        user.remove(function(err) {
            if (err) {
                return next(err);
            } else {
                res.send("Deleted user: " + username);
            }
        })
    }).catch(function(e){
        console.log("Error deleting user. User not found");

    });
};

exports.deleteAll = function(req, res, next) {
    console.log("Deleting all users");
    User.find({})
        .then(function (users){
            return User.remove(users)
        }).then(function(deletedUsers) {
            res.json(deletedUsers);
        }).catch(function(e){
            res.status(500).send("Error deleting users: " + e);
        });
};

// User is passed in after validated from passport authenticate call
exports.updateAuthToken = function (req, res, next, user) {
    updateAuthToken(req,res,next,user);
};

function updateAuthToken(req, res, next, user) {
    console.log("Update authtoken for user: " + user.username);
    if (user) {
        var token = auth.generateAuthToken(user);

        if (token){
            user.authToken = token;
            user.lastModifed = Date.now();
            user.saveAsync()
                .spread(function(savedUser, numAffected) {
                    console.log("Updated user: " + user.username);
                    res.json(user);
                }).catch(function(err) {
                    if (err) return next(err);
                });
        } else {
            res.send(500, "Error generating token.");
        }
    } else {
        console.log("Unable to update auth token. Invalid User");
        res.send(500, "Unable to update auth token. Invalid User");
    }
}


exports.sendGcmMessage = function (req, res, next) {
            gcm.sendGcmMessageToUserId(req, res, next, req.params.userId);
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