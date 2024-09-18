const { CommandInteraction, Client } = require('discord.js');
const { SlashCommandBuilder } = require('discord.js');
const Discord = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('birthdays')
        .setDescription('Afficher ou enregistrer un anniversaire')
        .addSubcommand(subcommand =>
            subcommand
                .setName('help')
                .setDescription('Obtenez des informations sur les commandes de la catégorie des anniversaires')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('check')
                .setDescription('Vérifiez votre anniversaire')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('delete')
                .setDescription('Supprimez votre anniversaire')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('Venez voir tous les anniversaires')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('set')
                .setDescription('Définissez votre anniversaire')
                .addNumberOption(option => option.setName('day').setDescription('Le numéro de jour qui est votre anniversaire').setRequired(true))
                .addNumberOption(option => option.setName('month').setDescription('Le numéro de mois qui est votre anniversaire').setRequired(true))
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

 