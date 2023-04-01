const { CommandInteraction, Client } = require('discord.js');
const { SlashCommandBuilder } = require('discord.js');
const Discord = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('voice')
        .setDescription('Manage the voice channels')
        .addSubcommand(subcommand =>
            subcommand
                .setName('help')
                .setDescription('Get information about the voice category commands')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('limit')
                .setDescription('Limit your custom voice channel')
                .addNumberOption(option => option.setName('limit').setDescription('Enter a limit').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('lock')
                .setDescription('Lock your custom voice channel')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('rename')
                .setDescription('Rename your custom voice channel')
                .addStringOption(option => option.setName('name').setDescription('New voice name').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('unlock')
                .setDescription('Unlock your custom voice channel')
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

 