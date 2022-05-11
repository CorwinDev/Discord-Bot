const mongoose = require('mongoose');

const Schema = new mongoose.Schema({
    Guild: String,
    Channel: String,
});

module.exports = mongoose.model("voiceChannels", Schema);