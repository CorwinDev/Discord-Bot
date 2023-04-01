const mongoose = require('mongoose');

const Schema = new mongoose.Schema({
    Guild: String,
    Invites: Number,
    Role: String,
});

module.exports = mongoose.model("inviteRewards", Schema);