const mongoose = require('mongoose');

const Schema = new mongoose.Schema({
    guildId: String,
    userId: String,
    expires: Date
});

module.exports = mongoose.model("tempban", Schema);