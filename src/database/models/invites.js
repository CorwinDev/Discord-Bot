const mongoose = require('mongoose');

const Schema = new mongoose.Schema({
    Guild: String,
    User: String,
    Invites: Number,
    Total: Number,
    Left: Number
});

module.exports = mongoose.model("invites", Schema);