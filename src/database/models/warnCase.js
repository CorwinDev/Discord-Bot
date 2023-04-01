const mongoose = require('mongoose');

const Schema = new mongoose.Schema({
    Guild: String,
    Case: Number
});

module.exports = mongoose.model("warnCase", Schema);