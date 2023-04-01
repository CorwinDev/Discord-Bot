const { CommandInteraction, Client } = require('discord.js');
const { SlashCommandBuilder } = require('discord.js');
const Discord = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('serverstats')
        .setDescription('Manage the server stats')
        .addSubcommand(subcommand =>
            subcommand
                .setName('help')
                .setDescription('Get information about the server stats category commands')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('boosts')
                .setDescription('Keep track of the boost count')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('tier')
                .setDescription('Keep track of the boost tier count')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('channels')
                .setDescription('Keep track of the channel count')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('stage-channels')
                .setDescription('Keep track of the stage channel count')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('text-channels')
                .setDescription('Keep track of the text channel count')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('voice-channels')
                .setDescription('Keep track of the voice channel count')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('news-channels')
                .setDescription('Keep track of the news channel count')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('members')
                .setDescription('Keep track of the member count')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('bots')
                .setDescription('Keep track of the bots count')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('roles')
                .setDescription('Keep track of the role count')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('emoji')
                .setDescription('Keep track of the emoji\'s count')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('static-emoji')
                .setDescription('Keep track of the static emoji\'s count')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('animated-emoji')
                .setDescription('Keep track of the animated emoji\'s count')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('time')
                .setDescription('Keep track of your current time zone')
                .addStringOption(option =>
                    option.setName('timezone')
                        .setDescription('The timezone you want to set (e.g. Europe/Amsterdam)')
                        .setRequired(true)
                )
        )
    ,

    /** 
     * @param {Client} client
     * @param {CommandInteraction} interaction
     * @param {String[]} args
     */

    run: async (client, interaction, args) => {
        await interaction.deferReply({ fetchReply: true });
        const perms = await client.checkPerms({
            flags: [Discord.PermissionsBitField.Flags.ManageChannels],
            perms: [Discord.PermissionsBitField.Flags.ManageChannels]
        }, interaction)

        if (perms == false) return;

        client.loadSubcommands(client, interaction, args);
    },
};

 