var Promise = require('bluebird');

var mongoose = Promise.promisifyAll(require('mongoose')),
    UserDigestController = require('./userdigest.server.controller.js'),
    User = require('mongoose').model('User'),
    UserDigest = require('mongoose').model('UserDigest'),
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
    var userDigestIdOfCreator = data.userDigestIdOfCreator;
    //console.log("game: " + JSON.stringify(game));
    console.log("gameId: " + gameId);
    console.log("usernameOfCreator: " + usernameOfCreator);
    console.log("userDigestIdOfCreator: " + userDigestIdOfCreator);

    var userDigestIds = [];
    for (var i = 0; i < game.players.length; i++) {
        var userId = game.players[i];
        if (userId != userDigestIdOfCreator) {
            userDigestIds.push(userId);
        }
    }

    // TODO: Need a more efficient way to update game as invite
    UserDigest.findAsync({'_id': { $in: userDigestIds}})
        .then(function(userDigests) {
            //console.log("need to send invitations to these userdigest ids: " + userDigests);

            var userIds = [];
            for (var i = 0; i < userDigests.length; i++) {
                userIds.push(userDigests[i].userId);
            }

            return User.findAsync({_id: { $in: userIds}});
            //return User.update({_id: { $in: userIds}}, {$addToSet: {'invitations': gameId}});
        }).then(function (users){
            for (var i = 0; i < users.length; i++){
                var user = users[i];
                console.log("Adding game invite %s to user %s", gameId, user.username);
                user.invitations.push(gameId);
                user.save();
            }
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
    var userDigestIdOfCreator = data.userDigestIdOfCreator;
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
    var updatedUsers = [];
    var userDigests = [];

    for (var i = 0; i < users.length; i++) {
        var user = users[i];
        var token = auth.generateAuthToken(user);

        if (token) {
            user.authToken = token;
        }

        // TODO: add gcm token
        user.provider = 'local';
        user.salt = User.generateSalt();
        user.password = User.hashPassword(user.password, user.salt);

        // Create UserDigest
        var ud = new UserDigest();
        ud.username = user.username;
        ud.profilePhoto = user.profilePhoto;
        ud.userId = user._id;

        console.log("Setting userdigest: '%s' to user: '%s'", ud._id,  user._id);
        user.userDigest = ud._id;

        userDigests.push(ud);
        updatedUsers.push(user);
    }

    UserDigest.createAsync(userDigests)
        .then(function(userDigestsCreated) {
            return User.createAsync(updatedUsers)
        }).then(function (usersCreated) {
            for (var i = 0; i < usersCreated.length; i++) {
                var user = usersCreated[i];

                console.log("Successfully registered user: " + user.username);
            }

            res.json(user);
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

// TODO: currently remove hook middleware is not called
// which would delete the userdigest doc
exports.deleteAll = function(req, res, next) {
    console.log("Deleting all users");
    User.find({})
        .then(function (users){
            return User.remove(users)
        }).then(function(deletedUsers) {
            console.log("Deleted all users, now deleting userdigests");
            UserDigestController.delete(req, res, next);
            //res.json(deletedUsers);
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

// TODO: Refactor. Verify photo?
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

    var photoId;
    userPhoto.saveAsync()
        .then(function(_photo) {
            var photo = _photo[0];
            photoId = photo._id;
            user.profilePhoto = photoId;

            return user.saveAsync();
        }).then(function(savedUser){
            user = savedUser[0];

            return UserDigest.findAsync(user.userDigest);
        }).then(function(userDigest) {
            var ud = userDigest[0];
            ud.profilePhoto = photoId;
            return ud.saveAsync();
        }).then(function(savedUserDigest){
            console.log("Successfully updated profile photo for user: '%s' ", user._id);
            console.log("updated user: " + JSON.stringify(user));
            return res.json(savedUserDigest[0]);
        }).catch(function(err){
            var msg = "Error updating profile photo for user: " + user._id;
            console.log(err, msg);
            return res.status(500).send(err + " " + msg);
        });


};