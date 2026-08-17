const { GiveawaysManager } = require("../../packages/discord-giveaways");
const Discord = require("discord.js");
const fs = require('fs');

const giveawayModel = require("../../database/models/giveaways");

module.exports = (client) => {
    const manager = new GiveawaysManager(client, {
        default: {
            botsCanWin: false,
            embedColor: client.config.colors.normal,
            embedColorEnd: client.config.colors.error,
            reaction: '🥳'
        }
    }, true);

    client.giveawaysManager = manager;

    const events = fs.readdirSync(`./src/events/giveaway`).filter(files => files.endsWith('.js'));

    for (const file of events) {
        const event = require(`../../events/giveaway/${file}`);
        manager.on(file.split(".")[0], event.bind(null, client)).setMaxListeners(0);
    };
}