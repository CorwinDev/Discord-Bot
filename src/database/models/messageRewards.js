const mongoose = require('mongoose');

const Schema = new mongoose.Schema({
    Guild: String,
    Messages: Number,
    Role: String,
});

module.exports = mongoose.model("messageRewards", Schema);