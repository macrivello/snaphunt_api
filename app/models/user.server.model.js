// User Model with Authentication

//TODO: salt password, Add Token to user field.
var Promise = require('bluebird');

var mongoose = Promise.promisifyAll(require('mongoose')),
    UserDigest = require('mongoose').model('UserDigest'),
    deepPopulate = require('mongoose-deep-populate'),
    bcrypt = Promise.promisifyAll(require('bcrypt')),
	Schema = mongoose.Schema,
    SALT_WORK_FACTOR = 10; // This was completely arbitrary

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
    userDigest: { type: Schema.ObjectId, ref: 'UserDigest'},
    timeCreated: { type: Date, default: Date.now },
    timeLastModifed: { type: Date, default: Date.now },
    phoneNumber : String,
    gcmRegId: String, //This will need to be an array if users have multiple devices
    profilePhoto: { type : Schema.ObjectId, ref: 'Photo' },
	password: String,
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
UserSchema.pre('save',
	function(next) {
        console.log("USER pre-save DB hook");

        var user = this; // 'this' refers to the document that is being saved
        user.lastModifed = Date.now();

        if (user.isModified('_id') || user.isModified('username') || user.isModified('profilePhoto')) {
            console.log("creating userdigest for: " + user.username);

            // Update userDigest
            var userDigest = new UserDigest({
                id: user._id,
                username: user.username,
                profilePhoto: user.profilePhoto
            });

            userDigest.saveAsync()
                .spread(function (savedUserDigest, numAffected) {
                    user.userDigest = savedUserDigest._id;
                    user.lastModifed = Date.now();
                    return next();
                }).catch(function (err) {
                    console.log("Error: " + err);
                    return next(err);
                });
        } else {
            return next();
        }
	}
);


UserSchema.methods.authenticate = function(password, cb) {
    return bcrypt.compareSync(password, this.password);
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

UserSchema.post('remove', function (doc) {
    // Remove references
});

mongoose.model('User', UserSchema);