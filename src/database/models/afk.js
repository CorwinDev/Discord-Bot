const mongoose = require('mongoose');

const Schema = new mongoose.Schema({
    Guild: String,
    User: String,
    Message: {type: String, default: false}
});

module.exports = mongoose.model("afk", Schema);