const mongoose = require('mongoose');

const Schema = new mongoose.Schema({
    Guild: String,
    User: String,
    Money: Number,
    Bank: Number
});

module.exports = mongoose.model("economy", Schema);