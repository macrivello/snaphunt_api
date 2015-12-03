var Promise = require('bluebird');

var mongoose = Promise.promisifyAll(require('mongoose')),
    User = require('mongoose').model('User'),
    Photo = require('mongoose').model('Photo'),
    passport = require('passport'),
    auth = require('./auth.server.controller.js'),
    gcm = require('./gcm.server.controller.js'),
    event = require('events'),
    Events = require('../events/events.server'),
    eventEmitter = new event.EventEmitter();

process.on(Events.gameCreated, onNewGameCreated);
process.on(Events.themeSelected, onThemeSelected);

function onNewGameCreated (data) {
    console.log("Adding new game to players invitations.");
    var game = data.game;
    var gameId = data.game._id;
    var usernameOfCreator = data.usernameOfCreator;
    var userIdOfCreator = data.userIdOfCreator;

    console.log("gameId: " + gameId);
    console.log("usernameOfCreator: " + usernameOfCreator);
    console.log("userIdOfCreator: " + userIdOfCreator);

    var userIds = [];
    for (var i = 0; i < game.players.length; i++) {
        var userId = game.players[i];
        if (userId != userIdOfCreator) {
            userIds.push(userId);
        }
    }

    // TODO: Need a more efficient way to update game as invite
    User.findAsync({'_id': { $in: userIds}})
        .then(function (users){
            for (var i = 0; i < users.length; i++){
                var user = users[i];
                console.log("Adding game invite %s to user %s", gameId, user.username);
                user.invitations.push(gameId);
                user.save();
            }

            // TODO: Emit event for new invites
            // add game to invite for all users.
            //console.log("Updated users with game invite");

            //_this.sendGcmMessageToGcmId(req, res, next, userIds);
    }).catch(function(e) {
        console.log("Error looking up users. " + e);
    });
}

function onThemeSelected (data) {
    console.log("onThemeSelected");
    var game = data.game;
    var userIdOfCreator = data.userIdOfCreator;
}

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

exports.getUser = function(req, res, next, id) {
    console.log("getUser");
    if (!id) {
        var message = "Unable to find user. Invalid id.";
        console.log(message);
        res.status(401).send(message);
        return;
    }

    // TODO: make sure gameId is in user.games
    // req.user should be valid since its an auth route.
    User.findByIdAsync(id)
        .then(function(user){
            req.user = user;
            next();
        }).catch(function(err){
            return res.status(500).send(err, "Error finding user by ID");
        });
};

// TODO: Input validation with appropriate error codes.
exports.register = function(req, res, next) {
	if (req.body) {
        var user, users = [];

        console.log("Registering users.");
        if (req.body instanceof Array){


            for (var i = 0; i < req.body.length; i++) {
                console.log("Adding user to list: " + JSON.stringify(req.body[i]));


                user = new User(req.body[i]);
                users.push(user);
            }
        } else {
            console.log("Adding user to list: " + JSON.stringify(req.body));
            user = new User(req.body);
            users.push(user);

            var token = auth.generateAuthToken(user);

            if (token) {
                user.authToken = token;
            }

            // TODO: add gcm token
            user.provider = 'local';
            user.salt = User.generateSalt();
            user.password = User.hashPassword(user.password, user.salt);

            User.createAsync(user).then(function (userCreated) {
                console.log("Successfully registered user: " + userCreated.username);
                res.json(user);
            }).catch(function (err) {
                console.log("Error registering user. " + err);
                res.status(500).send("Error registering user. " + err);
            });
        }

        //TODO: Only allow 1 user to be registered at a time.
        // This will return an Array, Return only 1st in array for now. This function will be refactored
        // to only allow one user to be registered.
        //exports.saveUsers(users).then(function(_users) {
        //    var user = _users[0];
        //
        //    res.json(user);
        //}).catch(function(err){
        //    console.log("Error registering user. " + err);
        //    res.status(500).send("Error registering user. " + err);
        //});

    } else {
        console.log("No user in request body");
        res.status(401).send("Error registering user. Invalid User in request body: " + req.body);
    }
};

