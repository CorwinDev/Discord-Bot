const mongoose = require('mongoose');

const Schema = new mongoose.Schema({
    Guild: { type: String, required: true },
    Channel: { type: String, required: true },
    Owner: { type: String, required: true },
    CreatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("voiceChannels", Schema);