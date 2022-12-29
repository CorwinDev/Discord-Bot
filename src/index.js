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
    totalShards: 2,
    token: process.env.DISCORD_TOKEN,
    respawn: true
});

// const { AutoPoster } = require('topgg-autoposter');
// const poster = AutoPoster(process.env.TOPGG_TOKEN, manager);

console.clear();
console.log(chalk.blue(chalk.bold(`System`)), (chalk.white(`>>`)), (chalk.green(`Starting up`)), (chalk.white(`...`)))
console.log(`\u001b[0m`)
console.log(chalk.red(`© Uo | 2021 - ${new Date().getFullYear()}`))
console.log(chalk.red(`All rights reserved`))
console.log(`\u001b[0m`)
console.log(`\u001b[0m`)
console.log(chalk.blue(chalk.bold(`System`)), (chalk.white(`>>`)), chalk.red(`Version ${require(`${process.cwd()}/package.json`).version}`), (chalk.green(`loaded`)))
console.log(`\u001b[0m`);

manager.on('shardCreate', shard => {
    let embed = new Discord.MessageEmbed()
        .setTitle(`🆙・Launching shard`)
        .setDescription(`A shard has just been launched`)
        .addField("🆔┆ID", `${shard.id + 1}/${manager.totalShards}`, true)
        .addField(`📃┆State`, `Starting up...`, true)
        .setColor(config.colors.normal)
    startLogs.send({
        username: 'Bot Logs',
        embeds: [embed],
    });

    console.log(chalk.blue(chalk.bold(`System`)), (chalk.white(`>>`)), (chalk.green(`Starting`)), chalk.red(`Shard #${shard.id + 1}`), (chalk.white(`...`)))
    console.log(`\u001b[0m`);

    shard.on("death", (process) => {
        const embed = new Discord.MessageEmbed()
            .setTitle(`🚨・Closing shard ${shard.id + 1}/${manager.totalShards} unexpectedly`)
            .addField("PID", `\`${process.pid}\``)
            .addField("Exit code", `\`${process.exitCode}\``)
            .setColor(config.colors.normal)
        shardLogs.send({
            username: 'Bot Logs',
            embeds: [embed]
        });

        if (process.exitCode === null) {
            const embed = new Discord.MessageEmbed()
                .setTitle(`🚨・Shard ${shard.id + 1}/${manager.totalShards} exited with NULL error code!`)
                .addField("PID", `\`${process.pid}\``)
                .addField("Exit code", `\`${process.exitCode}\``)
                .setColor(config.colors.normal)
            shardLogs.send({
                username: 'Bot Logs',
                embeds: [embed]
            });
        }
    });

    shard.on("shardDisconnect", (event) => {
        const embed = new Discord.MessageEmbed()
            .setTitle(`🚨・Shard ${shard.id + 1}/${manager.totalShards} disconnected`)
            .setDescription("Dumping socket close event...")
            .setColor(config.colors.normal)
        shardLogs.send({
            username: 'Bot Logs',
            embeds: [embed],
        });
    });

    shard.on("shardReconnecting", () => {
        const embed = new Discord.MessageEmbed()
            .setTitle(`🚨・Reconnecting shard ${shard.id + 1}/${manager.totalShards}`)
            .setColor(config.colors.normal)
        shardLogs.send({
            username: 'Bot Logs',
            embeds: [embed],
        });
    });
});


manager.spawn();

 