exports.saveUsers = function(_users) {
    return new Promise(function(resolve, reject) {
        // TODO: add validation check on token
        var _this = this;
        var users = [];

        for (var i = 0; i < _users.length; i++) {
            var user = _users[i];
            var token = auth.generateAuthToken(user);

            if (token) {
                user.authToken = token;
            }

            // TODO: add gcm token
            user.provider = 'local';
            user.salt = User.generateSalt();
            user.password = User.hashPassword(user.password, user.salt);

            users.push(user);
        }

        User.createAsync(users)
            }).then(function (usersCreated) {
            for (var i = 0; i < usersCreated.length; i++) {
                var user = usersCreated[i];
                console.log("Successfully registered user: " + user.username);
            }

            _this.resolve(usersCreated);
        }).catch(function (err) {
            _this.reject(err);
        });
};

exports.login = function(req, res, next) {
    // TODO: Update last login, plus... (more?)
    //find user, call user.authenticate(req.param.password)
    var username = req.query.username;
    var password = req.query.password;
    console.log("Login attempt - " + username);
    if (!username || !password) {
        res.status(401).send("Username and password params required.");
        return;
    }

    // TODO: validate input

    User.findOne({username : username}).then(function(user) {


        console.log("found user : " + user.username);
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
            console.log("Password check failed");
            res.status(401).send("Invalid password");
        }
    }).catch(function(e) {
        console.log(e);
        res.status(401).send("Error finding user: "+ username);
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

// TODO: Refactor
exports.list = function(req, res, next) {
    if (req.query.id){
        var ids = [];

        if (req.query.id instanceof Array){
            ids = req.query.id;
        } else {
            ids.push(req.query.id);
        }

        User.find({ _id : { $in : ids}}, function(err, users) {
            if (err) {
                return next(err);
            }
            else {
                res.json(users);
            }
        });
    } else {
        User.find({}, function(err, users) {
            if (err) {
                return next(err);
            }
            else {
                res.json(users);
            }
        });
    }
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
                console.log('Found user. Returning user');
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

// TODO: currently remove hook middleware is not called
// which would delete the userdigest doc
exports.deleteAll = function(req, res, next) {
    console.log("Deleting all users");
    User.find({})
        .then(function (users){
            return User.remove(users)
        }).then(function(deletedUsers) {
            console.log("Deleted all users, now deleting userdigests");
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
            res.status(500).send("Error generating token.");
        }
    } else {
        console.log("Unable to update auth token. Invalid User");
        res.status(500).send("Unable to update auth token. Invalid User");
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

// TODO: Refactor. Verify photo?
/**
 *
 * @param req
 * @param res
 * @param next
 * @returns {*} Url of new profile photo.
 */
exports.updateProfilePhoto = function (req, res, next) {
    console.log("update User ProfilePhoto");
    var user = req.user;
    var userPhoto = new Photo(req.body);

    console.log("new profile photo: " + JSON.stringify(userPhoto));

    if(!user){
        console.log("Invalid user");
        return res.status(400).send("Unable to update photo for user. Invalid user in request");
    }

    // TODO: Delete off of S3
    var existingProfilePhoto = user.profilePhoto;
    if (existingProfilePhoto) {
        console.log("removing old profile photo: " + existingProfilePhoto);
        Photo.find(existingProfilePhoto)
            .then(function (photo) {
                photo.remove();
            }).catch(function (err){
                console.log("Error deleting photo. " + err);
            });
    }

    var photo;
    userPhoto.saveAsync()
        .then(function(_photo) {
            photo = _photo[0];
            user.profilePhoto = photo._id;

            return user.saveAsync();
        }).then(function(savedUser){
            user = savedUser[0];

            console.log("Successfully updated profile photo for user: '%s' ", user._id);
            console.log("updated user: " + JSON.stringify(user));
            return res.send(photo.url);
        }).catch(function(err){
            var msg = "Error updating profile photo for user: " + user._id;
            console.log(err, msg);
            return res.status(500).send(err + " " + msg);
        });


};