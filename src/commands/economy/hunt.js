const Discord = require('discord.js');
const ms = require("ms");

const Schema = require("../../database/models/economy");
const Schema2 = require("../../database/models/economyTimeout");
const itemSchema = require("../../database/models/economyItems");

module.exports = async (client, interaction, args) => {

    const rand = (min, max) => {
        return Math.floor(Math.random() * (max - min)) + min;
    };

    let user = interaction.user;

    let timeout = 60000;
    let hunt =
        ["Rabbit :rabbit:",
            "Frog :frog:",
            "Monkey :monkey:",
            "Chicken :chicken:",
            "Wolf :wolf:",
            "Rooster :rooster:",
            "Turkey :turkey:",
            "Chipmunk :chipmunk:",
            "Water Buffalo :water_buffalo:",
            "Race Horse :racehorse:",
            "Pig :pig:",
            "Snake :snake:",
            "Cow :cow:"];

    let randn = rand(0, parseInt(hunt.length));
    let randrod = rand(15, 30);

    let huntToWin = hunt[randn];

    Schema2.findOne({ Guild: interaction.guild.id, User: user.id }, async (err, dataTime) => {
        if (dataTime && dataTime.Hunt !== null && timeout - (Date.now() - dataTime.Hunt) > 0) {
            let time = (dataTime.Hunt / 1000 + timeout / 1000).toFixed(0);

            return client.errWait({ time: time, type: 'editreply' }, interaction);
        }
        else {
            client.succNormal({ text: `You've hunted and gotten a ${huntToWin}`, type: 'editreply' }, interaction);

            if (dataTime) {
                dataTime.Hunt = Date.now();
                dataTime.save();
            }
            else {
                new Schema2({
                    Guild: interaction.guild.id,
                    User: user.id,
                    Hunt: Date.now()
                }).save();
            }
        }
    })

}

 