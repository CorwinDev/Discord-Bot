const mongoose = require('mongoose');

const Schema = new mongoose.Schema({
    Guild: String,
    Message: String
});

module.exports = mongoose.model("levelmessage", Schema);