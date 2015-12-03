var config = require('./config'),
	mongoose = require('mongoose');

module.exports = function() {
	var mongooseDb = mongoose.connect(config.dbURI);

    // Load Models
    var Theme = require('../app/models/theme.server.model'),
    Photo = require('../app/models/photo.server.model'),
    Round = require('../app/models/round.server.model'),
    User = require('../app/models/user.server.model'),
    Game = require('../app/models/game.server.model');

    return mongooseDb;
};