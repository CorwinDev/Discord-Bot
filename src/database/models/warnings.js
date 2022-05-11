const mongoose = require('mongoose');

const Schema = new mongoose.Schema({
    Guild: String,
    User: String,
    Warns: Number
});

module.exports = mongoose.model("warnings", Schema);