const mongoose = require('mongoose');

const Schema = new mongoose.Schema({
    Guild: String,
    triggerName: String,
    Regex: String,
    RegexFlags: { type: String, default: null},
    Response: { type : String, default: null},
    Active: { type: Boolean, default: true },
    Deleting: { type: Boolean, default: false },
    Reply: { type: Boolean, default: true },
    Mention: { type: Boolean, default: false }
});

module.exports = mongoose.model("triggers-words", Schema);

/*
const mongoose = require('mongoose');

const Schema = new mongoose.Schema({
    Guild: String,
    Words: Array
});

module.exports = mongoose.model("blacklist-words", Schema);
*/