const { CommandInteraction, Client } = require('discord.js');
const { SlashCommandBuilder } = require('discord.js');
const Discord = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('casino')
        .setDescription('Jouer au jeu du casino')
        .addSubcommand(subcommand =>
            subcommand
                .setName('help')
                .setDescription('Obtenez des informations sur les commandes de catégorie de casino')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('blackjack')
                .setDescription('Jouez à un jeu de blackjack pour gagner de l\'argent')
                .addNumberOption(option => option.setName('amount').setDescription('Entrez un montant').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('crash')
                .setDescription('Plus de risques, plus de récompense')
                .addNumberOption(option => option.setName('amount').setDescription('Entrez un montant').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('roulette')
                .setDescription('Jouer à la roulette')
                .addStringOption(option => option.setName('color').setDescription('Entrez dans une couleur hexagonale').setRequired(true))
                .addNumberOption(option => option.setName('amount').setDescription('Entrez un montant').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('slots')
                .setDescription('Jouer à des créneaux')
                .addNumberOption(option => option.setName('amount').setDescription('Entrez un montant').setRequired(true))
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

 