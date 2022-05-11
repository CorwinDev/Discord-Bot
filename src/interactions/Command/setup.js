const { CommandInteraction, Client } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { ChannelType } = require('discord-api-types/v9');
const Discord = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup')
        .setDescription('Manage the Bot setups')
        .addSubcommand(subcommand =>
            subcommand
                .setName('help')
                .setDescription('Get information about the setup category commands')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('tickets')
                .setDescription('Setup the tickets')
                .addChannelOption(option => option.setName('category').setDescription('Select a category where the tickets should come in').setRequired(true).addChannelType(ChannelType.GuildCategory))
                .addRoleOption(option => option.setName('role').setDescription('Select the support role').setRequired(true))
                .addChannelOption(option => option.setName('channel').setDescription('The channel for the ticket panel').setRequired(true).addChannelType(ChannelType.GuildText))
                .addChannelOption(option => option.setName('logs').setDescription('The channel for the ticket logs').setRequired(true).addChannelType(ChannelType.GuildText))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('customvoice')
                .setDescription('Setup the custom voice channels')
                .addChannelOption(option => option.setName('category').setDescription('Select a category where the channels come in').setRequired(true).addChannelType(ChannelType.GuildCategory))
                .addStringOption(option => option.setName('channelname').setDescription('The template for the channel names').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('logs')
                .setDescription('Set the logs from the server')
                .addStringOption(option =>
                    option.setName('setup')
                        .setDescription('The setup that you want')
                        .setRequired(true)
                        .addChoice('Server logs', 'serverLogs')
                        .addChoice('Level logs', 'levelLogs')
                        .addChoice('Boost logs', 'boostLogs')
                )
                .addChannelOption(option => option.setName('channel').setDescription('The channel for the logs').setRequired(true).addChannelType(ChannelType.GuildText))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('fun')
                .setDescription('Set the fun channels from the server')
                .addStringOption(option =>
                    option.setName('setup')
                        .setDescription('The setup that you want')
                        .setRequired(true)
                        .addChoice('Birthdays', 'birthdays')
                        .addChoice('Chatbot', 'chatbot')
                        .addChoice('Reviews', 'reviews')
                        .addChoice('Suggestions', 'suggestions')
                        .addChoice('Starboard', 'starboard')
                )
                .addChannelOption(option => option.setName('channel').setDescription('The channel for the fun').setRequired(true).addChannelType(ChannelType.GuildText))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('games')
                .setDescription('Set the game channels from the server')
                .addStringOption(option =>
                    option.setName('setup')
                        .setDescription('The setup that you want')
                        .setRequired(true)
                        .addChoice('Counting', 'counting')
                        .addChoice('Guess the number', 'gtn')
                        .addChoice('Guess the word', 'gtw')
                        .addChoice('Word snake', 'wordsnake')
                )
                .addChannelOption(option => option.setName('channel').setDescription('The channel for the game').setRequired(true).addChannelType(ChannelType.GuildText))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('welcomechannels')
                .setDescription('Setup the welcome channels')
                .addStringOption(option =>
                    option.setName('setup')
                        .setDescription('The setup that you want')
                        .setRequired(true)
                        .addChoice('Welcome channel', 'welcomechannel')
                        .addChoice('Leave channnel', 'leavechannel')
                )
                .addChannelOption(option => option.setName('channel').setDescription('The channel that you want').setRequired(true).addChannelType(ChannelType.GuildText))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('welcomerole')
                .setDescription('Setup the welcome role')
                .addRoleOption(option => option.setName('role').setDescription('The role that you want').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('ticketpanel')
                .setDescription('Setup the ticket panel')
                .addStringOption(option => option.setName('name').setDescription('The name of the ticket panel').setRequired(true))
                .addStringOption(option => option.setName('description').setDescription('The description of the ticket panel').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('deletesetup')
                .setDescription('Delete a Bot setup')
                .addStringOption(option =>
                    option.setName('setup')
                        .setDescription('The setup that you want')
                        .setRequired(true)
                        .addChoice('Tickets', 'tickets')
                        .addChoice('Custom voice', 'customvoice')
                        .addChoice('Server logs', 'serverlogs')
                        .addChoice('Level logs', 'levellogs')
                        .addChoice('Boost logs', 'boostlogs')
                        .addChoice('Birthdays', 'birthdays')
                        .addChoice('Chatbot', 'chatbot')
                        .addChoice('Reviews', 'reviews')
                        .addChoice('Suggestions', 'suggestions')
                        .addChoice('Counting', 'counting')
                        .addChoice('Guess the number', 'gtn')
                        .addChoice('Guess the word', 'gtw')
                        .addChoice('Welcome channel', 'welcomechannel')
                        .addChoice('Leave channel', 'leavechannel')
                        .addChoice('Welcome role', 'welcomerole')
                        .addChoice('Word snake', 'wordsnake')
                )
        )
    ,

    /** 
     * @param {Client} client
     * @param {CommandInteraction} interaction
     * @param {String[]} args
     */

    run: async (client, interaction, args) => {
        const perms = await client.checkUserPerms({
            flags: [Discord.Permissions.FLAGS.ADMINISTRATOR],
            perms: ["ADMINISTRATOR"]
        }, interaction)

        if (perms == false) return;

        client.loadSubcommands(client, interaction, args);
    },
};

 