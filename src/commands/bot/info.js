const Discord = require('discord.js');
const moment = require("moment");
require("moment-duration-format");

module.exports = async (client, interaction, args) => {
    const promises = [
        client.shard.broadcastEval(client => client.guilds.cache.size),
        client.shard.broadcastEval(client => client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0)),
        client.shard.broadcastEval(client => client.channels.cache.size),
        client.shard.broadcastEval(client => client.voice.adapters.size)
    ];
    return Promise.all(promises)
        .then(async results => {
            const totalGuilds = results[0].reduce((acc, guildCount) => acc + guildCount, 0);
            const totalMembers = results[1].reduce((acc, memberCount) => acc + memberCount, 0);
            const totalChannels = results[2].reduce((acc, channelCount) => acc + channelCount, 0);
            const totalVoice = results[3].reduce((acc, voiceCount) => acc + voiceCount, 0);

            const duration = moment.duration(client.uptime).format("\`D\` [days], \`H\` [hrs], \`m\` [mins], \`s\` [secs]");

            client.embed({
                title: `ℹ・BOT INFORMATION`,
                desc: `____________________________`,
                thumbnail: client.user.avatarURL({ size: 1024 }),
                fields: [
               {
                    name: "ℹ️┆Information",
                    value: `Bot est un bot avec lequel vous pouvez exécuter l'ensemble de votre serveur!Avec plus de 350+ commandes, nous avons un grand bot avec de nombreuses options pour améliorer votre serveur!`,
                    inline: false,
                },
                {
                    name: "_____ \n\n│General",
                    value: `_____`,
                    inline: false,
                },
                {
                    name: "🤖┆Nom de bot",
                    value: `${client.user.username}`,
                    inline: true,
                },
                {
                    name: "🆔┆Id bot",
                    value: `${client.user.id}`,
                    inline: true,
                },
                {
                    name: "💻┆Fragments",
                    value: `\`${client.options.shardCount}\` fragments`,
                    inline: true,
                },
                {
                    name: "🔧┆Propriétaire de bot",
                    value: `<@!755297485328482356> `,
                    inline: true,
                },
                {
                    name: "🔧┆Développeur de bot",
                    value: `<@!755297485328482356> <@!884553151666061372>`,
                    inline: true,
                },
                {
                    name: "💻┆Commandes",
                    value: `\`${client.commands.size}\` commandes`,
                    inline: true,
                },
                {
                    name: "🌐┆Les serveurs",
                    value: `\`${totalGuilds}\` les serveurs`,
                    inline: true,
                },
                {
                    name: "🌐┆Serveurs ce fragment",
                    value: `\`${client.guilds.cache.size}\` les serveurs`,
                    inline: true,
                },
                {
                    name: "👥┆Membres",
                    value: `\`${totalMembers}\` membres`,
                    inline: true,
                },
                {
                    name: "🔊┆Canaux connectés",
                    value: `\`${totalVoice}\` canaux`,
                    inline: true,
                },
                {
                    name: "📺┆Canaux",
                    value: `\`${totalChannels}\` canaux`,
                    inline: true,
                },
                {
                    name: "📅┆Créé",
                    value: `<t:${Math.round(client.user.createdTimestamp / 1000)}>`,
                    inline: true,
                },

                {
                    name: "_____ \n\n│Système",
                    value: `_____`,
                    inline: false,
                },
                {
                    name: "🆙┆Durée de la baisse",
                    value: `${duration}`,
                    inline: true,
                },
                {
                    name: "⌛┆Vitesse de l'API:",
                    value: `\`${client.ws.ping}\`ms`,
                    inline: true,
                },
                {
                    name: "🏷┆Version bot",
                    value: `\`${require(`${process.cwd()}/package.json`).version}\``,
                    inline: true,
                },
                {
                    name: "🏷┆Version Node.js",
                    value: `\`${process.version}\``,
                    inline: true,
                },
                {
                    name: "📂┆Version Discord.js",
                    value: `\`${Discord.version}\``,
                    inline: true,
                },
                {
                    name: "💾┆Mémoire de bot",
                    value: `\`${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}\` MB`,
                    inline: true,
                },
                {
                    name: "🔗┆Liens",
                    value: `Add me: [[HERE]](${client.config.discord.botInvite}) \nSupport server: [[HERE]](${client.config.discord.serverInvite})`,
                    inline: false,
                }],
                type: 'editreply'
            }, interaction)
        })
}

 
