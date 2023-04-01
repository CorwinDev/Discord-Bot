const { CommandInteraction, Client } = require('discord.js');
const { SlashCommandBuilder } = require('discord.js');
const Discord = require('discord.js');

const Schema = require("../../database/models/music");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('custom-commands')
        .setDescription('Create some custom commands')
        .addSubcommand(subcommand =>
            subcommand
                .setName('help')
                .setDescription('Get information about the custom commands category'),
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Create a custom command')
                .addStringOption(option => option.setName('command').setDescription('The name of the command').setRequired(true))
                .addStringOption(option => option.setName('text').setDescription('The response of the command').setRequired(true)),
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('delete')
                .setDescription('Delete a custom command')
                .addStringOption(option => option.setName('command').setDescription('The name of the command').setRequired(true)),
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

 