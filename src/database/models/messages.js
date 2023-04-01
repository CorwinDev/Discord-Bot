const mongoose = require('mongoose');

const Schema = new mongoose.Schema({
    Guild: String,
    User: String,
    Messages: Number,
});

module.exports = mongoose.model("messages", Schema);