const Discord = require('discord.js');

const logs = require("../../database/models/logChannels");
const boostLogs = require("../../database/models/boostChannels");
const levelLogs = require("../../database/models/levelChannels");

module.exports = async (client, interaction, args) => {
    const choice = interaction.options.getString('setup');

    const channelOptions = [
        ["serverLogs", "server-logs", logs, {
            deny: [Discord.PermissionsBitField.Flags.ViewChannel],
            id: interaction.guild.id
        }],
        ["levelLogs", "level-logs", levelLogs, {}], // No permissions needed
        ["boostLogs", "boosts", boostLogs, {}]
    ];

    for (const [choiceName, channelName, setup, permissions] of channelOptions) { // For each channel option
        if (choice == choiceName) {
            const options = {
                name: channelName,
                type: Discord.ChannelType.GuildText
            };
            if (permissions.id) { // If permissions are needed
                options.permissionOverwrites = [permissions];
            }
            interaction.guild.channels.create(options).then((ch) => { // Create the channel
                client.createChannelSetup(setup, ch, interaction);
            });
        }
    }
}

