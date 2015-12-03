var Users = require('./users.server.controller'),
    Themes = require('./themes.server.controller'),
    Games = require('./games.server.controller');

var Game = require('mongoose').model('Game'),
    User = require('mongoose').model('User');

var models = [require('mongoose').model('User'),
    require('mongoose').model('Game'),
    require('mongoose').model('Round'),
    require('mongoose').model('Photo'),
    require('mongoose').model('Theme')];

var mongoose = require('mongoose');

exports.resetDB = function(req, res, next) {
    resetDB().then(function() {
        res.send("Reset database successfully");
    }).catch(function(err){
        res.send("Unable to reset database");
    });
};

// TODO: There is a user and pass field on mongoose db connections. use this for admin calls?
// TODO: This needs some refactoring.
function resetDB() {
        var db = null;
        var promiseArr = [];

        // TODO: db.name is not being set properly. User mongoose.connection for now.
        db = mongoose.connection;
        if (db) {
            console.log("Deleting everything in DB: " + db);

            for (var i = 0; i < models.length; i++) {
                var model = models[i];
                console.log("Removing all : " + model.modelName);

                promiseArr.push(model.remove({}));

                    //.then(function(_model) {
                    //    console.log("Removed all instances of " + _model);
                    //}).catch(function(err) {
                    //    console.log("Error removing " + model + ". " + err);
            }

            return Promise.all(promiseArr);
        } else {
            return Promise.reject("No DB connection.");
        }
};