const Discord = require('discord.js');

const Schema = require("../../database/models/warnings");

module.exports = async (client, interaction, args) => {
    const perms = await client.checkUserPerms({
        flags: [Discord.PermissionsBitField.Flags.ManageMessages],
        perms: [Discord.PermissionsBitField.Flags.ManageMessages]
    }, interaction);

    if (perms == false) return;

    var member = interaction.options.getUser('user');
    var Case = interaction.options.getInteger('case');

    Schema.findOne({ Guild: interaction.guild.id, User: member.id }, async (err, data) => {
        if (data) {
            var warn = data.Warnings.find(x => x.Case == Case);
            if (!warn) {
                client.errNormal({
                    error: "This user doesn't have a warning with this case number!",
                    type: 'editreply'
                }, interaction);
                return;
            }
            data.Warnings.splice(data.Warnings.indexOf(warn), 1);
            data.save();
        }
        else {
            client.errNormal({ 
                error: "User has no warnings!", 
                type: 'editreply'
            }, interaction);
        }
    })

    client.embed({
        title: `🔨・Unwarn`,
        desc: `You've been unwarned in **${interaction.guild.name}**`,
        fields: [
            {
                name: "👤┆Moderator",
                value: interaction.user.tag,
                inline: true
            },
        ]
    }, member).catch(() => {})

    client.emit('warnRemove', member, interaction.user)
    client.succNormal({
        text: `The user's warning has been successfully removed`,
        fields: [
            {
                name: "👤┆User",
                value: `${member}`,
                inline: true
            }
        ],
        type: 'editreply'
    }, interaction);
}

 