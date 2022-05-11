const { CommandInteraction, Client } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const Discord = require('discord.js');

const model = require('../../database/models/badge');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('developers')
        .setDescription('Commands for the Bot developers')
        .addSubcommand(subcommand =>
            subcommand
                .setName('help')
                .setDescription('Get information about the developers category commands')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('eval')
                .setDescription('Get the result of a piece of code')
                .addStringOption(option => option.setName('code').setDescription('Your code').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('badge')
                .setDescription('Manage the bot badges')
                .addBooleanOption(option => option.setName('new').setDescription('Select a boolean').setRequired(true))
                .addUserOption(option => option.setName('user').setDescription('Select a user').setRequired(true))
                .addStringOption(option => option.setName('badge').setDescription('Choose your badge').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('ban')
                .setDescription('Manage the bot bans')
                .addBooleanOption(option => option.setName('new').setDescription('Select a boolean').setRequired(true))
                .addUserOption(option => option.setName('user').setDescription('Select a user').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('credits')
                .setDescription('Manage the bot credits')
                .addStringOption(option =>
                    option.setName('type')
                        .setDescription('The type of credits')
                        .setRequired(true)
                        .addChoice('Add', 'add')
                        .addChoice('Remove', 'remove')
                )
                .addUserOption(option => option.setName('user').setDescription('Select a user').setRequired(true))
                .addNumberOption(option => option.setName('amount').setDescription('Amount of credits').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('args')
                .setDescription('Post preset messages')
                .addStringOption(option =>
                    option.setName('message')
                        .setDescription('Select a message')
                        .setRequired(true)
                        .addChoice('Information', 'information')
                        .addChoice('Rules', 'rules')
                        .addChoice('Applications', 'applications')
                        .addChoice('Booster perks', 'boosterperks')
                        .addChoice('Links', 'links')
                        .addChoice('Rewards', 'rewards')
                        .addChoice('Our bots', 'ourbots')
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('servers')
                .setDescription('See all servers from this shard')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('whitelist')
                .setDescription('Manage the bot whitelist')
                .addStringOption(option =>
                    option.setName('type')
                        .setDescription('The type of whitelist')
                        .setRequired(true)
                        .addChoice('Add', 'add')
                        .addChoice('Remove', 'remove')
                )
                .addStringOption(option => option.setName('guild').setDescription('The ID of a guild').setRequired(true))
        )
    ,

    /** 
     * @param {Client} client
     * @param {CommandInteraction} interaction
     * @param {String[]} args
     */

    run: async (client, interaction, args) => {
        model.findOne({ User: interaction.user.id }, async (err, data) => {
            if (data && data.FLAGS.includes("DEVELOPER")) {
                client.loadSubcommands(client, interaction, args);
            }
            else {
                client.errNormal({ 
                    error: "Only Bot developers are allowed to do this", 
                    type: 'reply' 
                }, interaction);
            }
        })
    },
};

 