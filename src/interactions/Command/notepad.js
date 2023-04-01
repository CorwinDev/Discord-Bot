const { CommandInteraction, Client } = require('discord.js');
const { SlashCommandBuilder } = require('discord.js');
const Discord = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('notepad')
        .setDescription('Manage your notes')
        .addSubcommand(subcommand =>
            subcommand
                .setName('help')
                .setDescription('Get information about the search category commands')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add a note to your notepad')
                .addStringOption(option => option.setName('note').setDescription('Your note').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('delete')
                .setDescription('Delete a note from your notepad')
                .addStringOption(option => option.setName('id').setDescription('Note id').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('edit')
                .setDescription('Edit a note from your notepad')
                .addStringOption(option => option.setName('id').setDescription('Note id').setRequired(true))
                .addStringOption(option => option.setName('note').setDescription('New note').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('notes')
                .setDescription('Show all your notes')
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

 