const Discord = require('discord.js');

module.exports = async (client, interaction, args) => {
    const perms = await client.checkPerms({
        flags: [Discord.PermissionsBitField.Flags.ManageMessages],
        perms: [Discord.PermissionsBitField.Flags.ManageMessages]
    }, interaction);

    if (perms == false) return;

    const amount = interaction.options.getNumber('amount');

    if (amount > 100) return client.errNormal({
        error: "I cannot delete more than 100 messages at a time!",
        type: 'editreply'
    }, interaction);

    if (amount < 1) return client.errNormal({
        error: "I cannot delete less than 1 message!",
        type: 'editreply'
    }, interaction);

    interaction.channel.bulkDelete(amount + 1).then(() => {
        client.succNormal({
            text: `I have successfully deleted the messages`,
            fields: [
                {
                    name: "💬┆Amount",
                    value: `${amount}`,
                    inline: true
                }
            ],
            type: 'ephemeraledit'
        }, interaction)
    }).catch(err => {
        client.errNormal({
            error: "There was an error trying to delete messages in this channel!",
            type: 'editreply'
        }, interaction);
    });
}

 