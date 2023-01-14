const Discord = require('discord.js');

module.exports = (client) => {
    client.buttonReactions = async function (id, reactions) {
        var labels = [];
        var sendComponents = [];

        reactions.map((emoji) => {
            let btn = new Discord.MessageButton()
                .setStyle('PRIMARY')
                .setEmoji(`${emoji}`)
                .setCustomId(`reaction_button-${emoji}`);
            return labels.push(btn);
        })

        if (labels.length < 5 || labels.length == 5) {
            const row = new Discord.MessageActionRow()

            row.addComponents(labels.slice(0, 5))

            sendComponents = [row];
        }

        if (labels.length < 10 && labels.length > 5 || labels.length == 10) {
            const row = new Discord.MessageActionRow()
            const row2 = new Discord.MessageActionRow()

            row.addComponents(labels.slice(0, 5))
            row2.addComponents(labels.slice(5, 10))

            sendComponents = [row, row2];
        }

        if (labels.length < 15 && labels.length > 10 || labels.length == 15) {
            const row = new Discord.MessageActionRow()
            const row2 = new Discord.MessageActionRow()
            const row3 = new Discord.MessageActionRow()

            row.addComponents(labels.slice(0, 5))
            row2.addComponents(labels.slice(5, 10))
            row3.addComponents(labels.slice(10, 15))

            sendComponents = [row, row2, row3];
        }

        if (labels.length < 20 && labels.length > 15 || labels.length == 20) {
            const row = new Discord.MessageActionRow()
            const row2 = new Discord.MessageActionRow()
            const row3 = new Discord.MessageActionRow()
            const row4 = new Discord.MessageActionRow()

            row.addComponents(labels.slice(0, 5))
            row2.addComponents(labels.slice(5, 10))
            row3.addComponents(labels.slice(10, 15))
            row4.addComponents(labels.slice(15, 20))

            sendComponents = [row, row2, row3, row4];
        }

        if (labels.length < 25 && labels.length > 20 || labels.length == 25) {
            const row = new Discord.MessageActionRow()
            const row2 = new Discord.MessageActionRow()
            const row3 = new Discord.MessageActionRow()
            const row4 = new Discord.MessageActionRow()
            const row5 = new Discord.MessageActionRow()

            row.addComponents(labels.slice(0, 5))
            row2.addComponents(labels.slice(5, 10))
            row3.addComponents(labels.slice(10, 15))
            row4.addComponents(labels.slice(15, 20))
            row5.addComponents(labels.slice(20, 25))

            sendComponents = [row, row2, row3, row4, row5];
        }

        return await sendComponents;
    }
}