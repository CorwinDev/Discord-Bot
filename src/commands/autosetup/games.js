const Discord = require('discord.js');

const Counting = require("../../database/models/countChannel");
const GTN = require("../../database/models/guessNumber");
const GTW = require("../../database/models/guessWord");
const WordSnake = require("../../database/models/wordsnake");

module.exports = async (client, interaction, args) => {
    const choice = interaction.options.getString('setup');

    if (choice == "counting") {
        interaction.guild.channels.create("counting", {
            type: "GUILD_TEXT"
        }).then((ch) => {
            client.embed({
                title: `<:uo_Christmas:1015567779602108438>・Counting`,
                desc: `This is the start of counting! The first number is **1**`
            }, ch)

            client.createChannelSetup(Counting, ch, interaction)
        })
    }

    if (choice == "gtn") {
        interaction.guild.channels.create("guess-the-number", {
            type: "GUILD_TEXT"
        }).then((ch) => {
            client.embed({ 
                title: `<:uo_Christmas:1015567779602108438>・Guess the number`,
                desc: `Guess the number between **1** and **10.000**!`
            }, ch)

            client.createChannelSetup(GTN, ch, interaction)
        })
    }

    if (choice == "gtw") {
        interaction.guild.channels.create("guess-the-word", {
            type: "GUILD_TEXT"
        }).then((ch) => {
            var word = "start";
            var shuffled = word.split('').sort(function () { return 0.5 - Math.random() }).join('');

            client.embed({ 
                title: `<:uo_BotEvent:1015565719330627584>・Guess the word`,
                desc: `Put the letters in the right position!`,
                fields: [
                    {
                        name: `<:uo_Christmas:1015567779602108438> ┆ Word`,
                        value: `${shuffled.toLowerCase()}`
                    }
                ],
            }, ch)
            
            client.createChannelSetup(GTW, ch, interaction)
        })
    }

    if (choice == "wordsnake") {
        interaction.guild.channels.create("word-snake", {
            type: "GUILD_TEXT"
        }).then((ch) => {
            client.createChannelSetup(WordSnake, ch, interaction)
        })
    }
}

 