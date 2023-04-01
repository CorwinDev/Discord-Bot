const mongoose = require('mongoose');

const Schema = new mongoose.Schema({
    Guild: String,
    Words: Array
});

module.exports = mongoose.model("blacklist-words", Schema);