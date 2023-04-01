const mongoose = require('mongoose');

const Schema = new mongoose.Schema({
    Guild: String,
    Name: String,
    Url: String
});

module.exports = mongoose.model("radios", Schema);