// Round model

var mongoose = require('mongoose'),
    deepPopulate = require('mongoose-deep-populate'),
    Schema = mongoose.Schema;

var roundStates = {
    //mongoose expect values for enum type
    NOT_STARTED: "NOT_STARTED",
    PLAYING: "PLAYER",
    JUDGE_SELECTION: "JUDGE_SELECTION",
    ENDED: "ENDED",

    // this seems weird but I'm pleasing mongoose
    values: [this.NOT_STARTED,
            this.PLAYING,
            this.JUDGE_SELECTION,
            this.ENDED]
};

var RoundSchema = new Schema({
    roundNumber: {type: Number, default: 0},
    state: { type: String, enum: roundStates, default: roundStates.NOT_STARTED},
    themes: [{type: Schema.ObjectId, ref: 'Theme'}],
    selectedTheme: {type: Schema.ObjectId, ref: 'Theme'},
    judge: {type: Schema.ObjectId, ref: 'User'},
    winner: {type: Schema.ObjectId, ref: 'User'},
    photos:[{type: Schema.ObjectId, ref: 'Photo'}],
    winningPhoto: {type: Schema.ObjectId, ref: 'Photo'},
    timeCreated: { type: Date, default: Date.now },
    timeLastModifed: { type: Date, default: Date.now },
    timeEnded: Date,
    roundExpires: Date,
    allPhotosSubmitted: {type: Boolean, default: false}
});

// Register Plugins.
// deepPopulate(plugin, options);
RoundSchema.plugin(deepPopulate, null);

// TODO: Any preprocessing work to do?
RoundSchema.pre('save',
    function(next) {
        next();
    }
);


RoundSchema.post('remove', function (doc) {
    // Remove references
});


mongoose.model('Round', RoundSchema);