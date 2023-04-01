const mongoose = require('mongoose');

const Schema = new mongoose.Schema({
    Guild: String,
    Channel: String,
    Number: { type: String, default: "5126" },
});

module.exports = mongoose.model("guessNumber", Schema);