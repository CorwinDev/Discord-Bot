const Discord = require('discord.js');

const welcomeChannel = require("../../database/models/welcomeChannels");
const leaveChannel = require("../../database/models/leaveChannels");

module.exports = async (client, interaction, args) => {
    const choice = interaction.options.getString('setup');
    const channel = interaction.options.getChannel('channel');

    if (choice == "welcomechannel") {
        client.createChannelSetup(welcomeChannel, channel, interaction)
    }

    if (choice == "leavechannel") {
        client.createChannelSetup(leaveChannel, channel, interaction)
    }
}

 