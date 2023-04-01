const mongoose = require('mongoose');

const Schema = new mongoose.Schema({
    Guild: String,
    Channel: String,
    Content: String,
    LastMessage: String,
});

module.exports = mongoose.model("stickymessages", Schema);