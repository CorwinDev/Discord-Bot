const Discord = require('discord.js');
const moment = require("moment");
require("moment-duration-format");

module.exports = async (client, interaction, args) => {
    const duration = moment.duration(client.uptime).format("\`D\` [j], \`H\` [h], \`m\` [m], \`s\` [s]");
    const upvalue = (Date.now() / 1000 - client.uptime / 1000).toFixed(0);

    client.embed({
        title: `${client.emotes.normal.arrowUp}・Uptime`,
        desc: `Voir le uptime du Bot`,
        fields: [
            {
                name: "<:uo_clock:1015551740281622538> ┇ Uptime",
                value: `${duration}`,
                inline: true
            },
            {
                name: "<:uo_clock:1015551740281622538> ┇ Up depuis",
                value: `<t:${upvalue}>`,
                inline: true
            }
        ],
        type: 'editreply'
    }, interaction)
}

 
