var port = 1337;
var accessKeyId = "AKIAJDQANPZGLGXAV4IA";
var secretAccessKey = "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";
var region = "us-west-1";
var sslEnabled = true;

module.exports = {
	port: port,
	db: 'mongodb://localhost/snaphuntapi',
	facebook: {
		clientID: '513828288756645',
		clientSecret: '2d7cc991efddb864e9af61f307980b9a',
		callbackURL: 'http://localhost:'+ port +'/oauth/facebook/callback'
	},
	twitter: {
		clientID: 'yFntGKkvMZkDKL47XGtzLNdRA',
		clientSecret: 'EAiPTjPYLX5nrkpRtxYQflbWpRTqqLwwBHRLh7WpdQ1P69Tre6',
		callbackURL: 'http://localhost:'+ port +'/oauth/twitter/callback'
	},
    jwtTokenSecret: "(:!snaphunt!:)",
    accessKeyId: accessKeyId,
    secretAccessKey: secretAccessKey,
    region: region,
    sslEnabled: sslEnabled
    // TODO: ADD GOOGLE?
};