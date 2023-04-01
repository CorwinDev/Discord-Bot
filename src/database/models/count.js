const mongoose = require('mongoose');

const Schema = new mongoose.Schema({
    Guild: String,
    User: String,
    Count: Number,
});

module.exports = mongoose.model("count", Schema);