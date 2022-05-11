const { CommandInteraction, Client } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { ChannelType } = require('discord-api-types/v9');
const Discord = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('automod')
        .setDescription('Manage the auto mod')
        .addSubcommand(subcommand =>
            subcommand
                .setName('help')
                .setDescription('Get information about the auto setup commands')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('antiinvite')
                .setDescription('Enable/disable antiinvite')
                .addBooleanOption(option => option.setName('active').setDescription('Select a boolean').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('antilinks')
                .setDescription('Enable/disable antilinks')
                .addBooleanOption(option => option.setName('active').setDescription('Select a boolean').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('antispam')
                .setDescription('Enable/disable antispam')
                .addBooleanOption(option => option.setName('active').setDescription('Select a boolean').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('linkschannel')
                .setDescription('Add a channel that is allowed to send links')
                .addStringOption(option =>
                    option.setName('type')
                        .setDescription('What do you want to do with the channel?')
                        .setRequired(true)
                        .addChoice('Add', 'add')
                        .addChoice('Remove', 'remove')
                )
                .addChannelOption(option => option.setName('channel').setDescription('Select a channel').setRequired(true).addChannelType(ChannelType.GuildText))
        )
        .addSubcommandGroup(group =>
            group
                .setName('blacklist')
                .setDescription('Manage the blacklist')
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('display')
                        .setDescription('Show the whole blacklist')
                )
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('add')
                        .setDescription('Add a word to the blacklist')
                        .addStringOption(option => option.setName('word').setDescription('The word for the blacklist').setRequired(true))
                )
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('remove')
                        .setDescription('Remove a word from the blacklist')
                        .addStringOption(option => option.setName('word').setDescription('The word for the blacklist').setRequired(true))
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
            flags: [Discord.Permissions.FLAGS.MANAGE_MESSAGES],
            perms: ["MANAGE_MESSAGES"]
        }, interaction)

        if (perms == false) return;

        client.loadSubcommands(client, interaction, args);
    },
};

 