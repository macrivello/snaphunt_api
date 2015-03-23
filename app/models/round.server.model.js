// Round model

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var RoundSchema = new Schema({
    active: {type: Boolean, default: false},
    themes: [{type: Schema.ObjectId, ref: 'Theme'}],
    selectedTheme: {type: Schema.ObjectId, ref: 'Theme'},
    judge: {type: Schema.ObjectId, ref: 'UserDigest'},
    winner: {type: Schema.ObjectId, ref: 'UserDigest'},
    photos:[{type: Schema.ObjectId, ref: 'Photo'}],
    winningPhoto: {type: Schema.ObjectId, ref: 'Photo'},
    timeCreated: { type: Date, default: Date.now },
    timeLastModifed: { type: Date, default: Date.now },
    timeEnded: Date,
    endTime: Date
});

// TODO: Any preprocessing work to do?
RoundSchema.pre('save',
    function(next) {
        next();
    }
);

mongoose.model('Round', RoundSchema);