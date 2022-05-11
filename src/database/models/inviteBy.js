const mongoose = require('mongoose');

const Schema = new mongoose.Schema({
    Guild: String,
    inviteUser: String,
    User: String,
});

module.exports = mongoose.model("inviteBy", Schema);