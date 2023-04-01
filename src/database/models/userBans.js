const mongoose = require('mongoose');

const Schema = new mongoose.Schema({
    User: String,
});

module.exports = mongoose.model("userBans", Schema);