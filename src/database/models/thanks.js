const mongoose = require('mongoose');

const Schema = new mongoose.Schema({
    User: String,
    UserTag: String,
    Received: Number
});

module.exports = mongoose.model("thanks", Schema);