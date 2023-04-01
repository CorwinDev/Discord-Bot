const Discord = require('discord.js');

const logs = require("../../database/models/logChannels");
const boostLogs = require("../../database/models/boostChannels");
const levelLogs = require("../../database/models/levelChannels");

module.exports = async (client, interaction, args) => {
    const choice = interaction.options.getString('setup');
    const channel = interaction.options.getChannel('channel');
    
    const choices = {
        serverLogs : logs,
        levelLogs : levelLogs,
        boostLogs : boostLogs
    };

    client.createChannelSetup(choices[choice], channel, interaction);
}

 
