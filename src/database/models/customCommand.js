const mongoose = require('mongoose');

const Schema = new mongoose.Schema({
    Guild: String,
    Name: String,
    Responce: String,
});

module.exports = mongoose.model("customCommands", Schema);