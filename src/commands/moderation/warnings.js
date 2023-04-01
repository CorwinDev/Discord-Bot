const Discord = require('discord.js');

const Schema = require("../../database/models/warnings");

module.exports = async (client, interaction, args) => {
    const perms = await client.checkUserPerms({
        flags: [Discord.PermissionsBitField.Flags.ManageMessages],
        perms: [Discord.PermissionsBitField.Flags.ManageMessages]
    }, interaction);

    if (perms == false) return;

    const member = interaction.options.getUser('user');

    Schema.findOne({ Guild: interaction.guild.id, User: member.id }, async (err, data) => {
        if (data) {

            client.embed({
                title: `${client.emotes.normal.error}・Warnings`,
                desc: `The warnings of **${member.tag}**`,
                fields: [
                    {
                        name: "Total",
                        value: `${data.Warns}`,
                        inline: false
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
                        inline: false
                    }
                ],
                type: 'editreply'
            }, interaction)
        }
    })
}

 