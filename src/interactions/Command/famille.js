const { CommandInteraction, Client } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const Discord = require('discord.js');

const Schema = require("../../database/models/music");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('famille')
        .setDescription('Créer ta famille')
        .addSubcommand(subcommand =>
            subcommand
                .setName('help')
                .setDescription('❓ Obtenir des informations à propos des commandes famille.')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('adopter')
                .setDescription('👪 Adopter un membre.')
                .addUserOption(option => option.setName('membre').setDescription('Sélectionne une personne').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('supprimer')
                .setDescription('❌ Supprimer ta famille.'),
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('renier')
                .setDescription('💔 Renier un enfant ou un parent.')
                .addUserOption(option => option.setName('membre').setDescription('Sélectionne une personne').setRequired(true)),
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('divorcer')
                .setDescription('💔 Divorcer de ton/ta partenaire.')
                .addUserOption(option => option.setName('membre').setDescription('Sélectionne une personne').setRequired(true)),
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('voir')
                .setDescription('🔎 Voir la famille d'un membre.')
                .addUserOption(option => option.setName('membre').setDescription('Sélectionne une personne').setRequired(false)),
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('marier')
                .setDescription('💖 Marier une personne.')
                .addUserOption(option => option.setName('membre').setDescription('Sélectionne une personne').setRequired(true)),
        ),

    /** 
     * @param {Client} client
     * @param {CommandInteraction} interaction
     * @param {String[]} args
     */

    run: async (client, interaction, args) => {
        client.loadSubcommands(client, interaction, args);
    },
};

 