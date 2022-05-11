const mongoose = require('mongoose');

const Schema = new mongoose.Schema({
    Guild: String,
    Level: Number,
    Role: String,
});

module.exports = mongoose.model("levelRewards", Schema);