const mongoose = require('mongoose');

const birthdaySchema = new mongoose.Schema({
    guild: {
        type: String,
        required: true
    },
    user: {
        type: String,
        required: true
    },
    birthday: {
        type: String,
        required: true
    },
});

const Birthday = mongoose.model("Birthday", birthdaySchema);

module.exports = Birthday;
