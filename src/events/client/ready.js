const Discord = require('discord.js');
const chalk = require('chalk');

module.exports = async (client) => {
    const startLogs = new Discord.WebhookClient({
        id: client.webhooks.startLogs.id,
        token: client.webhooks.startLogs.token,
    });

    console.log(`\u001b[0m`);
    console.log(chalk.blue(chalk.bold(`System`)), (chalk.white(`>>`)), chalk.red(`Shard #${client.shard.ids[0] + 1}`), chalk.green(`is ready!`))
    console.log(chalk.blue(chalk.bold(`Bot`)), (chalk.white(`>>`)), chalk.green(`Started on`), chalk.red(`${client.guilds.cache.size}`), chalk.green(`servers!`))

    let embed = new Discord.EmbedBuilder()
        .setTitle(`🆙・Finishing shard`)
        .setDescription(`A shard just finished`)
        .addField("🆔┆ID", `${client.shard.ids[0] + 1}/${client.options.shardCount}`, true)
        .addField(`📃┆State`, `Ready`, true)
        .setColor(client.config.colors.normal)
    startLogs.send({
        username: 'Bot Logs',
        embeds: [embed],
    });

    setInterval(async function () {
        const promises = [
            client.shard.fetchClientValues('guilds.cache.size'),
        ];
        return Promise.all(promises)
            .then(results => {
                const totalGuilds = results[0].reduce((acc, guildCount) => acc + guildCount, 0);

                let statuttext = [
                    `・❓┆/help`,
                    `・💻┆${totalGuilds} servers`,
                    `・📨┆discord.me/Bot`,
                    `・🎉┆400+ commands`,
                    `・🏷️┆Version ${require(`${process.cwd()}/package.json`).version}`
                ];
                const randomText = statuttext[Math.floor(Math.random() * statuttext.length)];

                client.user.setPresence({
                    activities: [
                        {
                            name: randomText,
                            type: "STREAMING",
                            url: "https://www.twitch.tv/discord"
                        }
                    ]
                });
            })
    }, 50000)

    client.player.init(client.user.id);
}

 