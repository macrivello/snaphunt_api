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