const mongoose = require('mongoose');

const Schema = new mongoose.Schema({
    Guild: String,
    User: String,
    Birthday: String,
});

module.exports = mongoose.model("birthday", Schema);