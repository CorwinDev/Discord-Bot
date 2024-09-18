const { CommandInteraction, Client } = require('discord.js');
const { SlashCommandBuilder } = require('discord.js');
const Discord = require('discord.js');

const Schema = require("../../database/models/music");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('afk')
        .setDescription('Réglez votre AFK')
        .addSubcommand(subcommand =>
            subcommand
                .setName('help')
                .setDescription('Obtenez des informations sur les commandes de la catégorie AFK')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('set')
                .setDescription('Mettez-vous AFK')
                .addStringOption(option => option.setName('reason').setDescription('La raison de votre AFK'))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('Afficher tous les utilisateurs AFK')
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

 