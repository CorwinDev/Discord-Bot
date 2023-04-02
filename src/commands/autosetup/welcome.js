const Discord = require('discord.js');

const welcomeChannel = require("../../database/models/welcomeChannels");
const welcomeRole = require("../../database/models/joinRole");
const leaveChannel = require("../../database/models/leaveChannels");

module.exports = async (client, interaction, args) => {
    const choice = interaction.options.getString('setup');

    if (choice == "welcomechannel") {
        interaction.guild.channels.create({
            name: "Bienvenue",
            type: Discord.ChannelType.GuildText
        }).then((ch) => {
            client.createChannelSetup(welcomeChannel, ch, interaction)
        })
    }

    if (choice == "welcomerole") {
        interaction.guild.roles.create({
            name: 'Membre',
            color: client.config.colors.normal
        }).then((rl) => {
            client.createRoleSetup(welcomeRole, rl, interaction)
        })
    }

    if (choice == "leavechannel") {
        interaction.guild.channels.create({
            name: "Au revoir",
            type: Discord.ChannelType.GuildText
        }).then((ch) => {
            client.createChannelSetup(leaveChannel, ch, interaction)
        })
    }
}

 