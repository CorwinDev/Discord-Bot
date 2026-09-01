const Discord = require("discord.js");
const { decode } = require("html-entities");
const axios = require("axios");

let pageOffset = 0;

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
    const getRandomString = (length) => {
        const randomChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let result = "";
        for (let i = 0; i < length; i++) {
            result += randomChars.charAt(
                Math.floor(Math.random() * randomChars.length),
            );
        }
        return result;
    };

    client
        .simpleEmbed(
            {
                title: `${client.emotes.animated.loading}┆Loading...`,
                type: "editreply",
            },
            interaction,
        )
        .then(async (msg) => {
            const id1 =
                getRandomString(20) +
                "-" +
                getRandomString(20) +
                "-" +
                getRandomString(20) +
                "-" +
                getRandomString(20);
            const id2 =
                getRandomString(20) +
                "-" +
                getRandomString(20) +
                "-" +
                getRandomString(20) +
                "-" +
                getRandomString(20);

            const response = await axios.get(
                `https://io.wyr.app/api/v1/statements/en/daily?pageOffset=${pageOffset}&pageSize=1`,
            );
            const statements = response.data.statements;
            const statement = statements[0];
            pageOffset =
                (pageOffset + 1) % (response.data.pageCount || pageOffset + 2);
            const totalVotes = statement.phrase.reduce(
                (total, option) => total + option.count,
                0,
            );

            const res = {
                questions: statement.phrase.map((option) => option.text),
                percentage: statement.phrase.map(
                    (option) =>
                        `${Math.round((option.count / totalVotes) * 100)}%`,
                ),
            };

            let btn = new Discord.ButtonBuilder()
                .setStyle(Discord.ButtonStyle.Primary)
                .setLabel("Option A")
                .setCustomId(id1);
            let btn2 = new Discord.ButtonBuilder()
                .setStyle(Discord.ButtonStyle.Primary)
                .setLabel("Option B")
                .setCustomId(id2);

            let row = new Discord.ActionRowBuilder().addComponents(btn, btn2);

            client
                .embed(
                    {
                        title: `🤔・Would you rather...`,
                        desc: `**A)** ${decode(res.questions[0])} \n**B)** ${decode(res.questions[1])}`,
                        components: [row],
                        type: "editreply",
                    },
                    interaction,
                )
                .then(async (m) => {
                    const collector =
                        interaction.channel.createMessageComponentCollector({
                            componentType: Discord.ComponentType.Button,
                        });

                    collector.on("collect", (btn) => {
                        if (btn.user.id !== interaction.user.id) return;

                        btn.deferUpdate();
                        if (btn.customId === id1) {
                            btn = new Discord.ButtonBuilder()
                                .setStyle(Discord.ButtonStyle.Primary)
                                .setLabel(`Option A (${res.percentage[0]})`)
                                .setCustomId(id1)
                                .setDisabled(true);
                            btn2 = new Discord.ButtonBuilder()
                                .setStyle(Discord.ButtonStyle.Secondary)
                                .setLabel(`Option B (${res.percentage[1]})`)
                                .setCustomId(id2)
                                .setDisabled(true);
                            collector.stop();

                            client.embed(
                                {
                                    title: `🤔・Would you rather...`,
                                    desc: `**A) ${decode(res.questions[0])} (${res.percentage[0]})** \nB) ${decode(res.questions[1])} (${res.percentage[1]})`,
                                    components: [
                                        { type: 1, components: [btn, btn2] },
                                    ],
                                    type: "editreply",
                                },
                                interaction,
                            );
                        } else if (btn.customId === id2) {
                            btn = new Discord.ButtonBuilder()
                                .setStyle(Discord.ButtonStyle.Secondary)
                                .setLabel(`Option A (${res.percentage[0]})`)
                                .setCustomId(id1)
                                .setDisabled(true);
                            btn2 = new Discord.ButtonBuilder()
                                .setStyle(Discord.ButtonStyle.Primary)
                                .setLabel(`Option B (${res.percentage[1]})`)
                                .setCustomId(id2)
                                .setDisabled(true);
                            collector.stop();

                            client.embed(
                                {
                                    title: `🤔・Would you rather...`,
                                    desc: `A) ${decode(res.questions[0])} (${res.percentage[0]}) \n**B) ${decode(res.questions[1])} (${res.percentage[1]})**`,
                                    components: [
                                        { type: 1, components: [btn, btn2] },
                                    ],
                                    type: "editreply",
                                },
                                interaction,
                            );
                        }
                    });
                });
        });
};
