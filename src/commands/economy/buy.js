const Discord = require('discord.js');

const Schema = require("../../database/models/economy");
const store = require("../../database/models/economyStore");

module.exports = async (client, interaction, args) => {
    const storeData = await store.find({ Guild: interaction.guild.id });
    if (storeData.length == 0) return client.errNormal({
        error: `No shop found in this server`,
        type: 'editreply'
    }, interaction);

    let labels = [];

    storeData.forEach(d => {
        const role = interaction.guild.roles.cache.get(d.Role);

        const generated = {
            label: `${role.name.substr(0, 24)}.`,
            value: role.id,
        }

        return labels.push(generated);
    });

    const select = await client.generateSelect(`economyBuy`, labels);

    client.embed({
        title: `🛒・${interaction.guild.name}'s Store`,
        desc: `Choose a item from the menu to buy`,
        components: [select],
        type: 'editreply'
    }, interaction)

    const filter = i => {
        i.deferUpdate();
        return i.user.id === interaction.user.id;
    };

    interaction.channel.awaitMessageComponent({ filter, componentType: Discord.ComponentType.StringSelect, time: 60000 }).then(async i => {
        const role = i.values[0];
        const buyPerson = i.guild.members.cache.get(i.user.id);

        const data = await Schema.findOne({ Guild: i.guild.id, User: i.user.id });
        const checkStore = await store.findOne({ Guild: i.guild.id, Role: role });

        if (parseInt(checkStore.Amount) > parseInt(data.Money)) return client.errNormal({
            error: `You don't have enough money to buy this!`,
            type: 'editreply'
        }, i);

        client.removeMoney(i, i.user, parseInt(checkStore.Amount));
        try {
            await buyPerson.roles.add(role);
        } catch (e) {
            return client.errNormal({
                error: `I can't add <@&${role}> to you!`,
                type: 'editreply'
            }, i);
        }

        client.succNormal({
            text: `The purchase has been successfully completed`,
            fields: [
                {
                    name: `📘┆Item`,
                    value: `<@&${role}>`
                }
            ],
            type: 'editreply'
        }, i);
    })
}

