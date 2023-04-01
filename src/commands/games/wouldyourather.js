const Discord = require('discord.js');
const { decode } = require('html-entities');
const axios = require('axios');
const cheerio = require('cheerio');

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

    const fetchhtml = async (url) => {
        const options = {
            header: {
                'user-agent':
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36',
                referer: 'https://www.google.com/',
            },
        };
        const html = await axios.get(url, options);
        return cheerio.load(html.data);
    };

    client.simpleEmbed({ 
        title: `${client.emotes.animated.loading}┆Loading...`,
        type: 'editreply'
    }, interaction).then(async msg => {

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

        const $ = await fetchhtml('http://either.io');

        const blue = $('div.result.result-1').children();
        const red = $('div.result.result-2').children();

        const res = {
            questions: [blue.eq(3).text(), red.eq(3).text()],
            percentage: {
                1: blue.eq(1).text(),
                2: red.eq(1).text(),
            },
        };

        let btn = new Discord.ButtonBuilder()
            .setStyle(Discord.ButtonStyle.Primary)
            .setLabel("Option A")
            .setCustomId(id1);
        let btn2 = new Discord.ButtonBuilder()
            .setStyle(Discord.ButtonStyle.Primary)
            .setLabel("Option B")
            .setCustomId(id2);

        let row = new Discord.ActionRowBuilder()
            .addComponents(btn, btn2);

        client.embed({
            title: `🤔・Would you rather...`,
            desc: `**A)** ${decode(res.questions[0])} \n**B)** ${decode(res.questions[1])}`,
            components: [row],
            type: 'editreply'
        }, interaction).then(async (m) => {
            const collector = interaction.channel.createMessageComponentCollector({ componentType: Discord.ComponentType.Button });

            collector.on('collect', (btn) => {
                if (btn.user.id !== interaction.user.id) return;

                btn.deferUpdate();
                if (btn.customId === id1) {
                    btn = new Discord.ButtonBuilder()
                        .setStyle(Discord.ButtonStyle.Primary)
                        .setLabel(`Option A (${res.percentage['1']})`)
                        .setCustomId(id1)
                        .setDisabled(true);
                    btn2 = new Discord.ButtonBuilder()
                        .setStyle(Discord.ButtonStyle.Secondary)
                        .setLabel(`Option B (${res.percentage['2']})`)
                        .setCustomId(id2)
                        .setDisabled(true);
                    collector.stop();

                    client.embed({
                        title: `🤔・Would you rather...`,
                        desc: `**A) ${decode(res.questions[0])} (${res.percentage['1']})** \nB) ${decode(res.questions[1])} (${res.percentage['2']})`,
                        components: [{ type: 1, components: [btn, btn2] }],
                        type: 'editreply'
                    }, interaction)
                } else if (btn.customId === id2) {
                    btn = new Discord.ButtonBuilder()
                        .setStyle(Discord.ButtonStyle.Secondary)
                        .setLabel(`Option A (${res.percentage['1']})`)
                        .setCustomId(id1)
                        .setDisabled(true);
                    btn2 = new Discord.ButtonBuilder()
                        .setStyle(Discord.ButtonStyle.Primary)
                        .setLabel(`Option B (${res.percentage['2']})`)
                        .setCustomId(id2)
                        .setDisabled(true);
                    collector.stop();

                    client.embed({
                        title: `🤔・Would you rather...`,
                        desc: `A) ${decode(res.questions[0])} (${res.percentage['1']}) \n**B) ${decode(res.questions[1])} (${res.percentage['2']})**`,
                        components: [{ type: 1, components: [btn, btn2] }],
                        type: 'editreply'
                    }, interaction)
                }
            });
        });
    });
}

 