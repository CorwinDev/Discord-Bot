const { CommandInteraction, Client } = require('discord.js');
const { SlashCommandBuilder } = require('discord.js');
const Discord = require('discord.js');

const Schema = require("../../database/models/music");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('afk')
        .setDescription('Set your AFK')
        .addSubcommand(subcommand =>
            subcommand
                .setName('help')
                .setDescription('Get information about the afk category commands')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('set')
                .setDescription('Put yourself AFK')
                .addStringOption(option => option.setName('reason').setDescription('The reason for your AFK'))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('Show all afk users')
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

 