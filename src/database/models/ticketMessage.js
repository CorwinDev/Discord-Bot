const mongoose = require('mongoose');

const Schema = new mongoose.Schema({
    Guild: String,
    openTicket: String,
    dmMessage: String
});

module.exports = mongoose.model("ticketMessage", Schema);