const { CommandInteraction, Client } = require('discord.js');
const { SlashCommandBuilder } = require('discord.js');
const { ChannelType } = require('discord.js');
const Discord = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reactionroles')
        .setDescription('Manage the server reaction roles')
        .addSubcommand(subcommand =>
            subcommand
                .setName('help')
                .setDescription('Get information about the reaction roles category commands')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add a reaction role')
                .addStringOption(option => option.setName('category').setDescription('category name for your reaction roles group').setRequired(true))
                .addRoleOption(option => option.setName('role').setDescription('Select a role').setRequired(true))
                .addStringOption(option => option.setName('emoji').setDescription('Enter a emoji').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('delete')
                .setDescription('Delete a reaction roles category')
                .addStringOption(option => option.setName('category').setDescription('category name for your reaction roles group').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('Show all reaction roles categories from this guild')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('button')
                .setDescription('Show all reaction roles with buttons')
                .addStringOption(option => option.setName('category').setDescription('Category name for your reaction roles group').setRequired(true))
                .addChannelOption(option => option.setName('channel').setDescription('Channel where the reaction roles should come').addChannelTypes(ChannelType.GuildText))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('menu')
                .setDescription('Show all reaction roles in a menu')
                .addStringOption(option => option.setName('category').setDescription('Category name for your reaction roles group').setRequired(true))
                .addChannelOption(option => option.setName('channel').setDescription('Channel where the reaction roles should come').addChannelTypes(ChannelType.GuildText))
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
            flags: [Discord.PermissionsBitField.Flags.ManageRoles],
            perms: [Discord.PermissionsBitField.Flags.ManageRoles]
        }, interaction)

        if (perms == false) return;

        client.loadSubcommands(client, interaction, args);
    },
};

 