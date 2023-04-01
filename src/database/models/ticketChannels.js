const mongoose = require('mongoose');

const Schema = new mongoose.Schema({
    Guild: String,
    TicketID: Number,
    channelID: String,
    creator: String,
    claimed: String,
    resolved: { type: Boolean, default: false }
});

module.exports = mongoose.model("ticketChannels", Schema);