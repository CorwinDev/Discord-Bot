const { CommandInteraction, Client } = require('discord.js');
const { SlashCommandBuilder } = require('discord.js');
const Discord = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('music')
        .setDescription('Playing music in Bot')
        .addSubcommand(subcommand =>
            subcommand
                .setName('help')
                .setDescription('Get information about the music category commands')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('bassboost')
                .setDescription('Set the bassboost level')
                .addStringOption(option =>
                    option.setName('level')
                        .setDescription('The level of the bassboost')
                        .setRequired(true)
                        .addChoices(
                            { name: '0', value: '0' },
                            { name: '1', value: '1' },
                            { name: '2', value: '2' },
                            { name: '3', value: '3' }
                        )
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('play')
                .setDescription('Start the music')
                .addStringOption(option => option.setName('song').setDescription('Enter a song name/url').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('clear')
                .setDescription('Delete the music queue')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('loop')
                .setDescription('Loop the music')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('lyrics')
                .setDescription('Get the lyrics of the current song')
                .addStringOption(option => option.setName('song').setDescription('Enter a song name'))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('playing')
                .setDescription('See which song is playing now')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('pause')
                .setDescription('Pause the music')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('previous')
                .setDescription('Play previous song')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('queue')
                .setDescription('See the music queue')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('resume')
                .setDescription('Resume the music')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove a song from the queue')
                .addNumberOption(option => option.setName('number').setDescription('Song number').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('seek')
                .setDescription('Seek the current playing music')
                .addNumberOption(option => option.setName('time').setDescription('New song time').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('shuffle')
                .setDescription('Shuffle the music')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('skip')
                .setDescription('Skip the current song')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('skipto')
                .setDescription('Skip to a new song')
                .addNumberOption(option => option.setName('number').setDescription('Song number').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('stop')
                .setDescription('Stop the music')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('volume')
                .setDescription('Set the music volume')
                .addNumberOption(option => option.setName('amount').setDescription('New volume number'))
        ),

    /** 
     * @param {Client} client
     * @param {CommandInteraction} interaction
     * @param {String[]} args
     */

    run: async (client, interaction, args) => {
        await interaction.deferReply({ fetchReply: true });
        client.checkBotPerms({
            flags: [Discord.PermissionsBitField.Flags.Connect, Discord.PermissionsBitField.Flags.Speak],
            perms: [Discord.PermissionsBitField.Flags.Connect, Discord.PermissionsBitField.Flags.Speak]
        }, interaction)

        client.loadSubcommands(client, interaction, args);
    },
};


 