const { CommandInteraction, Client } = require('discord.js');
const { SlashCommandBuilder } = require('discord.js');
const Discord = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tools')
        .setDescription('Use some cool tools')
        .addSubcommand(subcommand =>
            subcommand
                .setName('help')
                .setDescription('Get information about the tools category commands')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('anagram')
                .setDescription('Form a word with certain letters')
                .addStringOption(option => option.setName('word').setDescription('The word you want to form').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('button')
                .setDescription('Create a button')
                .addStringOption(option => option.setName('url').setDescription('The url for the button').setRequired(true))
                .addStringOption(option => option.setName('text').setDescription('The text for the button').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('calculator')
                .setDescription('Calculate a sum')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('decode')
                .setDescription('Decode binary code to text')
                .addStringOption(option => option.setName('code').setDescription('The binary code you want to decode').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('emojify')
                .setDescription('Convert text to emojis')
                .addStringOption(option => option.setName('text').setDescription('The text you want to convert').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('encode')
                .setDescription('Encode text to binary code')
                .addStringOption(option => option.setName('text').setDescription('The text you want to encode').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('enlarge')
                .setDescription('Enlarge an emoji')
                .addStringOption(option => option.setName('emoji').setDescription('The emoji you want to enlarge').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('mcskin')
                .setDescription('See the skin of a minecraft user')
                .addStringOption(option => option.setName('name').setDescription('The username of the player').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('mcstatus')
                .setDescription('See the status of a minecraft server')
                .addStringOption(option => option.setName('ip').setDescription('The ip of the mc server').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('pwdgen')
                .setDescription('Generate a password')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('qrcode')
                .setDescription('Sends a qrcode photo of text you have given')
                .addStringOption(option => option.setName('text').setDescription('The text you want to convert').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('remind')
                .setDescription('Set a reminder')
                .addStringOption(option => option.setName('time').setDescription('The time for your reminder').setRequired(true))
                .addStringOption(option => option.setName('message').setDescription('The message for your reminder').setRequired(true))

        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('sourcebin')
                .setDescription('Upload code to source bin')
                .addStringOption(option => option.setName('language').setDescription('The language of your code').setRequired(true))
                .addStringOption(option => option.setName('code').setDescription('Your code').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('url')
                .setDescription('Make a shortend url')
                .addStringOption(option => option.setName('site').setDescription('The link to the website').setRequired(true))
                .addStringOption(option => option.setName('code').setDescription('The code for the url').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('review')
                .setDescription('Write a review')
                .addNumberOption(option => option.setName('stars').setDescription('The number of stars (max 5)').setRequired(true))
                .addStringOption(option => option.setName('message').setDescription('A small description with the review'))
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

 