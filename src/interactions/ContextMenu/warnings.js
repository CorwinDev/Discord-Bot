const { CommandInteraction, Client } = require('discord.js');
const { ContextMenuCommandBuilder } = require('@discordjs/builders');
const Discord = require('discord.js');

const Schema = require("../../database/models/warnings");

module.exports = {
    data: new ContextMenuCommandBuilder()
        .setName('Warnings')
        .setType(2),

    /** 
     * @param {Client} client
     * @param {CommandInteraction} interaction
     * @param {String[]} args
     */

    run: async (client, interaction, args) => {
        const perms = await client.checkPerms({
            flags: [Discord.Permissions.FLAGS.MANAGE_MESSAGES],
            perms: ["MANAGE_MESSAGES"]
        }, interaction)

        if (perms == false) return;

        const member = interaction.guild.members.cache.get(interaction.targetId);

        Schema.findOne({ Guild: interaction.guild.id, User: member.id }, async (err, data) => {
            if (data) {
                client.embed({
                    title: `${client.emotes.normal.error}・Warnings`,
                    desc: `The warnings of **${member.tag}**`,
                    fields: [
                        {
                            name: "Total",
                            value: `${data.Warns}`,
                            innline: false
                        }
                    ],
                    type: 'editreply'
                }, interaction)
            }
            else {
                client.embed({
                    title: `${client.emotes.normal.error}・Warnings`,
                    desc: `The warnings of **${member.tag}**`,
                    fields: [
                        {
                            name: "Total",
                            value: "0",
                            innline: false
                        }
                    ],
                    type: 'editreply'
                }, interaction)
            }
        })
    },
};

 