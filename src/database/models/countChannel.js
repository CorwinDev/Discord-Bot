const mongoose = require('mongoose');

const Schema = new mongoose.Schema({
    Guild: String,
    Channel: String,
    Mode: { type: String, default: "hard" },
});

module.exports = mongoose.model("countChannel", Schema);