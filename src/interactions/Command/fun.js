const { CommandInteraction, Client } = require('discord.js');
const { SlashCommandBuilder } = require('discord.js');
const Discord = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('fun')
        .setDescription('Run fun commands in Bot')
        .addSubcommand(subcommand =>
            subcommand
                .setName('help')
                .setDescription('Get information about the fun category commands')
        )

        // Meme Commands

        .addSubcommandGroup((group) =>
            group
                .setName('meme')
                .setDescription('See all the fun meme commands in Bot')
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('confused')
                        .setDescription('React with a Confused Nick Young meme')
                )
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('cleverrate')
                        .setDescription('See how much clever you are')
                )
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('dinochrome')
                        .setDescription('Dinosaur in Chrome')
                )
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('epicgamerrate')
                        .setDescription('See how much of an epic gamer you are')
                )
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('howgay')
                        .setDescription('See how gay you are')
                )
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('roast')
                        .setDescription('Roasts a user')
                        .addUserOption(option => option.setName('user').setDescription('Select a user').setRequired(true))
                )
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('simprate')
                        .setDescription('See how simp you are')
                )
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('stankrate')
                        .setDescription('See how stanky you are')
                )
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('rickroll')
                        .setDescription('Get a rickroll')
                )
        )

        // User Commands

        .addSubcommandGroup((group) =>
            group
                .setName('user')
                .setDescription('See all the fun user commands in Bot')
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('hack')
                        .setDescription('Hack your friends or enemies!')
                        .addUserOption(option => option.setName('user').setDescription('Select a user').setRequired(true))
                )
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('hug')
                        .setDescription('Give a hug to a user')
                        .addUserOption(option => option.setName('user').setDescription('Select a user').setRequired(true))
                )
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('kill')
                        .setDescription('Kill a user')
                        .addUserOption(option => option.setName('user').setDescription('Select a user').setRequired(true))
                )
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('lovemeter')
                        .setDescription('See how much you fit in with someone')
                        .addUserOption(option => option.setName('user1').setDescription('Select a user').setRequired(true))
                        .addUserOption(option => option.setName('user2').setDescription('Select a user').setRequired(true))
                )
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('sudo')
                        .setDescription('Say something like someone else')
                        .addUserOption(option => option.setName('user').setDescription('Select a user').setRequired(true))
                        .addStringOption(option => option.setName('text').setDescription('Enter a text').setRequired(true))
                )
        )

        // Text Commands

        .addSubcommandGroup((group) =>
            group
                .setName('text')
                .setDescription('See all the fun text commands in Bot')
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('ascii')
                        .setDescription('Make ascii text')
                        .addStringOption(option => option.setName('text').setDescription('Enter a text').setRequired(true))
                )
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('gif')
                        .setDescription('Search a gif')
                        .addStringOption(option => option.setName('text').setDescription('Enter a text').setRequired(true))
                )
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('reverse')
                        .setDescription('Reverse your text')
                        .addStringOption(option => option.setName('text').setDescription('Enter a text').setRequired(true))
                )
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('say')
                        .setDescription('Have the bot say something')
                        .addStringOption(option => option.setName('text').setDescription('Enter a text').setRequired(true))
                )
        )

        // Extra Commands

        .addSubcommandGroup((group) =>
            group
                .setName('extra')
                .setDescription('See all the fun extra commands in Bot')
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('birdfact')
                        .setDescription('Get a random bird fact')
                )
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('catfact')
                        .setDescription('Get a random cat fact')
                )
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('dogfact')
                        .setDescription('Get a random dog fact')
                )
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('fact')
                        .setDescription('Get a random fact')
                )
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('koalafact')
                        .setDescription('Get a random koalafact fact')
                )
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('pandafact')
                        .setDescription('Get a random pandafact fact')
                )
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('token')
                        .setDescription('Get my token')
                )
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('worldclock')
                        .setDescription('Shows the world clock(s)')
                )
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('xmas')
                        .setDescription('See the number of days until Christmas')
                )
        ),

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

 