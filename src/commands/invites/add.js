const Discord = require('discord.js');

const Schema = require("../../database/models/invites");

module.exports = async (client, interaction, args) => {
    let user = interaction.options.getUser('user');
    let amount = interaction.options.getNumber('amount');

    const perms = await client.checkUserPerms({
        flags: [Discord.PermissionsBitField.Flags.ManageMessages],
        perms: [Discord.PermissionsBitField.Flags.ManageMessages]
    }, interaction)

    if (perms == false) return;

    const data = await Schema.findOne({ Guild: interaction.guild.id, User: user.id });
    if (data) {
        data.Invites += amount;
        data.Total += amount;
        data.save();
    }
    else {
        new Schema({
            Guild: interaction.guild.id,
            User: user.id,
            Invites: amount,
            Total: amount,
            Left: 0
        }).save();
    }

    client.succNormal({
        text: `Added **${amount}** invites to ${user}`,
        fields: [
            {
                name: "📨┆Total invites",
                value: `${data.Invites}`,
                inline: true,
            }
        ],
        type: 'editreply'
    }, interaction);
}

 