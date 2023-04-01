const mongoose = require('mongoose');

const Schema = new mongoose.Schema({
    Guild: String,
    User: String,
    Parent: { type: Array, default: null },
    Partner: { type: String, default: null },
    Children: { type: Array, default: null },
});

module.exports = mongoose.model("family", Schema);