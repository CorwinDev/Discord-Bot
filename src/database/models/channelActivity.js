const mongoose = require('mongoose');

const Schema = new mongoose.Schema({
    Guild: String,
    Category: String,
    IsActive: { type: Boolean, default: true },
    LastCheck: { type: Date, default: Date.now }
});

module.exports = mongoose.model("channelActivity", Schema);