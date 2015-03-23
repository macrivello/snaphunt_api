// Theme model

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var ThemeSchema = new Schema({
    phrase: String,
    plays: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    dislikes: { type: Number, default: 0 },
    neutrals: { type: Number, default: 0 }
});

// TODO: Any preprocessing work to do?
ThemeSchema.pre('save',
    function(next) {
        next();
    }
);

mongoose.model('Theme', ThemeSchema);