const mongoose = require('mongoose');

const Schema = new mongoose.Schema({
    Guild: String,
    boostMessage: String,
    unboostMessage: String,
});

module.exports = mongoose.model("boostMessage", Schema);