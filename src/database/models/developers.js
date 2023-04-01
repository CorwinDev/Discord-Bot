const mongoose = require('mongoose');

const Schema = new mongoose.Schema({
    Action: String,
    Date: String
});

module.exports = mongoose.model("developers", Schema);