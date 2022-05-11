const mongoose = require('mongoose');

const Schema = new mongoose.Schema({
    Guild: String,
    Category: String,
    ChannelName: String,
    ChannelCount: { type: Number, default: 0 }
});

module.exports = mongoose.model("privatechannels", Schema);