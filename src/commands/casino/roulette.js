const Discord = require('discord.js');

const Schema = require("../../database/models/economy");

module.exports = async (client, interaction, args) => {
    let user = interaction.user;

    Schema.findOne({ Guild: interaction.guild.id, User: user.id }, async (err, data) => {
        if (data) {
            function isOdd(num) {
                if ((num % 2) == 0) return false;
                else if ((num % 2) == 1) return true;
            }

            let colour = interaction.options.getString('color');
            let money = parseInt(interaction.options.getNumber('amount'));

            let random = Math.floor(Math.random() * 37);

            if (!colour || !money) return client.errUsage({ usage: "roulette [color] [amount]", type: 'editreply' }, interaction);
            colour = colour.toLowerCase()
            if (money > data.Money) return client.errNormal({ error: `You are betting more than you have!`, type: 'editreply' }, interaction);

            if (colour == "b" || colour.includes("black")) colour = 0;
            else if (colour == "r" || colour.includes("red")) colour = 1;
            else if (colour == "g" || colour.includes("green")) colour = 2;
            else return client.errNormal({ error: `No correct color specified!`, type: 'editreply' }, interaction);

            if (random == 0 && colour == 2) { // Green
                money *= 15

                data.Money += money;
                data.save();

                client.embed({ title: `🎰・Multiplier: 15x`, desc: `You won **${client.emotes.economy.coins} $${money}**`, type: 'editreply' }, interaction);
            }

            else if (isOdd(random) && colour == 1) { // Red
                money = parseInt(money * 1.5)
                data.Money += money;
                data.save();

                client.embed({ title: `🎰・Multiplier: 1.5x`, desc: `You won **${client.emotes.economy.coins} $${money}**`, type: 'editreply' }, interaction);
            }

            else if (!isOdd(random) && colour == 0) { // Black
                money = parseInt(money * 2)
                data.Money += money;
                data.save();

                client.embed({ title: `🎰・Multiplier: 2x`, desc: `You won **${client.emotes.economy.coins} $${money}**`, type: 'editreply' }, interaction);
            }

            else { // Wrong
                data.Money -= money;
                data.save();

                client.embed({ title: `🎰・Multiplier: 0x`, desc: `You lost **${client.emotes.economy.coins} $${money}**`, type: 'editreply' }, interaction);
            }

        }
        else {
            client.errNormal({ error: `You has no ${client.emotes.economy.coins}!`, type: 'editreply' }, interaction);
        }
    })
}