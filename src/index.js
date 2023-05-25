const Discord = require('discord.js');
const chalk = require('chalk');
require('dotenv').config('./.env');
const express = require('express');
const app = express();
app.get('/', (req, res) => {
  res.send('This bot is running CorwinDev\'s  <a href="https://github.com/CorwinDev/Discord-Bot">Discord-Bot</a>')
})

app.listen(3000)

const axios = require('axios');
// Check if is up to date
const { version } = require('.././package.json');
axios.get('https://api.github.com/repos/CorwinDev/Discord-Bot/releases/latest').then(res => {
  if (res.data.tag_name !== version) {
    console.log(chalk.red.bgYellow(`Votre bot n'est pas à jour! Veuillez mettre à jour la dernière version!`, version + ' -> ' + res.data.tag_name));
  }
}).catch(err => {
  console.log(chalk.red.bgYellow(`Impossible de vérifier si Le Friturier est à jour!`));
});


const webhook = require("./config/webhooks.json");
const config = require("./config/bot.js");
const webHooksArray = ['startLogs', 'shardLogs', 'errorLogs', 'dmLogs', 'voiceLogs', 'serverLogs', 'serverLogs2', 'commandLogs', 'consoleLogs', 'warnLogs', 'voiceErrorLogs', 'creditLogs', 'evalLogs', 'interactionLogs'];
// Check if .env webhook_id and webhook_token are set
if (process.env.WEBHOOK_ID && process.env.WEBHOOK_TOKEN) {
  for (const webhookName of webHooksArray) {
    webhook[webhookName].id = process.env.WEBHOOK_ID;
    webhook[webhookName].token = process.env.WEBHOOK_TOKEN;
  }
}


const startLogs = new Discord.WebhookClient({
  id: webhook.startLogs.id,
  token: webhook.startLogs.token,
});

const shardLogs = new Discord.WebhookClient({
  id: webhook.shardLogs.id,
  token: webhook.shardLogs.token,
});

const manager = new Discord.ShardingManager('./src/bot.js', {
  totalShards: 'auto',
  token: process.env.DISCORD_TOKEN,
  respawn: true
});
if (process.env.TOPGG_TOKEN) {
  const { AutoPoster } = require('topgg-autoposter');
  AutoPoster(process.env.TOPGG_TOKEN, manager);
}
console.clear();
console.log(chalk.blue(chalk.bold(`Système`)), (chalk.white(`>>`)), (chalk.green(`Démarrage`)), (chalk.white(`...`)))
console.log(`\u001b[0m`)
console.log(`\u001b[0m`)
console.log(`\u001b[0m`)
console.log(chalk.blue(chalk.bold(`Système`)), (chalk.white(`>>`)), chalk.red(`Version ${require(`${process.cwd()}/package.json`).version}`), (chalk.green(`loaded`)))
console.log(`\u001b[0m`);

manager.on('shardCreate', shard => {
  let embed = new Discord.EmbedBuilder()
    .setTitle(`🆙・Lancement du Fragment`)
    .setDescription(`Un fragment vient d'être lancé`)
    .setFields([
      {
        name: "🆔┆ID",
        value: `${shard.id + 1}/${manager.totalShards}`,
        inline: true
      },
      {
        name: `📃┆État`,
        value: `Démarrage...`,
        inline: true
      }
    ])
    .setColor(config.colors.normal)
  startLogs.send({
    username: 'Journaux de bot',
    embeds: [embed],
  });

  console.log(chalk.blue(chalk.bold(`Système`)), (chalk.white(`>>`)), (chalk.green(`Démarrage`)), chalk.red(`Fragment #${shard.id + 1}`), (chalk.white(`...`)))
  console.log(`\u001b[0m`);

  shard.on("death", (process) => {
    const embed = new Discord.EmbedBuilder()
      .setTitle(`🚨・Fermeture du Fragment ${shard.id + 1}/${manager.totalShards} de façon inattendue`)
      .setFields([
        {
          name: "🆔┆ID",
          value: `${shard.id + 1}/${manager.totalShards}`,
        },
      ])
      .setColor(config.colors.normal)
    shardLogs.send({
      username: 'Bot Logs',
      embeds: [embed]
    });

    if (process.exitCode === null) {
      const embed = new Discord.EmbedBuilder()
        .setTitle(`🚨・Fragment ${shard.id + 1}/${manager.totalShards} Sortie avec le code d'erreur null!`)
        .setFields([
          {
            name: "PID",
            value: `\`${process.pid}\``,
          },
          {
            name: "Code de sortie",
            value: `\`${process.exitCode}\``,
          }
        ])
        .setColor(config.colors.normal)
      shardLogs.send({
        username: 'Bot Logs',
        embeds: [embed]
      });
    }
  });

  shard.on("shardDisconnect", (event) => {
    const embed = new Discord.EmbedBuilder()
      .setTitle(`🚨・Shard ${shard.id + 1}/${manager.totalShards} débranché`)
      .setDescription("Événement de fermeture de socket de décharge...")
      .setColor(config.colors.normal)
    shardLogs.send({
      username: 'Bot Logs',
      embeds: [embed],
    });
  });

  shard.on("shardReconnecting", () => {
    const embed = new Discord.EmbedBuilder()
      .setTitle(`🚨・Reconnexion du Fragment ${shard.id + 1}/${manager.totalShards}`)
      .setColor(config.colors.normal)
    shardLogs.send({
      username: 'Bot Logs',
      embeds: [embed],
    });
  });
});


manager.spawn();


// Webhooks
const consoleLogs = new Discord.WebhookClient({
  id: webhook.consoleLogs.id,
  token: webhook.consoleLogs.token,
});

const warnLogs = new Discord.WebhookClient({
  id: webhook.warnLogs.id,
  token: webhook.warnLogs.token,
});

process.on('unhandledRejection', error => {
  console.error('Unhandled promise rejection:', error);
  if (error) if (error.length > 950) error = error.slice(0, 950) + '... view console for details';
  if (error.stack) if (error.stack.length > 950) error.stack = error.stack.slice(0, 950) + '... view console for details';
  if (!error.stack) return
  const embed = new Discord.EmbedBuilder()
    .setTitle(`🚨・Unhandled promise rejection`)
    .addFields([
      {
        name: "Error",
        value: error ? Discord.codeBlock(error) : "No error",
      },
      {
        name: "Stack error",
        value: error.stack ? Discord.codeBlock(error.stack) : "No stack error",
      }
    ])
  consoleLogs.send({
    username: 'Bot Logs',
    embeds: [embed],
  }).catch(() => {
    console.log('Error sending unhandled promise rejection to webhook')
    console.log(error)
  })
});

process.on('warning', warn => {
  console.warn("Warning:", warn);
  const embed = new Discord.EmbedBuilder()
    .setTitle(`🚨・New warning found`)
    .addFields([
      {
        name: `Warn`,
        value: `\`\`\`${warn}\`\`\``,
      },
    ])
  warnLogs.send({
    username: 'Bot Logs',
    embeds: [embed],
  }).catch(() => {
    console.log('Error sending warning to webhook')
    console.log(warn)
  })
});