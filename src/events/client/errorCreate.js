const Discord = require('discord.js');
const generator = require('generate-password');

module.exports = (client, err, command, interaction) => {
    const password = generator.generate({
        length: 10,
        numbers: true
    });

    const errorlog = new Discord.WebhookClient({
        id: client.webhooks.errorLogs.id,
        token: client.webhooks.errorLogs.token,
    });

    let embed = new Discord.MessageEmbed()
        .setTitle(`🚨・${password}`)
        .addField("✅┇Guild", `${interaction.guild.name} (${interaction.guild.id})`)
        .addField(`💻┇Command`, `${command}`)
        .addField(`💬┇Error`, `\`\`\`${err}\`\`\``)
        .addField(`📃┇Stack error`, `\`\`\`${err.stack.substr(0, 1018)}\`\`\``)
        .setColor(client.config.colors.normal)
    errorlog.send({
        username: `Bot errors`,
        embeds: [embed],

    }).catch(error => { console.log(error) })

    let row = new Discord.MessageActionRow()
        .addComponents(
            new Discord.MessageButton()
                .setLabel("Support server")
                .setURL(client.config.discord.serverInvite)
                .setStyle("LINK"),
        );

    client.embed({
        title: `${client.emotes.normal.error}・Error`,
        desc: `There was an error executing this command`,
        color: client.config.colors.error,
        fields: [
            {
                name: `Error code`,
                value: `\`${password}\``,
                inline: true,
            },
            {
                name: `What now?`,
                value: `You can contact the developers by joining the support server`,
                inline: true,
            }
        ],
        components: [row],
        type: 'editreply'
    }, interaction).catch(() => {
        client.embed({
            title: `${client.emotes.normal.error}・Error`,
            desc: `There was an error executing this command`,
            color: client.config.colors.error,
            fields: [
                {
                    name: `Error code`,
                    value: `\`${password}\``,
                    inline: true,
                },
                {
                    name: `What now?`,
                    value: `You can contact the developers by joining the support server`,
                    inline: true,
                }
            ],
            components: [row],
            type: 'reply'
        }, interaction)
    })
};