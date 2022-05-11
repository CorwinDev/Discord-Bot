const { CommandInteraction, Client } = require('discord.js');
const { ContextMenuCommandBuilder } = require('@discordjs/builders');
const Discord = require('discord.js');

const Schema = require("../../database/models/warnings");

module.exports = {
    data: new ContextMenuCommandBuilder()
        .setName('Warn')
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
                data.Warns += 1
                data.save();
            }
            else {
                new Schema({
                    Guild: interaction.guild.id,
                    User: member.id,
                    Warns: 1
                }).save();
            }
        })

        client.embed({
            title: `🔨・Warn`,
            desc: `You've been warned in **${interaction.guild.name}**`,
            fields: [
                {
                    name: "👤┆Moderator",
                    value: interaction.user.tag,
                    inline: true
                },
            ]
        }, member).catch(() => {})

        client.emit('warnAdd', member, interaction.user)
        client.succNormal({
            text: `User has received a warning!`,
            fields: [
                {
                    name: "👤┆User",
                    value: `${member}`,
                    inline: true
                }
            ],
            type: 'editreply'
        }, interaction);
    },
};

 