const mongoose = require('mongoose');

const Schema = new mongoose.Schema({
    Guild: String,
    Channel: String,
    lastWord: String,
});

module.exports = mongoose.model("wordsnake", Schema);