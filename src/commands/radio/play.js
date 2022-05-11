const Discord = require('discord.js');
const Schema = require("../../database/models/music");

module.exports = async (client, interaction, args) => {
    const webhookClientLogs = new Discord.WebhookClient({
        id: client.webhooks.voiceLogs.id,
        token: client.webhooks.voiceLogs.token,
    });

    let channel = interaction.member.voice ? interaction.member.voice.channel : null;
    if (!channel) return client.errNormal({ text: `The channel does not exist!`, type: 'editreply' }, interaction);

    client.radioStart(channel);

    Schema.findOne({ Guild: interaction.guild.id }, async (err, data) => {
        if (data) {
            data.Channel = channel.id;
            data.save();
        }
        else {
            new Schema({
                Guild: interaction.guild.id,
                Channel: channel.id,
            }).save();
        }
    })

    client.embed({
        title: `📻・Started radio`,
        desc: `Radio has started successfully \nTo make the bot leave do: \`rleave\``,
        fields: [{
            name: "👤┆Started By",
            value: `${interaction.user} (${interaction.user.tag})`,
            inline: true
        },
        {
            name: "📺┆Channel",
            value: `${channel} (${channel.name})`,
            inline: true
        },
        {
            name: "🎶┆Radio Station",
            value: `[Radio 538](https://www.538.nl/)`,
            inline: true
        },
        ],
        type: 'editreply'
    }, interaction)

    let embed = new Discord.MessageEmbed()
        .setTitle(`📻・Started radio`)
        .setDescription(`_______________ \n\nRadio has started successfully`)
        .addField('👤┆Started by', `${interaction.user} (${interaction.user.tag})`, true)
        .addField(`📺┆Channel`, `${channel} (${channel.id})`, true)
        .addField(`⚙️┆Guild`, `${interaction.guild.name} (${interaction.guild.id})`, true)
        .setColor(client.config.colors.normal)
        .setTimestamp();
    webhookClientLogs.send({
        username: 'Bot Logs',
        embeds: [embed],
    });
}

 