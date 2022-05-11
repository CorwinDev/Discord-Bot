const { CommandInteraction, Client } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { ChannelType } = require('discord-api-types/v9');
const Discord = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stickymessages')
        .setDescription('Manage the sticky messages')
        .addSubcommand(subcommand =>
            subcommand
                .setName('help')
                .setDescription('Get information about the sticky messages category commands')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('stick')
                .setDescription('Stick an message in a channel')
                .addChannelOption(option => option.setName('channel').setDescription('Select a channel').setRequired(true).addChannelType(ChannelType.GuildText))
                .addStringOption(option => option.setName('message').setDescription('Your sticky messages').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('messages')
                .setDescription('Show all your guild sticky messages')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('unstick')
                .setDescription('Unstick an message in a channel')
                .addChannelOption(option => option.setName('channel').setDescription('Select a channel').setRequired(true).addChannelType(ChannelType.GuildText))
        )
    ,

    /** 
     * @param {Client} client
     * @param {CommandInteraction} interaction
     * @param {String[]} args
     */

    run: async (client, interaction, args) => {
        const perms = await client.checkUserPerms({
            flags: [Discord.Permissions.FLAGS.MANAGE_MESSAGES],
            perms: ["MANAGE_MESSAGES"]
        }, interaction)

        if (perms == false) return;

        client.loadSubcommands(client, interaction, args);
    },
};

 