const Discord = require('discord.js');
const { truncate } = require('fs/promises');
const { decode } = require('html-entities');
const fetch = require("node-fetch");

module.exports = async (client, interaction, args) => {
    const getRandomString = (length) => {
        const randomChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += randomChars.charAt(
                Math.floor(Math.random() * randomChars.length),
            );
        }
        return result;
    };

    const id1 =
        getRandomString(20) +
        '-' +
        getRandomString(20) +
        '-' +
        getRandomString(20) +
        '-' +
        getRandomString(20);
    const id2 =
        getRandomString(20) +
        '-' +
        getRandomString(20) +
        '-' +
        getRandomString(20) +
        '-' +
        getRandomString(20);

    fetch('https://api2.willyoupressthebutton.com/api/v2/dilemma ', {
        method: 'POST',
    }).then((data) => data.json()).then((data) => {
        const res = {
            questions: [data.dilemma.txt1, data.dilemma.txt2],
            percentage: {
                1: data.dilemma.yes,
                2: data.dilemma.no,
            },
        };

        let btn = new Discord.ButtonBuilder()
            .setStyle(Discord.ButtonStyle.Success)
            .setLabel("Yes")
            .setCustomId(id1);
        let btn2 = new Discord.ButtonBuilder()
            .setStyle(Discord.ButtonStyle.Danger)
            .setLabel("No")
            .setCustomId(id2);

        let row = new Discord.ActionRowBuilder()
            .addComponents(btn, btn2);

        client.embed({
            title: `🤔・Will you press the button?`,
            desc: `\`\`\`${decode(res.questions[0].charAt(0).toUpperCase() + res.questions[0].slice(1))} \`\`\`\n**But** \`\`\`\n\n${decode(res.questions[1].charAt(0).toUpperCase() + res.questions[1].slice(1))}\`\`\``,
            components: [row],
            type: 'editreply'
        }, interaction).then(async (m) => {
            const collector = interaction.channel.createMessageComponentCollector({ componentType: Discord.ComponentType.Button });

            collector.on('collect', (btn) => {
                if (btn.user.id !== interaction.user.id) return;

                btn.deferUpdate();
                if (btn.customId === id1) {
                    btn = new Discord.ButtonBuilder()
                        .setStyle(Discord.ButtonStyle.Success)
                        .setLabel(`Yes (${res.percentage['1']})`)
                        .setCustomId(id1)
                        .setDisabled(true);
                    btn2 = new Discord.ButtonBuilder()
                        .setStyle(Discord.ButtonStyle.Danger)
                        .setLabel(`No (${res.percentage['2']})`)
                        .setCustomId(id2)
                        .setDisabled(true);
                    collector.stop();

                    client.embed({
                        title: `🤔・Will you press the button?`,
                        desc: `\`\`\`${decode(res.questions[0].charAt(0).toUpperCase() + res.questions[0].slice(1))} \`\`\`\n**But** \`\`\`\n\n${decode(res.questions[1].charAt(0).toUpperCase() + res.questions[1].slice(1))}\`\`\``,
                        components: [{ type: 1, components: [btn, btn2] }],
                        type: 'editreply'
                    }, interaction)
                } else if (btn.customId === id2) {
                    btn = new Discord.ButtonBuilder()
                        .setStyle(Discord.ButtonStyle.Danger)
                        .setLabel(`Yes (${res.percentage['1']})`)
                        .setCustomId(id1)
                        .setDisabled(true);
                    btn2 = new Discord.ButtonBuilder()
                        .setStyle(Discord.ButtonStyle.Success)
                        .setLabel(`No (${res.percentage['2']})`)
                        .setCustomId(id2)
                        .setDisabled(true);
                    collector.stop();

                    client.embed({
                        title: `🤔・Will you press the button?`,
                        desc: `\`\`\`${decode(res.questions[0].charAt(0).toUpperCase() + res.questions[0].slice(1))} \`\`\`\n**But** \`\`\`\n\n${decode(res.questions[1].charAt(0).toUpperCase() + res.questions[1].slice(1))}\`\`\``,
                        components: [{ type: 1, components: [btn, btn2] }],
                        type: 'editreply'
                    }, interaction)
                }
            });
        });
    });
}

 