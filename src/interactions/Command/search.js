const { CommandInteraction, Client } = require('discord.js');
const { SlashCommandBuilder } = require('discord.js');
const Discord = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('search')
        .setDescription('Search something on the internet')
        .addSubcommand(subcommand =>
            subcommand
                .setName('help')
                .setDescription('Get information about the search category commands')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('bing')
                .setDescription('Find something on Bing')
                .addStringOption(option => option.setName('name').setDescription('Your search name').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('ddg')
                .setDescription('Find something on DuckDuckGo')
                .addStringOption(option => option.setName('name').setDescription('Your search name').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('google')
                .setDescription('Find something on Google')
                .addStringOption(option => option.setName('name').setDescription('Your search name').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('youtube')
                .setDescription('Find something on YouTube')
                .addStringOption(option => option.setName('name').setDescription('Your search name').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('corona')
                .setDescription('See the corona stats')
                .addStringOption(option => option.setName('country').setDescription('Enter a country').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand 
                .setName('crypto')
                .setDescription('See the value of the crypto coin')
                .addStringOption(option => option.setName('coin').setDescription('Enter a coin').setRequired(true))
                .addStringOption(option => option.setName('currency').setDescription('Enter a currency').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('docs')
                .setDescription('See the discord.js docs')
                .addStringOption(option => option.setName('name').setDescription('Your search name').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('github')
                .setDescription('Get info on a github user just by entering their username')
                .addStringOption(option => option.setName('name').setDescription('Enter a github name').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('hexcolour')
                .setDescription('Get info from a color')
                .addStringOption(option => option.setName('color').setDescription('Enter a hex color').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('itunes')
                .setDescription('Search on iTunes for any song')
                .addStringOption(option => option.setName('song').setDescription('Enter a song name').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('npm')
                .setDescription('Get info on an NPM package')
                .addStringOption(option => option.setName('name').setDescription('Enter a package name').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('steam')
                .setDescription('Get info on an application on Steam')
                .addStringOption(option => option.setName('name').setDescription('Enter a Steam application name').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('translate')
                .setDescription('Translate some text')
                .addStringOption(option => option.setName('language').setDescription('Enter a language').setRequired(true))
                .addStringOption(option => option.setName('text').setDescription('Enter some text').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('weather')
                .setDescription('See the current weather')
                .addStringOption(option => option.setName('location').setDescription('Enter a location name').setRequired(true))
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

 