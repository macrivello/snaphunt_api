// UserDigest Model

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var UserDigestSchema = new Schema({
    username: String,
    userId: Schema.ObjectId,
    profilePhoto: { type : Schema.ObjectId, ref: 'Photo' }
});

// TODO: Any preprocessing work to do?
UserDigestSchema.pre('save',
    function(next) {
        next();
    }
);

UserDigestSchema.post('remove', function (doc) {
    // Remove references
});

UserDigestSchema.statics.findUser = function(callback) {
    var _this = this;

    // First try id, then username
    //var query = this.id ? User.findOne({_id : this.id}) : User.findOne({username : this.username});
    //
    //query.exec(function(err, user) {
    //        if (!err && !user) {
    //            callback(user);
    //        } else {
    //            callback(null);
    //        }
    //    }
    //);
};

mongoose.model('UserDigest', UserDigestSchema);