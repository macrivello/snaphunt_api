var Promise = require('bluebird');

var User = Promise.promisifyAll(require('mongoose').model('User')),
    gcm = require('node-gcm'),
    config = require('../../config/config');

var gcmSender = new gcm.Sender(config.gcmApiKey);
var _this = this;

exports.sendGcmMessageToGcmID = function (req, res, next, ids) {
    console.log("sendGcmMessageToGcmID");
    if (!ids) {
        res.status(401).send("Invalid GCM REQ ID");
        return;
    }

    var message = new gcm.Message();
    gcmSender.send(message, ids, function (err, result) {
        if (err) {
            console.log(err);
            res.json(err);
        } else {
            console.log(result);
            res.json(result);
        }
    })
};

// TODO: Pull User out of this controller. It doesnt need it. Only pass in gcm ids into this method.
exports.sendGcmMessageToUserId = function (req, res, next, userId) {
    console.log("sendGcmMessageToUserId. id: " + userId);

    if (!userId) {
        res.status(401).send("Invalid userId");
        return;
    }

    User.findOneAsync({ _id : userId}).then(function(user) {
        _this.sendGcmMessageToGcmID(req, res, next, user.gcmRegId);
    }).catch(function(e) {
        console.log("Error looking up user.");
        res.status(401).send("Error looking up user. " + e);
    });
};

/**
 *
 * @param req
 * @param res
 * @param next
 * @param users - List of user ids
 */
exports.sendGcmMessageToUsers = function (req, res, next, users) {
    console.log("sendGcmMessageToUsers");

    if (!users) {
        res.status(401).send("Invalid users");
        return;
    }

    User.findAsync({'_id': { $in: users}}).then(function(users) {
        var ids = [];
        for (user in users){
            ids.push(user.gcmRegId);
        }
        _this.sendGcmMessageToGcmId(req, res, next, ids);
    }).catch(function(e) {
        console.log("Error looking up users");
        next(e);
    });
};