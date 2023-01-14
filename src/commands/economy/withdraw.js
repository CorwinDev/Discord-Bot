const Discord = require('discord.js');

const Schema = require("../../database/models/economy");

module.exports = async (client, interaction, args) => {

    let amount = interaction.options.getNumber('amount');
    let user = interaction.user;

    if (!amount) return client.errUsage({ usage: "withdraw [amount]", type: 'editreply' }, interaction);

    if (isNaN(amount)) return client.errNormal({ error: "Enter a valid number!", type: 'editreply' }, interaction);

    if (amount < 0) return client.errNormal({ error: `You can't withdraw negative money!`, type: 'editreply' }, interaction);

    Schema.findOne({ Guild: interaction.guild.id, User: user.id }, async (err, data) => {
        if (data) {
            if (data.Bank === 0) return client.errNormal({ error: `You have nothing left in the bank!`, type: 'editreply' }, interaction);

            let money = parseInt(amount);

            data.Money += money;
            data.Bank -= money;
            data.save();

            client.succNormal({
                text: `You've have withdrawn some money from your bank!`,
                fields: [
                    {
                        name: `${client.emotes.economy.coins}┆Amount`,
                        value: `$${amount}`,
                        inline: true
                    }
                ],
                type: 'editreply'
            }, interaction);
        }
        else {
            client.errNormal({ text: `You don't have any money to withdraw!`, type: 'editreply' }, interaction);
        }
    })
}
 