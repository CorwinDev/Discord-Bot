const Discord = require('discord.js');
const fs = require('fs');

const { Manager } = require("erela.js");
const Spotify = require("erela.js-spotify");
const Facebook = require("erela.js-facebook");
const Deezer = require("erela.js-deezer");
const AppleMusic = require("erela.js-apple");

// Discord client
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
        Discord.Partials.Channel,
        Discord.Partials.GuildMember,
        Discord.Partials.Message,
        Discord.Partials.Reaction,
        Discord.Partials.User,
        Discord.Partials.GuildScheduledEvent
    ],
    intents: [
        Discord.GatewayIntentBits.Guilds,
        Discord.GatewayIntentBits.GuildMembers,
        Discord.GatewayIntentBits.GuildBans,
        Discord.GatewayIntentBits.GuildEmojisAndStickers,
        Discord.GatewayIntentBits.GuildIntegrations,
        Discord.GatewayIntentBits.GuildWebhooks,
        Discord.GatewayIntentBits.GuildInvites,
        Discord.GatewayIntentBits.GuildVoiceStates,
        Discord.GatewayIntentBits.GuildMessages,
        Discord.GatewayIntentBits.GuildMessageReactions,
        Discord.GatewayIntentBits.GuildMessageTyping,
        Discord.GatewayIntentBits.DirectMessages,
        Discord.GatewayIntentBits.DirectMessageReactions,
        Discord.GatewayIntentBits.DirectMessageTyping,
        Discord.GatewayIntentBits.GuildScheduledEvents,
        Discord.GatewayIntentBits.MessageContent
    ],
    restTimeOffset: 0
});


const clientID = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
if (clientID && clientSecret) {
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
                host: process.env.LAVALINK_HOST || "lava.link",
                port: parseInt(process.env.LAVALINK_PORT) || 80,
                password: process.env.LAVALINK_PASSWORD || "CorwinDev"
            },
        ],
        send(id, payload) {
            const guild = client.guilds.cache.get(id);
            if (guild) guild.shard.send(payload);
        },
    })

} else {
    // Lavalink client
    client.player = new Manager({
        plugins: [
            new AppleMusic(),
            new Deezer(),
            new Facebook(),
        ],
        nodes: [
            {
                host: process.env.LAVALINK_HOST || "lava.link",
                port: parseInt(process.env.LAVALINK_PORT) || 80,
                password: process.env.LAVALINK_PASSWORD || "CorwinDev"
            },
        ],
        send(id, payload) {
            const guild = client.guilds.cache.get(id);
            if (guild) guild.shard.send(payload);
        }
    })
}
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
if (process.env.WEBHOOK_ID && process.env.WEBHOOK_TOKEN) {
    client.webhooks.startLogs.id = process.env.WEBHOOK_ID;
    client.webhooks.startLogs.token = process.env.WEBHOOK_TOKEN;

    client.webhooks.shardLogs.id = process.env.WEBHOOK_ID;
    client.webhooks.shardLogs.token = process.env.WEBHOOK_TOKEN;

    client.webhooks.errorLogs.id = process.env.WEBHOOK_ID;
    client.webhooks.errorLogs.token = process.env.WEBHOOK_TOKEN;

    client.webhooks.dmLogs.id = process.env.WEBHOOK_ID;
    client.webhooks.dmLogs.token = process.env.WEBHOOK_TOKEN;

    client.webhooks.voiceLogs.id = process.env.WEBHOOK_ID;
    client.webhooks.voiceLogs.token = process.env.WEBHOOK_TOKEN;

    client.webhooks.serverLogs.id = process.env.WEBHOOK_ID;
    client.webhooks.serverLogs.token = process.env.WEBHOOK_TOKEN;

    client.webhooks.serverLogs2.id = process.env.WEBHOOK_ID;
    client.webhooks.serverLogs2.token = process.env.WEBHOOK_TOKEN;

    client.webhooks.commandLogs.id = process.env.WEBHOOK_ID;
    client.webhooks.commandLogs.token = process.env.WEBHOOK_TOKEN;

    client.webhooks.consoleLogs.id = process.env.WEBHOOK_ID;
    client.webhooks.consoleLogs.token = process.env.WEBHOOK_TOKEN;

    client.webhooks.warnLogs.id = process.env.WEBHOOK_ID;
    client.webhooks.warnLogs.token = process.env.WEBHOOK_TOKEN;

    client.webhooks.voiceErrorLogs.id = process.env.WEBHOOK_ID;
    client.webhooks.voiceErrorLogs.token = process.env.WEBHOOK_TOKEN;

    client.webhooks.creditLogs.id = process.env.WEBHOOK_ID;
    client.webhooks.creditLogs.token = process.env.WEBHOOK_TOKEN;

    client.webhooks.evalLogs.id = process.env.WEBHOOK_ID;
    client.webhooks.evalLogs.token = process.env.WEBHOOK_TOKEN;

    client.webhooks.interactionLogs.id = process.env.WEBHOOK_ID;
    client.webhooks.interactionLogs.token = process.env.WEBHOOK_TOKEN;
}
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
    console.error('Unhandled promise rejection:', error);
    if (error) if (error.length > 950) error = error.slice(0, 950) + '... view console for details';
    if (error.stack) if (error.stack.length > 950) error.stack = error.stack.slice(0, 950) + '... view console for details';
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
        .setColor(client.config.colors.normal)
    consoleLogs.send({
        username: 'Bot Logs',
        embeds: [embed],
    }).catch(() => {
        console.log(error)
    })
});

process.on('warning', warn => {
    const embed = new Discord.EmbedBuilder()
        .setTitle(`🚨・New warning found`)
        .addFields([
            {
                name: `Warn`,
                value: `\`\`\`${warn}\`\`\``,
            },
        ])
        .setColor(client.config.colors.normal)
    warnLogs.send({
        username: 'Bot Logs',
        embeds: [embed],
    }).catch(() => {

    })
});

client.on('shardError', error => {
    const embed = new Discord.EmbedBuilder()
        .setTitle(`🚨・A websocket connection encountered an error`)
        .addFields([
            {
                name: `Error`,
                value: `\`\`\`${error}\`\`\``,
            },
            {
                name: `Stack error`,
                value: `\`\`\`${error.stack}\`\`\``,
            }
        ])
        .setColor(client.config.colors.normal)
    consoleLogs.send({
        username: 'Bot Logs',
        embeds: [embed],
    });
});

