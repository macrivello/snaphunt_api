var Promise = require('bluebird');

var mongoose = Promise.promisifyAll(require('mongoose'),
    User = require('mongoose').model('User')),
    UserDigest = require('mongoose').model('UserDigest'),
    jwt = require('jwt-simple'),
    moment = require('moment'),
    config = require('../../config/config');


exports.generateAuthToken = function (user) {
    console.log(JSON.stringify(user));
    if (!user || !user._id) {
        console.log("ERROR GENERATING AUTH TOKEN, INVALID USER OBJECT");
        return;
    }
    console.log('generateAuthToken user: ' + user.username);
    var expires = moment().add('days', 7).valueOf();
    var token = jwt.encode({
        iss: user._id,
        exp: expires
    }, config.jwtTokenSecret);

    return token;
};

exports.checkAuthToken = function (req, res, next) {
    console.log('auth check. path: ' + req.path);
    var path = req.path;
    if(path == '/login' || path == '/register'){
        console.log("bypassing auth check");
        return next();
    }

    var token = req.headers[config.authHeader];

    // TODO: Actually update with admin Users. Add Admin field to user object.
    if (token == 'dev'){
        console.log("Dev accessing resource, bypassing token");
        var adminUser = {};
        adminUser.admin = true;
        req.user = adminUser;
        return next();
    }

    if (token) {
        try {
            var decoded = jwt.decode(token, config.jwtTokenSecret);
            console.log('decoded token: ' + JSON.stringify(decoded));
        } catch (err) {
            console.log('Error decoding token. err: ' + err);
            res.send(401, 'Error decoding token. err: ' + err);
            return;
        }

        try{
            if (decoded.exp <= Date.now()) {
                return res.send(400, 'Access token has expired');
            } else {
                User.findOneAsync({ '_id': decoded.iss })
                    .then(function(user) {
                        console.log("Found user from token: " + user.username);
                        return user.saveAsync();
                    }).then(function(u){
                        // TODO: Investigate why promise is returning JSON array
                        var username = u[0].username;
                        console.log("Setting user '%s' in request object.", username);
                        req.user = u[0];
                        next();
                    }).catch(function (err) {
                        res.status(401).send('Error setting user in request: ' + err);
                        return;
                    });
            }

        } catch (err) {
            console.log('Error looking up user from auth token in DB. err: ' + err);
            return res.status(401).send('Invalid auth token');

            // Continue handling request
            //return next();
        }
    } else {
        return res.send(401, 'x-auth-token header required to access resource');
    }
};


