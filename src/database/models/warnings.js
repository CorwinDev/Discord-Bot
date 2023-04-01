const mongoose = require('mongoose');

const Schema = new mongoose.Schema({
    Guild: String,
    User: String,
    Warnings: [Object]
});

module.exports = mongoose.model("warnings", Schema);