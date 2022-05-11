const mongoose = require('mongoose');

const Schema = new mongoose.Schema({
    User: String,
    Gender: { type: String, default: "" },
    Age: { type: String, default: "" },
    Orgin: { type: String, default: "" },
    Pets: Array,
    Songs: Array,
    Movies: Array,
    Actors: Array,
    Artists: Array,
    Food: Array,
    Hobbys: Array,
    Status: { type: String, default: "" },
    Aboutme: { type: String, default: "" },
    Color: { type: String, default: "" },
    Birthday: { type: String, default: "" },
});

module.exports = mongoose.model("Profile", Schema);