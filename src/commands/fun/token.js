const Discord = require('discord.js');
const fetch = require("node-fetch");

module.exports = async (client, interaction, args) => {

    fetch(
        `https://some-random-api.com/bottoken?id=${interaction.user.id}`
    )
        .then((res) => res.json()).catch({})
        .then(async (json) => {

            client.embed({
                title: `🤖・Bot token`,
                desc: json.token,
                type: 'editreply',
            }, interaction);
        }).catch({})

}

 