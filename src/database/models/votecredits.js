const mongoose = require('mongoose');

const Schema = new mongoose.Schema({
    User: String,
    Credits: Number,
    Unlimited: Boolean
});

module.exports = mongoose.model("votecredits", Schema);