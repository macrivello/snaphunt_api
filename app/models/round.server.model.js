// Round model

var mongoose = require('mongoose'),
    deepPopulate = require('mongoose-deep-populate'),
    states = require('./states.server.enum'),
    Schema = mongoose.Schema;

var RoundSchema = new Schema({
    roundNumber: {type: Number, default: 0},
    state: { type: String, default: states.roundStates.NOT_STARTED},
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
    // This may no longer be necessary/applicable with RoundState enum
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