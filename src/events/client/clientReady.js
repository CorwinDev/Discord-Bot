const Discord = require('discord.js');
const chalk = require('chalk');

module.exports = async (client) => {
    const startLogs = new Discord.WebhookClient({
        id: client.webhooks.startLogs.id,
        token: client.webhooks.startLogs.token,
    });

    console.log(`\u001b[0m`);
    console.log(chalk.blue(chalk.bold(`System`)), (chalk.white(`>>`)), chalk.red(`Shard #${client.shard.ids[0] + 1}`), chalk.green(`is ready!`));
    console.log(chalk.blue(chalk.bold(`Bot`)), (chalk.white(`>>`)), chalk.green(`Started on`), chalk.red(`${client.guilds.cache.size}`), chalk.green(`servers!`));

    let embed = new Discord.EmbedBuilder()
        .setTitle(`🆙・Finishing shard`)
        .setDescription(`A shard just finished`)
        .addFields(
            { name: "🆔┆ID", value: `${client.shard.ids[0] + 1}/${client.options.shardCount}`, inline: true },
            { name: "📃┆State", value: `Ready`, inline: true },
        )
        .setColor(client.config.colors.normal);
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
                    statuttext = process.env.DISCORD_STATUS.split(', ').map(status => ({
                        name: status,
                        type: Discord.ActivityType.Watching // Default type, change if necessary
                    }));
                } else {
                    statuttext = [
                        { name: `League of Legends`, type: Discord.ActivityType.Playing },
                        { name: `Minecraft`, type: Discord.ActivityType.Playing },
                        { name: `Rocket League`, type: Discord.ActivityType.Playing },
                        { name: `si aucune rebellion ne se forme`, type: Discord.ActivityType.Watching },
                        { name: `le crépitement de la friture`, type: Discord.ActivityType.Listening },
                        { name: `si Pierre fait pas de bêtises`, type: Discord.ActivityType.Watching },
                        { name: `si ça joue à LoL`, type: Discord.ActivityType.Watching },
                        { name: `si Yuumi a fini sa sieste`, type: Discord.ActivityType.Watching },
                        { name: `si Lisa a bu son camfé aujourd'hui`, type: Discord.ActivityType.Watching },
                        { name: `si Eliott et Mathieu ont ouvert le café jazz`, type: Discord.ActivityType.Watching },
                        { name: `si Davy sait toujours dessiner des bateaux`, type: Discord.ActivityType.Watching },
                        { name: `si Richard a trouvé le chemin de l'hosaku`, type: Discord.ActivityType.Watching },
                        { name: `si Diana est toujours chafouine`, type: Discord.ActivityType.Watching },
                        { name: `si Thibault maitrise toujours les 4 éléments`, type: Discord.ActivityType.Watching },
                        { name: `si Thomas a ajouté un nouveau film à sa liste`, type: Discord.ActivityType.Watching },
                        { name: `si une séance cinéma se prépare`, type: Discord.ActivityType.Watching },
                        { name: `si Richard a trouvé le chemin de l'hosaku`, type: Discord.ActivityType.Watching },
                        { name: `si Mathias et Charlotte profitent du soleil`, type: Discord.ActivityType.Watching },
                        { name: `si Ben peut me soulever. J'ai chaud`, type: Discord.ActivityType.Watching },
                        { name: `si Théo est toujours aussi magnifique`, type: Discord.ActivityType.Watching },
                        { name: `si Peter est toujours suspicious :peterSus:`, type: Discord.ActivityType.Watching },
                        { name: `si de nouveaux sons sur la soundboard ont été ajoutés`, type: Discord.ActivityType.Watching },
                        { name: `si on a encore banni un random`, type: Discord.ActivityType.Watching },
                        { name: `si il y a un anniversaire aujourd'hui`, type: Discord.ActivityType.Watching },
                        { name: `${totalGuilds} serveurs`, type: Discord.ActivityType.Watching }
                    ];
                }

                const randomText = statuttext[Math.floor(Math.random() * statuttext.length)];

                // Vérification supplémentaire pour s'assurer que randomText est bien défini et a les propriétés nécessaires
                if (randomText && typeof randomText.name === 'string' && typeof randomText.type === 'number') {
                    client.user.setPresence({ activities: [{ name: randomText.name, type: randomText.type }], status: 'online' });
                } else {
                    console.error('Invalid activity format or type:', randomText);
                }
            })
            .catch(error => {
                console.error('Error fetching guild sizes:', error);
            });
    }, 50000);

    client.player.init(client.user.id);
};
