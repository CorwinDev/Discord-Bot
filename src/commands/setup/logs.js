const Discord = require('discord.js');

const logs = require("../../database/models/logChannels");
const boostLogs = require("../../database/models/boostChannels");
const levelLogs = require("../../database/models/levelChannels");

module.exports = async (client, interaction, args) => {
    const choice = interaction.options.getString('setup');
    const channel = interaction.options.getChannel('channel');

    if (choice == "serverLogs") {
        client.createChannelSetup(logs, channel, interaction)
    }

    if (choice == "levelLogs") {
        client.createChannelSetup(levelLogs, channel, interaction)
    }

    if (choice == "boostLogs") {
        client.createChannelSetup(boostLogs, channel, interaction)
    }
}

 