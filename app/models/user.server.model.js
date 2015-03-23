// User Model with Authentication

//TODO: salt password, Add Token to user field.

var mongoose = require('mongoose'),
    userDigest = require('mongoose').model('UserDigest'),
	crypto = require('crypto'),
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
    lastModifed: { type: Date, default: Date.now },
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

// TODO: Send Push notifications on Invitation updates, Update last modifed.
UserSchema.pre('save',
	function(next) {
        // TODO: SALT PASSWORD
		if (this.password) {
			var md5 = crypto.createHash('md5');
			this.password = md5.update(this.password).digest('hex');
		}

        var user = new User(req.body);
        user.save(function(err) {
            if (err) {
                return next(err);
            }
            else {
                res.json(user);
            }
        });

        // TODO : Create UserDigest
        var userDigest = new userDigest( {
            id : this._id,
            username : this.username,
            profilePhoto : this.profilePhoto
        });
        userDigest.save(function(err){
            if (err) {
                console.log("Error creating userDigest. " + err);
            }
        });
        next();
	}
);

UserSchema.methods.authenticate = function(password) {
	var md5 = crypto.createHash('md5');
	md5 = md5.update(password).digest('hex');

	return this.password === md5;
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