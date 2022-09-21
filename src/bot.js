const Discord = require('discord.js');
const fs = require('fs');
const { Manager } = require("erela.js");
const Spotify = require("erela.js-spotify");
const Facebook = require("erela.js-facebook");
const Deezer = require("erela.js-deezer");
const AppleMusic = require("erela.js-apple");

const client = new Discord.Client({
    allowedMentions: {
        parse: [
            'users',
            'roles'
        ],
        repliedUser: true
    },
    autoReconnect: true,
    disabledEvents: [
        "TYPING_START"
    ],
    partials: [
        'USER',
        'CHANNEL',
        'GUILD_MEMBER',
        'MESSAGE',
        'REACTION',
        'GUILD_SCHEDULED_EVENT'
    ],
    intents: [
        Discord.Intents.FLAGS.GUILDS,
        Discord.Intents.FLAGS.GUILD_MEMBERS,
        Discord.Intents.FLAGS.GUILD_BANS,
        Discord.Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS,
        Discord.Intents.FLAGS.GUILD_INTEGRATIONS,
        Discord.Intents.FLAGS.GUILD_WEBHOOKS,
        Discord.Intents.FLAGS.GUILD_INVITES,
        Discord.Intents.FLAGS.GUILD_VOICE_STATES,
        Discord.Intents.FLAGS.GUILD_MESSAGES,
        Discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
        Discord.Intents.FLAGS.GUILD_MESSAGE_TYPING,
        Discord.Intents.FLAGS.DIRECT_MESSAGES,
        Discord.Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
        Discord.Intents.FLAGS.DIRECT_MESSAGE_TYPING,
        Discord.Intents.FLAGS.GUILD_SCHEDULED_EVENTS,
    ],
    restTimeOffset: 0
});


const clientID = "bf5ee2a72bae40ffadc71a47280e5ff9";
const clientSecret = "053469ffeb3844079fab734ebf3090c2";

// Lavalink client
client.player = new Manager({
    plugins: [
        new AppleMusic(),
        new Deezer(),
        new Facebook(),
        new Spotify({
            clientID,
            clientSecret,
            playlistLimit: 100,
            albumLimit: 100
        })
    ],
    nodes: [
        {
            host: "lava.link",
            port: 80,
            password: "NitrixEXE OP",
        },
    ],
    send(id, payload) {
        const guild = client.guilds.cache.get(id);
        if (guild) guild.shard.send(payload);
    },
})

const events = fs.readdirSync(`./src/events/music`).filter(files => files.endsWith('.js'));

for (const file of events) {
    const event = require(`./events/music/${file}`);
    client.player.on(file.split(".")[0], event.bind(null, client)).setMaxListeners(0);
};

// Connect to database
require("./database/connect")();

// Client settings
client.config = require('./config/bot');
client.changelogs = require('./config/changelogs');
client.emotes = require("./config/emojis.json");
client.webhooks = require("./config/webhooks.json");
client.commands = new Discord.Collection();
client.playerManager = new Map();
client.triviaManager = new Map();
client.queue = new Map();

// Webhooks
const consoleLogs = new Discord.WebhookClient({
    id: client.webhooks.consoleLogs.id,
    token: client.webhooks.consoleLogs.token,
});

const warnLogs = new Discord.WebhookClient({
    id: client.webhooks.warnLogs.id,
    token: client.webhooks.warnLogs.token,
});

// Load handlers
fs.readdirSync('./src/handlers').forEach((dir) => {
    fs.readdirSync(`./src/handlers/${dir}`).forEach((handler) => {
        require(`./handlers/${dir}/${handler}`)(client);
    });
});

client.login(process.env.DISCORD_TOKEN);

process.on('unhandledRejection', error => {
    const embed = new Discord.MessageEmbed()
        .setTitle(`🚨・Unhandled promise rejection`)
        .addField(`Error`, `\`\`\`${error}\`\`\``)
        .addField(`Stack error`, `\`\`\`${error.stack}\`\`\``)
        .setColor(client.config.colors.normal)
    consoleLogs.send({
        username: 'Bot Logs',
        embeds: [embed],
    }).catch(() => {
        console.log(error)
    })
});

process.on('warning', warn => {
    const embed = new Discord.MessageEmbed()
        .setTitle(`🚨・New warning found`)
        .addField(`Warn`, `\`\`\`${warn}\`\`\``)
        .setColor(client.config.colors.normal)
    warnLogs.send({
        username: 'Bot Logs',
        embeds: [embed],
    }).catch(( ) => { })
});

client.on('shardError', error => {
    const embed = new Discord.MessageEmbed()
        .setTitle(`🚨・A websocket connection encountered an error`)
        .addField(`Error`, `\`\`\`${error}\`\`\``)
        .addField(`Stack error`, `\`\`\`${error.stack}\`\`\``)
        .setColor(client.config.colors.normal)
    consoleLogs.send({
        username: 'Bot Logs',
        embeds: [embed],
    });
});


const express = require('express');
const app = express();
const port = 8080;
app.all('/', (req, res) => {
  res.send(`Express Activated`);
  res.end();
});
