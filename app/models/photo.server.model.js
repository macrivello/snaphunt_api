// Photo model

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var PhotoSchema = new Schema({
    owner: {type: Schema.ObjectId, ref: 'UserDigest'},
    url: String,
    urlThumb: String,
    size: Number, //bytes
    sizeThumb: Number, //bytes
    md5: String,
    md5Thumb: String,
    theme: [{type: Schema.ObjectId, ref: 'Theme'}],
    timeCreated: { type: Date, default: Date.now },
    timeLastModifed: { type: Date, default: Date.now }
});

// TODO: Any preprocessing work to do?
PhotoSchema.pre('save',
    function(next) {
        next();
    }
);

mongoose.model('Photo', PhotoSchema);