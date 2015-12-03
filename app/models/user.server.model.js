// User Model with Authentication

//TODO: salt password, Add Token to user field.
var Promise = require('bluebird');

var mongoose = Promise.promisifyAll(require('mongoose')),
    deepPopulate = require('mongoose-deep-populate'),
    crypto = require('crypto');

Schema = mongoose.Schema;

var UserSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true },
	username: {
		type: String,
		trim: true,
		unique: true,
        index: true },
    authToken: {
        type: String,
        index: true
    },
    timeCreated: { type: Date, default: Date.now },
    timeLastModifed: { type: Date, default: Date.now },
    phoneNumber : String,
    gcmRegId: String, //This will need to be an array if users have multiple devices
    profilePhoto: { type : Schema.ObjectId, ref: 'Photo' },
	password: String,
    salt: String,
	provider: String,
	providerId: String,
	providerData: {},
	games: [{type: Schema.ObjectId, ref: 'Game'}],
    invitations: [{type: Schema.ObjectId, ref: 'Game'}] // TODO: I should probably have an invitations model
});

// Register Plugins.
// deepPopulate(plugin, options);
UserSchema.plugin(deepPopulate, null);

// TODO: Send Push notifications on Invitation updates
// TODO: There are paralell implementations available too. http://mongoosejs.com/docs/middleware.html
//UserSchema.pre('save',
//	function(next) {
//        console.log("User pre-save");
//        next();
//	}
//);
//
//
//
//UserSchema.post('save', function(doc){
//    console.log('User post-save');
//});
//
//// TODO: Currently UserDigests are created even when the User object
//// does not get created successfully. This will result in zombie userdigests.
//UserSchema.post('validate', function(doc){
//    console.log('User post-validate. Create UserDigest');
//    //Add User.userdigest.
//});

UserSchema.post =('remove', function(doc) {
    console.log('Post remove: User');
});

UserSchema.methods.authenticate = function(password) {
    return UserSchema.statics.hashPassword(password, this.salt) == this.password;
};

UserSchema.statics.generateSalt = function() {
    return crypto.randomBytes(16).toString('base64');
};

UserSchema.statics.hashPassword = function (password, salt) {
    // We use pbkdf2 to hash and iterate 10k times by default
    var iterations = 10000,
        keyLen = 64; // 64 bit.
    return crypto.pbkdf2Sync(password, salt, iterations, keyLen);
};

UserSchema.statics.findUniqueUsername = function(username, suffix, callback) {
	var _this = this;
	var possibleUsername = username + (suffix || '');

	_this.findOne(
		{username: possibleUsername},
		function(err, user) {
			if (!err) {
				if (!user) {
					callback(possibleUsername);
				}
				else {
					return _this.findUniqueUsername(username, (suffix || 0) + 1, callback);
				}
			}
			else {
				callback(null);
			}
		}
	);
};

mongoose.model('User', UserSchema);