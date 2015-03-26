// Theme model

var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    random = require('mongoose-random');

var ThemeSchema = new Schema({
    phrase: { type: String, default: 0, required: true },
    plays: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    dislikes: { type: Number, default: 0 },
    neutrals: { type: Number, default: 0 },
    timeCreated: { type: Date, default: Date.now },
    timeLastModified: { type: Date, default: Date.now }
});

// Required for use of mongoose-random. Adds random value 'r' to schema
ThemeSchema.plugin(random, { path: 'r' });

// TODO: Any preprocessing work to do?
ThemeSchema.pre('save',
    function(next) {
        this.timeLastModified = Date.now();

        next();
    }
);

ThemeSchema.post('remove', function (doc) {
    // Remove references
});

mongoose.model('Theme', ThemeSchema);