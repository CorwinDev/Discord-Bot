const mongoose = require('mongoose');

const Schema = new mongoose.Schema({
    User: { type: String },
    FLAGS: { type: Array }
});

module.exports = mongoose.model("badges", Schema);