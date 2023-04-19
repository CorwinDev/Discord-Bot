const Discord = require('discord.js');
const chalk = require('chalk');
const { random } = require('mathjs');

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
        .addFields(
            { name: "🆔┆ID", value: `${client.shard.ids[0] + 1}/${client.options.shardCount}`, inline: true },
            { name: "📃┆State", value: `Ready`, inline: true },
        )
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
            let statuttext;
            if (process.env.DISCORD_STATUS) {
                statuttext = process.env.DISCORD_STATUS.split(', ');
            } else {
                statuttext = [
                    { name: `League of Legends`, type: Discord.ActivityType.Competing },
                    { name: `si aucune rebellion ne se forme`, type: Discord.ActivityType.Watching },
                    { name: `le crépitement de la friture`, type: Discord.ActivityType.Listening },
                    { name: `si Eliott fait pas de bêtises`, type: Discord.ActivityType.Watching },
                    { name: `si ça joue à LoL`, type: Discord.ActivityType.Watching },
                    { name: `si Thomas est toujours aussi beau aujourd'hui`, type: Discord.ActivityType.Watching },
                    { name: `${totalGuilds} serveurs`, type: Discord.ActivityType.Watching}
                ];
            }
            const randomText = statuttext[Math.floor(Math.random() * statuttext.length)];
            client.user.setPresence({ activities: [{ name: randomText.name, type: randomText.type }], status: 'online' });
            })
    }, 50000)

    client.player.init(client.user.id);
}

