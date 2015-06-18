var Promise = require('bluebird');

var mongoose = Promise.promisifyAll(require('mongoose')),
    UserDigest = require('mongoose').model('UserDigest'),
    User = require('mongoose').model('User'),
    events = require('events'),
    eventEmitter = new events.EventEmitter();

/**
 * Returns list of UserDigest objects. Accepts array of query param ("id")
 * as list of ids to lookup. If no ids are given as query params, returns
 * full like of User Digest objects. ** This needs to be an admin functionality **.
 *
 * @param req
 * @param res
 * @param next
 */
exports.list = function (req, res, next) {
    console.log("listing userdigests");
    var ids = [];
    var idArr = req.query.id;
    if (idArr){
        for(var i = 0; i < idArr.length; i++) {
            ids.push(idArr[i]);
        }
    }

    UserDigest.find(ids, function(err, userdigests) {
        if (err) {
            return next(err);
        }
        else {
            res.json(userdigests);
        }
    });
};

exports.getUserDigest = function(req, res, next, id) {
    console.log("get userDigest");
    if (!id) {
        var message = "Unable to find UserDigest. Invalid id.";
        console.log(message);
        res.status(401).send(message);
        return;
    }

    // TODO: make sure gameId is in user.games
    // req.user should be valid since its an auth route.
    UserDigest.findByIdAsync(id)
        .then(function(userDigest){
            req.userdigest = userDigest;
            next();
        }).catch(function(err){
            return res.status(500).send("Error finding game by ID");
        });
};

exports.read = function(req, res, next) {
    var userdigest = req.userdigest;    // This should be populated by getGame()

    if (!userdigest)
        return res.status(500).send("Unable to read userdigest.");

    return res.json(userdigest);
}

//TODO: incorporate DB validation somewhere else. Improve performance
exports.delete = function(req, res, next) {
    console.log("Deleting all user digests that do not have valid users");
    // Delete all userDigest that do not have User
    var userDigestList = [];

    UserDigest.find({})
        .then(function(userDigests) {
            console.log("1. found userdigests: " + JSON.stringify(userDigests));
            userDigestList = userDigests;

            return User.find({})
        }).then(function(users) {
            console.log("2");

            var ids = [];
            var id;
            // if userDigestId.userId not in
            for (var i = 0; i < users.length; i++) {
                id = users[i]._id
                console.log("Adding user: " + id + " to userList");
                ids.push(id);
            }
            return ids;
        }).then(function(ids) {
            console.log("3");

            var userDigestObjectsToDelete = [];
            var ud, uid;
            for (var i = 0; i < userDigestList.length; i++) {
                ud = userDigestList[i];
                uid = ud.userId;
                if (ids.indexOf(uid) < 0){
                    console.log("No User for UserDigest: " + uid + ". Will Delete");
                    userDigestObjectsToDelete.push(uid);
                }
            }
            return userDigestObjectsToDelete;
        }).then(function (userDigestsToDelete) {
            console.log("4");

            return UserDigest.remove(userDigestsToDelete)
        }).then (function(removed) {
            console.log("Removed UserDigests");
            return res.json(removed);
        }).catch (function(e) {
            console.log("Error validating UserDigest. " + e);
            return res.send("Error validating UserDigest. " + e);
    });
};