const { CommandInteraction, Client } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { ChannelType } = require('discord-api-types/v9');
const Discord = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('announcement')
        .setDescription('Manage the server announcements')
        .addSubcommand(subcommand =>
            subcommand
                .setName('help')
                .setDescription('Get information about the announcement category commands')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('Make an announcement')
                .addChannelOption(option => option.setName('channel').setDescription('Select a channel').setRequired(true).addChannelType(ChannelType.GuildText).addChannelType(ChannelType.GuildNews))
                .addStringOption(option => option.setName('message').setDescription('Your announcement message').setRequired(true)),
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('edit')
                .setDescription('Edit an announcement')
                .addStringOption(option => option.setName('id').setDescription('ID of the announcement you want to change').setRequired(true))
                .addStringOption(option => option.setName('message').setDescription('Your announcement message').setRequired(true)),
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

 