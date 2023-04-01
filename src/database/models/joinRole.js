const mongoose = require('mongoose');

const Schema = new mongoose.Schema({
    Guild: String,
    Role: String,
});

module.exports = mongoose.model("joinRole", Schema);