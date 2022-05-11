const Discord = require('discord.js');

const logs = require("../../database/models/logChannels");
const boostLogs = require("../../database/models/boostChannels");
const levelLogs = require("../../database/models/levelChannels");

module.exports = async (client, interaction, args) => {
    const choice = interaction.options.getString('setup');

    if (choice == "serverLogs") {
        interaction.guild.channels.create("server-logs", {
            permissionOverwrites: [
                {
                    deny: 'VIEW_CHANNEL',
                    id: interaction.guild.id
                },
            ],
            type: "GUILD_TEXT"
        }).then((ch) => {
            client.createChannelSetup(logs, ch, interaction)
        })
    }

    if (choice == "levelLogs") {
        interaction.guild.channels.create("level-logs", {
            type: "GUILD_TEXT"
        }).then((ch) => {
            client.createChannelSetup(levelLogs, ch, interaction)
        })
    }

    if (choice == "boostLogs") {
        interaction.guild.channels.create("boosts", {
            type: "GUILD_TEXT"
        }).then((ch) => {
            client.createChannelSetup(boostLogs, ch, interaction)
        })
    }
}

 