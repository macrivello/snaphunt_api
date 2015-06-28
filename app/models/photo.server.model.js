// Photo model

var mongoose = require('mongoose'),
    deepPopulate = require('mongoose-deep-populate'),
    Schema = mongoose.Schema;

var PhotoSchema = new Schema({
    owner: {type: Schema.ObjectId, ref: 'User'},
    url: String,
    urlThumb: String,
    size: Number, //bytes
    sizeThumb: Number, //bytes
    hash: String,
    hashThumb: String,
    theme: {type: Schema.ObjectId, ref: 'Theme'},
    timeCreated: { type: Date, default: Date.now }
});

// Register Plugins.
// deepPopulate(plugin, options);
PhotoSchema.plugin(deepPopulate, null);

// TODO: Any preprocessing work to do?
PhotoSchema.pre('save',
    function(next) {
        this.timeLastModifed = Date.now();

        next();
    }
);

PhotoSchema.post('remove', function (doc) {
    // Remove references
});


mongoose.model('Photo', PhotoSchema);