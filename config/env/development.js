var port = 1337;
var accessKeyId = "AKIAIH6VZFD4OP3HLRSA";
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