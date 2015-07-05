var config = require('./config'),
	mongoose = require('mongoose');

module.exports = function() {
	var mongooseDb = mongoose.connect(config.dbURI);

    // Load Models
    var UserDigest = require('../app/models/userdigest.server.model'),
    Theme = require('../app/models/theme.server.model'),
    Photo = require('../app/models/photo.server.model'),
    Round = require('../app/models/round.server.model'),
    User = require('../app/models/user.server.model'),
    Game = require('../app/models/game.server.model');

    var models = [require('mongoose').model('User'),
                require('mongoose').model('UserDigest'),
                require('mongoose').model('Game'),
                require('mongoose').model('Round'),
                require('mongoose').model('Photo'),
                require('mongoose').model('Theme')];


    // TODO: There is a user and pass field on mongoose db connections. use this for admin calls?
    // TODO: This needs some refactoring.
    mongooseDb.resetDb = function() {
        var db = null;
        var dbName = config.dbName;

        // TODO: db.name is not being set properly. User mongoose.connection for now.
        //for (var i = 0; i < mongooseDb.connections.length; i++) {
        //    var dbConn = mongooseDb.connections[i];
        //    console.log("db conn: " + dbConn.name);
        //
        //    if (dbConn.name == config.dbName) {
        //        db = mongooseDb.connections[i].db;
        //    }
        //}

        db = mongoose.connection;
        dbName = mongoose.connection.name;
        if (db) {
            console.log("Deleting everything in DB: " + dbName);

            //for (var key in db.collections) {
            //    console.log("dropping collection: " + key);
            //    mongoose.connection.db.dropCollection(key, function(err, result) {
            //        if (err) {
            //            console.log("Error: " + err);
            //        } else {
            //            console.log("dropped collection. " + result);
            //        }
            //    });
            //}

            for (var i = 0; i < models.length; i++) {
                var model = models[i];
                console.log("Removing all : " + model.modelName);
                model.remove({})
                    .then(function(_model) {
                        console.log("Removed all instances of " + _model);
                    }).catch(function(err) {
                        console.log("Error removing " + model + ". " + err);
                    });
            }


            return true;
        }
        return false;
        //    try {
        //        db.collectionsNames().forEach(
        //            function(collection_name) {
        //                db[collection_name].remove()
        //            }
        //        );
        //        return true;
        //    } catch (err) {
        //        console.log("Error resetting database. " + err);
        //        return false;
        //    }
        //} else {
        //    console.log("Database: " + dbName + " not found.");
        //    return false;
        //}

        //};
    }
	return mongooseDb;
};

// Testing purposes
