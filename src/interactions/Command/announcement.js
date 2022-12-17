const { CommandInteraction, Client } = require('discord.js');
const { SlashCommandBuilder, ChannelType } = require('discord.js');
const Discord = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('announcement')
        .setDescription('Manage the server announcements')
        .addSubcommand(subcommand =>
            subcommand
                .setName('help')
                .setDescription('Get information about the announcement category commands')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('Make an announcement')
                .addChannelOption(option => option.setName('channel').setDescription('Select a channel').setRequired(true).addChannelTypes(ChannelType.GuildText).addChannelTypes(ChannelType.GuildNews))
                .addStringOption(option => option.setName('message').setDescription('Your announcement message').setRequired(true)),
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('edit')
                .setDescription('Edit an announcement')
                .addStringOption(option => option.setName('id').setDescription('ID of the announcement you want to change').setRequired(true))
                .addStringOption(option => option.setName('message').setDescription('Your announcement message').setRequired(true)),
        )
    ,

    /** 
     * @param {Client} client
     * @param {CommandInteraction} interaction
     * @param {String[]} args
     */

    run: async (client, interaction, args) => {
        await interaction.deferReply({ fetchReply: true });
        const perms = await client.checkUserPerms({
            flags: [Discord.PermissionsBitField.Flags.ManageMessages],
            perms: [Discord.PermissionsBitField.Flags.ManageMessages]
        }, interaction)

        if (perms == false) return;

        client.loadSubcommands(client, interaction, args);
    },
};

 