const Discord = require('discord.js');

const Counting = require("../../database/models/countChannel");
const GTN = require("../../database/models/guessNumber");
const GTW = require("../../database/models/guessWord");
const WordSnake = require("../../database/models/wordsnake");

module.exports = async (client, interaction, args) => {
    const choice = interaction.options.getString('setup');

    if (choice == "counting") {
        interaction.guild.channels.create("compteur", {
            type: "GUILD_TEXT"
        }).then((ch) => {
            client.embed({
                title: '<:uo_Christmas:1015567779602108438>・Compteur',
                desc: 'C'est le début du Compteur! Le premier chiffre est **1**'
            }, ch)

            client.createChannelSetup(Counting, ch, interaction)
        })
    }

    if (choice == "gtn") {
        interaction.guild.channels.create("devine-le-nombre", {
            type: "GUILD_TEXT"
        }).then((ch) => {
            client.embed({ 
                title: '<:uo_Christmas:1015567779602108438>・Devine le nombre',
                desc: 'Devine le nombre entre **1** et **10.000**!'
            }, ch)

            client.createChannelSetup(GTN, ch, interaction)
        })
    }

    if (choice == "gtw") {
        interaction.guild.channels.create("devine-le-mot", {
            type: "GUILD_TEXT"
        }).then((ch) => {
            var word = "frite";
            var shuffled = word.split('').sort(function () { return 0.5 - Math.random() }).join('');

            client.embed({ 
                title: '<:uo_BotEvent:1015565719330627584>・Devine le mot',
                desc: 'Mets les lettres aux bons endroits !',
                fields: [
                    {
                        name: '<:uo_Christmas:1015567779602108438> ┆ Mot',
                        value: '${shuffled.toLowerCase()}'
                    }
                ],
            }, ch)
            
            client.createChannelSetup(GTW, ch, interaction)
        })
    }

    if (choice == "wordsnake") {
        interaction.guild.channels.create("serpent-de-mots", {
            type: "GUILD_TEXT"
        }).then((ch) => {
            client.createChannelSetup(WordSnake, ch, interaction)
        })
    }
}

 
