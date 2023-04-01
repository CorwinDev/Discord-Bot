const { CommandInteraction, Client } = require('discord.js');
const { SlashCommandBuilder } = require('discord.js');
const Discord = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('birthdays')
        .setDescription('View or register a birthday')
        .addSubcommand(subcommand =>
            subcommand
                .setName('help')
                .setDescription('Get information about the birthdays category commands')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('check')
                .setDescription('Check your birthday')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('delete')
                .setDescription('Delete your birthday')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('Get to see all birthdays')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('set')
                .setDescription('Set your birthday')
                .addNumberOption(option => option.setName('day').setDescription('The day number that is your birthday').setRequired(true))
                .addNumberOption(option => option.setName('month').setDescription('The month number that is your birthday').setRequired(true))
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

 