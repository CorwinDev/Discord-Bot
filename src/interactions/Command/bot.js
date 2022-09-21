const { CommandInteraction, Client } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const Discord = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bot')
        .setDescription('Information about the bot')
        .addSubcommand(subcommand =>
            subcommand
                .setName('help')
                .setDescription('Get information about the bot category commands')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('info')
                .setDescription('Get information about the bot')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('ping')
                .setDescription('See the bots ping in ms')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('changelogs')
                .setDescription('Get the changelogs of the bot')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('links')
                .setDescription('Get a message with all the Bot links')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('owner')
                .setDescription('Get info about the owner')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('support')
                .setDescription('Get an invite of the support server')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('uptime')
                .setDescription('Show the bot uptime')
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

 