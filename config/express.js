var Promise = require('bluebird');

var config = require('./config'),
	express = require('express'),
	bodyParser = require('body-parser'),
    morgan = require('morgan'),
    AWS = require('aws-sdk');

module.exports = function() {

    var app = express();
    var router = express.Router();

    var auth = require('../app/controllers/auth.server.controller.js');
    var gcm = require('../app/controllers/gcm.server.controller.js');

    // Configure AWS SDK
    AWS.config.update({accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey,
        region: config.region, sslEnabled: config.sslEnabled});

    var s3 = new AWS.S3();

    app.use(bodyParser.urlencoded({
		extended: true
	}));

	app.use(bodyParser.json());

    // Log all request in the Apache combined format to STDOUT
    app.use(morgan('combined'));

    // Setup page rendering. NOT NEEDED FOR API
	app.set('views', './app/views');
	app.set('view engine', 'ejs');

    // Set authToken var
    app.set('jwtTokenSecret', config.jwtTokenSecret);

    // Register routes to router

    require('../app/routes/index.server.routes.js')(app);
    var userRoutes = require('../app/routes/users.server.routes.js')(router);
    var gameRoutes = require('../app/routes/games.server.routes.js')(router);
    //var photoRoutes = require('../app/routes/photos.server.routes.js')(router);
    var themeRoutes = require('../app/routes/themes.server.routes.js')(router);
    //var roundRoutes = require('../app/routes/rounds.server.routes.js')(router);

    // Register routes on base url
    app.use('/api/v1', auth.checkAuthToken, router);

	app.use(express.static('./public'));

    /*
     TESTING ROUTEs
     */
    app.post('/test/gcm/push', function(req, res, next) {
        // Push message to phone
        gcm.sendGcmMessage(req, res, next, null);
    });

	return app;
};