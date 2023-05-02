const Discord = require('discord.js');
const fetch = require("node-fetch");

module.exports = async (client, interaction, args) => {

    fetch(
        `https://some-random-api.com/facts/cat`
    )
        .then((res) => res.json()).catch({})
        .then(async (json) => {
            client.embed({
                title: `💡・Random cat fact`,
                desc: json.fact,
                type: 'editreply',
            }, interaction);
        }).catch({})
}

 