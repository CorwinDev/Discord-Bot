const mongoose = require('mongoose');

const Schema = new mongoose.Schema({
    Guild: String,
    User: String,
    Beg: String,
    Crime: String,
    Daily: String,
    Weekly: String,
    Monthly: String,
    Hourly: String,
    Work: String,
    Rob: String,
    Fish: String,
    Hunt: String,
    Yearly: String,
    Present: String
});

module.exports = mongoose.model("economytimeout", Schema);