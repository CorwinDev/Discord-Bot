const { CommandInteraction, Client } = require('discord.js');
const { SlashCommandBuilder } = require('discord.js');
const Discord = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('suggestions')
        .setDescription('Manage the suggestions')
        .addSubcommand(subcommand =>
            subcommand
                .setName('help')
                .setDescription('Get information about the suggestions category commands')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('accept')
                .setDescription('Accept a suggestion')
                .addStringOption(option => option.setName('id').setDescription('Suggestion message ID').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('deny')
                .setDescription('Deny a suggestion')
                .addStringOption(option => option.setName('id').setDescription('Suggestion message ID').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('send')
                .setDescription('Send a suggestion')
                .addStringOption(option => option.setName('suggestion').setDescription('Your suggestion').setRequired(true))
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

 