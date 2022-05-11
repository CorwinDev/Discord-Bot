const mongoose = require('mongoose');

const Schema = new mongoose.Schema({
    Guild: String,
    Channel: String,
    Role: String,
    Logs: String,
});

module.exports = mongoose.model("verify", Schema);