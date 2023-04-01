const mongoose = require('mongoose');

const Schema = new mongoose.Schema({
    Guild: String,
    User: String,
    FishingRod: { type: Boolean, default: false },
    FishingRodUsage: { type: Number, default: 0 },
});

module.exports = mongoose.model("economyItems", Schema);