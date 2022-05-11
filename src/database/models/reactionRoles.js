const mongoose = require('mongoose');

const Schema = new mongoose.Schema({
    Guild: String,
    Message: String,
    Category: String,
    Roles: Object
});

module.exports = mongoose.model("reactionRoles", Schema);