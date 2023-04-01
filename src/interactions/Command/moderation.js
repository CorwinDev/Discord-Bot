const { CommandInteraction, Client } = require('discord.js');
const { SlashCommandBuilder } = require('discord.js');
const { ChannelType } = require('discord.js');
const Discord = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('moderation')
        .setDescription('Manage all server moderation')
        .addSubcommand(subcommand =>
            subcommand
                .setName('help')
                .setDescription('Get information about the moderation category commands')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('ban')
                .setDescription('Ban a user')
                .addUserOption(option => option.setName('user').setDescription('Select a user').setRequired(true))
                .addStringOption(option => option.setName('reason').setDescription('The reason for the ban'))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('clear')
                .setDescription('Clear messages')
                .addNumberOption(option => option.setName('amount').setDescription('Amount of messages').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('clearuser')
                .setDescription('Clear user messages in a channel')
                .addUserOption(option => option.setName('user').setDescription('Select a user').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('demote')
                .setDescription('Demote a user')
                .addUserOption(option => option.setName('user').setDescription('Select a user').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('kick')
                .setDescription('Kick a user')
                .addUserOption(option => option.setName('user').setDescription('Select a user').setRequired(true))
                .addStringOption(option => option.setName('reason').setDescription('The reason for the kick'))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('lock')
                .setDescription('Lock a channel')
                .addChannelOption(option => option.setName('channel').setDescription('Select a channel').addChannelTypes(ChannelType.GuildText))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('lockdown')
                .setDescription('Lock all channels')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('nuke')
                .setDescription('Nuke a channel')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('softban')
                .setDescription('Softban a user')
                .addUserOption(option => option.setName('user').setDescription('Select a user').setRequired(true))
                .addStringOption(option => option.setName('reason').setDescription('The reason for the ban'))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('timeout')
                .setDescription('Timeout a user')
                .addUserOption(option => option.setName('user').setDescription('Select a user').setRequired(true))
                .addNumberOption(option => option.setName('time').setDescription('Number of minutes').setRequired(true))
                .addStringOption(option => option.setName('reason').setDescription('Reason for the time out').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('tempban')
                .setDescription('Temp ban a user')
                .addUserOption(option => option.setName('user').setDescription('Select a user').setRequired(true))
                .addNumberOption(option => option.setName('time').setDescription('Number of minutes').setRequired(true))
                .addStringOption(option => option.setName('reason').setDescription('The reason for the ban'))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('unlock')
                .setDescription('Unlock a channel')
                .addChannelOption(option => option.setName('channel').setDescription('Select a channel').addChannelTypes(ChannelType.GuildText))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('unban')
                .setDescription('Unban a user')
                .addStringOption(option => option.setName('user').setDescription('Give a user id').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('banlist')
                .setDescription('Get all banned users')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('warn')
                .setDescription('Warn a user')
                .addUserOption(option => option.setName('user').setDescription('Select a user').setRequired(true))
                .addStringOption(option => option.setName('reason').setDescription('The reason for the warn').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('unwarn')
                .setDescription('Unwarn a user')
                .addUserOption(option => option.setName('user').setDescription('Select a user').setRequired(true))
                .addIntegerOption(option => option.setName('case').setDescription('Give a case number').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('warnings')
                .setDescription('See a users warnings')
                .addUserOption(option => option.setName('user').setDescription('Select a user').setRequired(true))
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

 