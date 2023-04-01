const { CommandInteraction, Client } = require('discord.js');
const { SlashCommandBuilder } = require('discord.js');
const Discord = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('guild')
        .setDescription('Manage the guild')
        .addSubcommand(subcommand =>
            subcommand
                .setName('help')
                .setDescription('Get information about the guild category commands')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('channelinfo')
                .setDescription('Get information about a channel')
                .addChannelOption(option => option.setName('channel').setDescription('Select a channel').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('members')
                .setDescription('See how many members there are in this server')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('oldestmember')
                .setDescription('Get the oldest account creation date in the guild')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('roleinfo')
                .setDescription('Get info about a role')
                .addRoleOption(option => option.setName('role').setDescription('Select a role').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('info')
                .setDescription('Get all info about the current server')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('stealemoji')
                .setDescription('Steal an emoji')
                .addStringOption(option => option.setName('emoji').setDescription('Enter an emoji to steal').setRequired(true))
                .addRoleOption(option => option.setName('role').setDescription('Select a role').setRequired(false))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('youngestmember')
                .setDescription('Get the youngest account creation date in the guild')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('userinfo')
                .setDescription('Get all info about a user')
                .addUserOption(option => option.setName('user').setDescription('Select a user').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('inviteinfo')
                .setDescription('Get all info about a invite')
                .addStringOption(option => option.setName('invite').setDescription('Enter a invite code').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('emojis')
                .setDescription('See the guild emojis')
        )
    ,

    /** 
     * @param {Client} client
     * @param {CommandInteraction} interaction
     * @param {String[]} args
     */

    run: async (client, interaction, args) => {
        await interaction.deferReply({ fetchReply: true });
        client.loadSubcommands(client, interaction, args);
    },
};

 