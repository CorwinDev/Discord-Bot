const mongoose = require('mongoose');

const Schema = new mongoose.Schema({
    Guild: String,
    Name: String,
    Responce: String,
    Action: { type: String, default: "Normal" },
});

module.exports = mongoose.model("customCommandsAdvanced", Schema);