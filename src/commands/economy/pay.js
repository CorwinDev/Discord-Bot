const Discord = require('discord.js');

const Schema = require("../../database/models/economy");

module.exports = async (client, interaction, args) => {

    const user = await interaction.guild.members.fetch(interaction.options.getUser('user'));
    let amount = interaction.options.getNumber('amount');
    
    if (amount < 0) return client.errNormal({ error: `You can't pay negative money!`, type: 'editreply' }, interaction);

    if (user.id == interaction.user.id) {
        return client.errNormal({
            error: "You cannot pay money to yourself!",
            type: 'editreply'
        }, interaction)
    }

    Schema.findOne({ Guild: interaction.guild.id, User: interaction.user.id }, async (err, data) => {
        if (data) {
            if (data.Money < parseInt(amount)) return client.errNormal({ error: `You don't have that much money!`, type: 'editreply' }, interaction);

            let money = parseInt(amount);

            data.Money -= money;
            data.save();

            client.addMoney(interaction, user, money);

            client.succNormal({
                text: `You have payed some money to a user!`,
                fields: [
                    {
                        name: `👤┆User`,
                        value: `$${user}`,
                        inline: true
                    },
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
            client.errNormal({ text: `You don't have any money!`, type: 'editreply' }, interaction);
        }
    })
}

 