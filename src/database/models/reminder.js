const mongoose = require('mongoose');

const Schema = new mongoose.Schema({
    User: String,
    Text: String,
    endTime: Number
});

module.exports = mongoose.model("reminder", Schema);