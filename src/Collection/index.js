const { Collection } = require("discord.js");

const blacklistedWords = new Collection();
const triggerWords = new Collection();

module.exports = { blacklistedWords, triggerWords };