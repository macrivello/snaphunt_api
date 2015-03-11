var config = require('./config'),
	express = require('express'),
	bodyParser = require('body-parser'),
	passport = require('passport'),
	flash = require('connect-flash'),
	session = require('express-session'),
    morgan = require('morgan'),
    AWS = require('aws-sdk');

module.exports = function() {

    var app = express();
    var router = express.Router();

    var auth = require('../app/controllers/auth.server.controller.js');

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

    app.use(session({
		saveUninitialized: true,
		resave: true,
		secret: 'secretCoookie!?'
    }));

    // Setup page rendering. NOT NEEDED FOR API
	app.set('views', './app/views');
	app.set('view engine', 'ejs');

    // Set authToken var
    app.set('jwtTokenSecret', config.jwtTokenSecret);

	app.use(flash());
	app.use(passport.initialize());

    // Register routes to router
	require('../app/routes/index.server.routes.js')(app);
    var userApi = require('../app/routes/users.server.routes.js')(router);

    // CheckAuth on all routes except /login
    app.use('/api/v1', function (req, res, next) {
        if (req.path == '/login' || req.path == '/register') {
            return next();
        }
        auth.checkAuthToken(req, res, next);
    });

    // Register routes on base url
    app.use('/api/v1', userApi);

	app.use(express.static('./public'));

	return app;
};