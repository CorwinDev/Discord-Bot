const mongoose = require('mongoose');

const Schema = new mongoose.Schema({
    Guild: String,
    Channels: Array
});

module.exports = mongoose.model("channellist", Schema);