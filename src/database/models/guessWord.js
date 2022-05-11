const mongoose = require('mongoose');

const Schema = new mongoose.Schema({
    Guild: String,
    Channel: String,
    Word: { type: String, default: "start" },
});

module.exports = mongoose.model("guessWord", Schema);