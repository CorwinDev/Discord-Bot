const { CommandInteraction, Client } = require('discord.js');
const { SlashCommandBuilder } = require('discord.js');
const Discord = require('discord.js');

const Schema = require("../../database/models/music");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('family')
        .setDescription('Create a family in Bot')
        .addSubcommand(subcommand =>
            subcommand
                .setName('help')
                .setDescription('Get information about the family category commands')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('adopt')
                .setDescription('Adopt a member')
                .addUserOption(option => option.setName('user').setDescription('Select a user').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('delete')
                .setDescription('Delete your family!'),
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('disown')
                .setDescription('Disown one of your children or a parent')
                .addUserOption(option => option.setName('user').setDescription('Select a user').setRequired(true)),
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('divorce')
                .setDescription('Divorce your partner')
                .addUserOption(option => option.setName('user').setDescription('Select a user').setRequired(true)),
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('family')
                .setDescription(`See who's in someone's family!`)
                .addUserOption(option => option.setName('user').setDescription('Select a user').setRequired(false)),
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('propose')
                .setDescription('Marry a member')
                .addUserOption(option => option.setName('user').setDescription('Select a user').setRequired(true)),
        ),

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

 