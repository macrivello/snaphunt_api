// Load required packages
var User = require('mongoose').model('User'),
    jwt = require('jwt-simple'),
    moment = require('moment'),
    config = require('../../config/config');



exports.generateAuthToken = function (user) {
    if (!user || !user._id) {
        console.log("ERROR GENERATING AUTH TOKEN, INVALID USER OBJECT");
        return;
    }
    console.log('generateAuthToken user: ' + JSON.stringify(user));
    var expires = moment().add('days', 7).valueOf();
    var token = jwt.encode({
        iss: user._id,
        exp: expires
    }, config.jwtTokenSecret);

    return token;
};

exports.checkAuthToken = function (req, res, next) {
    console.log('auth check');
    var token = req.headers['x-auth-token'];
    console.log(token);
    if (token) {
        try {
            var decoded = jwt.decode(token, config.jwtTokenSecret);
            console.log('decoded token: ' + JSON.stringify(decoded));
        } catch (err) {
            console.log('Error decoding token. err: ' + err);
            return;
        }

        try{
            if (decoded.exp <= Date.now()) {
                res.send(400, 'Access token has expired');
            } else {
                User.findOne({ _id: decoded.iss }, function(err, user) {
                    if (err) {
                        res.send(401, 'Error in User.findOne. err: ' + err);
                        return;
                    }

                    if (user) {
                        console.log ("got user in authcheck: " + JSON.stringify(user));
                        req.user = user;
                        next();
                        return;
                    } else {
                        res.send(401, 'No user associated with auth token.');

                    }
                });
            }

        } catch (err) {
            console.log('Error looking up user from auth token in DB. err: ' + err);
            res.status(401).send('Invalid auth token');

            // Continue handling request
            //return next();
        }
    } else {
        res.send(401, 'x-auth-token header required to access resource');
    }
};


