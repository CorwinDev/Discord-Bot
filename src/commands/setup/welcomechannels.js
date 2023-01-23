const Discord = require('discord.js');

const welcomeChannel = require("../../database/models/welcomeChannels");
const leaveChannel = require("../../database/models/leaveChannels");

module.exports = async (client, interaction, args) => {
    const choice = interaction.options.getString('setup');
    const channel = interaction.options.getChannel('channel');

    const choices = {
        welcomechannel : welcomeChannel,
        leavechannel : leaveChannel
    };

    client.createChannelSetup(choices[choice], channel, interaction);
}

 
