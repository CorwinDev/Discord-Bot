const { CommandInteraction, Client } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const Discord = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('autosetup')
        .setDescription('Let the bot setup automatically')
        .addSubcommand(subcommand =>
            subcommand
                .setName('help')
                .setDescription('Get information about the auto setup commands')
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
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('welcome')
                .setDescription('Setup the welcome system')
                .addStringOption(option =>
                    option.setName('setup')
                        .setDescription('The setup that you want')
                        .setRequired(true)
                        .addChoice('Welcome channel', 'welcomechannel')
                        .addChoice('Welcome role', 'welcomerole')
                        .addChoice('Leave channnel', 'leavechannel')
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('customvoice')
                .setDescription('Set the custom voice channels from the server')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('ticketpanel')
                .setDescription('Set the ticket panel from the server')
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

 