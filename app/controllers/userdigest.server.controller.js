var Promise = require('bluebird');

var mongoose = Promise.promisifyAll(require('mongoose')),
    UserDigest = require('mongoose').model('UserDigest'),
    events = require('events'),
    eventEmitter = new events.EventEmitter();

exports.list = function (req, res, next) {
    console.log("listing userdigests");
    UserDigest.find({}, function(err, userdigests) {
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