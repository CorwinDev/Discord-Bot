const Discord = require('discord.js');
const chalk = require('chalk');

require('dotenv').config();
const express = require('express')
const app = express()
app.get('/', function (req, res) {
res.send('Hello World')
})
app.listen(3000)
const webhook = require("./config/webhooks.json");
const config = require("./config/bot.js");

const startLogs = new Discord.WebhookClient({
    id: webhook.startLogs.id,
    token: webhook.startLogs.token,
});

const shardLogs = new Discord.WebhookClient({
    id: webhook.shardLogs.id,
    token: webhook.shardLogs.token,
});

const manager = new Discord.ShardingManager('./src/bot.js', {
    totalShards: 1,
    token: process.env.DISCORD_TOKEN,
    timeout: -1,
    respawn: true
});

// const { AutoPoster } = require('topgg-autoposter');
// const poster = AutoPoster(process.env.TOPGG_TOKEN, manager);

console.clear();
console.log(chalk.blue(chalk.bold(`Systeme`)), (chalk.white(`>>`)), (chalk.green(`Démarrage`)), (chalk.white(`...`)))
console.log(`\u001b[0m`)
console.log(chalk.red(`${new Date()}`))
console.log(`\u001b[0m`)
console.log(chalk.blue(chalk.bold(`Système`)), (chalk.white(`>>`)), chalk.red(`Version ${require(`${process.cwd()}/package.json`).version}`), (chalk.green(`chargée`)))
console.log(`\u001b[0m`);

manager.on('shardCreate', shard => {
    let embed = new Discord.MessageEmbed()
        .setTitle(`🆙・Démarrage du bot`)
        .setDescription(`Le fragment ${shard.id + 1} a été démarré`)
        .addField("🆔┆ID", `${shard.id + 1}/${manager.totalShards}`, true)
        .addField(`📃┆Etat`, `Démarrage...`, true)
        .setColor(config.colors.normal)
    startLogs.send({
        username: 'Logs bot',
        embeds: [embed],
    });

    console.log(chalk.blue(chalk.bold(`Systeme`)), (chalk.white(`>>`)), (chalk.green(`Démarrage`)), chalk.red(`Fragment #${shard.id + 1}`), (chalk.white(`...`)))
    console.log(`\u001b[0m`);

    shard.on("death", (process) => {
        const embed = new Discord.MessageEmbed()
            .setTitle(`🚨・Fermeture du fragment ${shard.id + 1}/${manager.totalShards} de manière innatendue`)
            .addField("PID", `\`${process.pid}\``)
            .addField("Code de sortie", `\`${process.exitCode}\``)
            .setColor(config.colors.normal)
        shardLogs.send({
            username: 'Logs bot',
            embeds: [embed]
        });

        if (process.exitCode === null) {
            const embed = new Discord.MessageEmbed()
                .setTitle(`🚨・Fragment ${shard.id + 1}/${manager.totalShards} exited with NULL error code!`)
                .addField("PID", `\`${process.pid}\``)
                .addField("Code de sortie", `\`${process.exitCode}\``)
                .setColor(config.colors.normal)
            shardLogs.send({
                username: 'Logs bot',
                embeds: [embed]
            });
        }
    });

    shard.on("shardDisconnect", (event) => {
        const embed = new Discord.MessageEmbed()
            .setTitle(`🚨・Fragment ${shard.id + 1}/${manager.totalShards} déconnecté`)
            .setDescription("Dumping socket close event...")
            .setColor(config.colors.normal)
        shardLogs.send({
            username: 'Logs bot',
            embeds: [embed],
        });
    });

    shard.on("shardReconnecting", () => {
        const embed = new Discord.MessageEmbed()
            .setTitle(`🚨・Reconnection du fragment ${shard.id + 1}/${manager.totalShards}`)
            .setColor(config.colors.normal)
        shardLogs.send({
            username: 'Logs bot',
            embeds: [embed],
        });
    });
});


manager.spawn();
