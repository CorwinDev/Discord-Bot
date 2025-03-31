const mongoose = require('mongoose');

const Schema = new mongoose.Schema({
    Guild: String,
    Channel: String,
    Category: String,
    ChannelName: String,
    DefaultName: String,
    Theme: {
        type: String,
        default: 'default'
    },
    ChannelCount: {
        type: Number,
        default: 0
    }
});

module.exports = mongoose.model("voice", Schema);