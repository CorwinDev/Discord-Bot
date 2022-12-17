const { CommandInteraction, Client } = require('discord.js');
const { SlashCommandBuilder } = require('discord.js');
const Discord = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('invites')
        .setDescription('View the invites system')
        .addSubcommand(subcommand =>
            subcommand
                .setName('help')
                .setDescription('Get information about the invites category commands')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add invites to a user')
                .addUserOption(option => option.setName('user').setDescription('Select a user').setRequired(true))
                .addNumberOption(option => option.setName('amount').setDescription('Enter a amount of invites').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove invites from a user')
                .addUserOption(option => option.setName('user').setDescription('Select a user').setRequired(true))
                .addNumberOption(option => option.setName('amount').setDescription('Enter a amount of invites').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('show')
                .setDescription('See your invites')
                .addUserOption(option => option.setName('user').setDescription('Select a user'))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('leaderboard')
                .setDescription('See the invites leaderboard')
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

 