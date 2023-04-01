const discord = require('discord.js');

const ticketChannels = require("../../database/models/ticketChannels");

module.exports = async (client, channel) => {
    let types = {
        0: "Text Channel",
        2: "Voice Channel",
        4: "Category",
        5: "News Channel",
        10: "News Thread",
        11: "Public Thread",
        12: "Private Thread",
        13: "Stage Channel",
        14: "Category",
    }
    
    const logsChannel = await client.getLogs(channel.guild.id);
    if (!logsChannel) return;

    client.embed({
        title: `🔧・Channel deleted`,
        desc: `A channel has been deleted`,
        fields: [
            {
                name: `> Name`,
                value: `- ${channel.name}`
            },
            {
                name: `> ID`,
                value: `- ${channel.id}`
            },
            {
                name: `> Category`,
                value: `- ${channel.parent}`
            },
            {
                name: `> Type`,
                value: `- ${types[channel.type]}`
            }
        ]
    }, logsChannel).catch(() => { })

    try {
        ticketChannels.findOne({ Guild: channel.guild.id, channelID: channel.id }, async (err, data) => {
            if (data) {
                var remove = await ticketChannels.deleteOne({ Guild: channel.guild.id, channelID: channel.id });
            }
        })
    }
    catch { }
};