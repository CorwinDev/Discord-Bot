const mongoose = require('mongoose');

const EventThreadSchema = new mongoose.Schema({
    eventName: String,
    eventId: String,
    threadId: String,
});

const Schema = new mongoose.Schema({
    Guild: String,
    Channel: String,
    EventThreads: [EventThreadSchema]  // Array of event-thread mappings
});

module.exports = mongoose.model("announcement-channels", Schema);
