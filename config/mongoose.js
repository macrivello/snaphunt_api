var config = require('./config'),
	mongoose = require('mongoose');

module.exports = function() {
	var db = mongoose.connect(config.db);

    // Load Models
    require('../app/models/userdigest.server.model');
    require('../app/models/theme.server.model');
    require('../app/models/photo.server.model');
    require('../app/models/round.server.model');
    require('../app/models/game.server.model');
    require('../app/models/user.server.model');

	return db;
};