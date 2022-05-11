const mongoose = require('mongoose');

const Schema = new mongoose.Schema({
    userID: { type: String },
    guildID: { type: String },
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: new Date() }
});

module.exports = mongoose.model("Levels", Schema);