const mongoose = require('mongoose');

const Schema = new mongoose.Schema({
    User: String,
    Author: String
});

module.exports = mongoose.model("thanksAuthor", Schema);