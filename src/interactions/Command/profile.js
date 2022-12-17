const { CommandInteraction, Client } = require('discord.js');
const { SlashCommandBuilder } = require('discord.js');
const Discord = require('discord.js');
const ms = require('ms');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('profile')
        .setDescription('Create a profile for the server')
        .addSubcommand(subcommand =>
            subcommand
                .setName('help')
                .setDescription('Get information about the profile category commands')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('Create your profile')
        ).addSubcommand(subcommand =>
            subcommand
                .setName('delete')
                .setDescription('Delete your profile')
        ).
        addSubcommand(subcommand =>
            subcommand
                .setName('profile')
                .setDescription('See your profile')
                .addUserOption((option) =>
                    option.setName('user').setDescription('The user you want the profile from').setRequired(false),
                )
        ).
        addSubcommand(subcommand =>
            subcommand
                .setName('aboutme')
                .setDescription('Set your about me')
                .addStringOption(option => option.setName('text').setDescription('Enter a about me').setRequired(true))
        ).
        addSubcommand(subcommand =>
            subcommand
                .setName('age')
                .setDescription('Set your age')
                .addNumberOption(option => option.setName('number').setDescription('Enter a number').setRequired(true))
        ).
        addSubcommand(subcommand =>
            subcommand
                .setName('bday')
                .setDescription('Set your bday')
                .addStringOption(option => option.setName('bday').setDescription('Enter a bday').setRequired(true))
        )

        .addSubcommandGroup((group) =>
            group
                .setName('actor')
                .setDescription('Set your favorite actor')
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('addactor')
                        .setDescription('The actor you want to add')
                        .addStringOption(option => option.setName('actor').setDescription('The actor you want to add').setRequired(true)),
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('delactor')
                        .setDescription("The actor you want te remove")
                        .addStringOption(option => option.setName('actor').setDescription('The actor you want to remove').setRequired(true)),
                )
        ).
        addSubcommandGroup((group) =>
            group
                .setName('artist')
                .setDescription('Set your favorite artist')
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('addartist')
                        .setDescription('The artist you want to add')
                        .addStringOption(option => option.setName('artist').setDescription('The artist you want to add').setRequired(true)),
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('delartist')
                        .setDescription("The artist you want te remove")
                        .addStringOption(option => option.setName('artist').setDescription('The artist you want to remove').setRequired(true)),
                )
        ).
        addSubcommand(subcommand =>
            subcommand
                .setName('color')
                .setDescription('Set your favorite color')
                .addStringOption(option => option.setName('color').setDescription('The color you want to set').setRequired(true)),

        ).addSubcommandGroup((group) =>
            group
                .setName('food')
                .setDescription('Set your favorite food')
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('addfood')
                        .setDescription('The food you want to add')
                        .addStringOption(option => option.setName('food').setDescription('The food you want to add').setRequired(true)),
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('delfood')
                        .setDescription("The food you want te remove")
                        .addStringOption(option => option.setName('food').setDescription('The food you want to remove').setRequired(true)),
                )
        ).addSubcommandGroup((group) =>
            group
                .setName('movie')
                .setDescription('Set your favorite movie')
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('addmovie')
                        .setDescription('The movie you want to add')
                        .addStringOption(option => option.setName('movie').setDescription('The movie you want to add').setRequired(true)),
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('delmovie')
                        .setDescription("The movie you want te remove")
                        .addStringOption(option => option.setName('movie').setDescription('The movie you want to remove').setRequired(true)),
                )
        ).addSubcommandGroup((group) =>
            group
                .setName('pet')
                .setDescription('Set your favorite pet')
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('addpet')
                        .setDescription('The pet you want to add')
                        .addStringOption(option => option.setName('pet').setDescription('The pet you want to add').setRequired(true)),
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('delpet')
                        .setDescription("The pet you want te remove")
                        .addStringOption(option => option.setName('pet').setDescription('The pet you want to remove').setRequired(true)),
                )
        ).addSubcommandGroup((group) =>
            group
                .setName('song')
                .setDescription('Set your favorite song')
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('addsong')
                        .setDescription('The song you want to add')
                        .addStringOption(option => option.setName('song').setDescription('The song you want to add').setRequired(true)),
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('delsong')
                        .setDescription("The song you want te remove")
                        .addStringOption(option => option.setName('song').setDescription('The song you want to remove').setRequired(true)),
                )
        ).
        addSubcommand(subcommand =>
            subcommand
                .setName('gender')
                .setDescription('Set your gender')

        ).addSubcommandGroup((group) =>
            group
                .setName('hobbies')
                .setDescription('Set your favorite hobby')
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('addhobby')
                        .setDescription('The song you want to add')
                        .addStringOption(option => option.setName('hobby').setDescription('The hobby you want to add').setRequired(true)),
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('delhobby')
                        .setDescription("The hobby you want te remove")
                        .addStringOption(option => option.setName('hobby').setDescription('The hobby you want to remove').setRequired(true)),
                )
        ).
        addSubcommand(subcommand =>
            subcommand
                .setName('origin')
                .setDescription('Set your origin')
                .addStringOption(option => option.setName('country').setDescription('Enter a country').setRequired(true))
        ).
        addSubcommand(subcommand =>
            subcommand
                .setName('status')
                .setDescription('Set your status')
                .addStringOption(option => option.setName('text').setDescription('Enter a status').setRequired(true))
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

 