const Discord = require('discord.js');

const Schema = require("../../database/models/messages");

module.exports = async (client, interaction, args) => {
    let user = interaction.options.getUser('user');
    let amount = interaction.options.getNumber('amount');

    const perms = await client.checkUserPerms({
        flags: [Discord.Permissions.FLAGS.MANAGE_MESSAGES],
        perms: ["MANAGE_MESSAGES"]
    }, interaction)

    if (perms == false) return;

    const data = await Schema.findOne({ Guild: interaction.guild.id, User: user.id });
    if (data) {
        data.Messages -= amount;
        await data.save();
    }
    else {
        return client.errNormal({
            error: `No message data found for ${user}`,
            type: 'editreply'
        }, interaction);
    }

    client.succNormal({
        text: `Removed **${amount}** messages from ${user}`,
        fields: [
            {
                name: "💬┆Total messages",
                value: `${data.Messages}`,
                inline: true,
            }
        ],
        type: 'editreply'
    }, interaction);
}

 