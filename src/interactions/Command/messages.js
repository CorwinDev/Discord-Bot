const { CommandInteraction, Client } = require('discord.js');
const { SlashCommandBuilder } = require('discord.js');
const Discord = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('messages')
        .setDescription('View the message system')
        .addSubcommand(subcommand =>
            subcommand
                .setName('help')
                .setDescription('Get information about the message category commands')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add messages to a user')
                .addUserOption(option => option.setName('user').setDescription('Select a user').setRequired(true))
                .addNumberOption(option => option.setName('amount').setDescription('Enter a amount of messages').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('deletereward')
                .setDescription('Delete a message reward')
                .addNumberOption(option => option.setName('amount').setDescription('Enter a amount of messages').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('createreward')
                .setDescription('Create a message reward')
                .addNumberOption(option => option.setName('amount').setDescription('Enter a amount of messages').setRequired(true))
                .addRoleOption(option => option.setName('role').setDescription('The role for this reward').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove messages to a user')
                .addUserOption(option => option.setName('user').setDescription('Select a user').setRequired(true))
                .addNumberOption(option => option.setName('amount').setDescription('Enter a amount of messages').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('show')
                .setDescription('See your messages')
                .addUserOption(option => option.setName('user').setDescription('Select a user'))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('rewards')
                .setDescription('Show all message rewards')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('leaderboard')
                .setDescription('See the message leaderboard')
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

 