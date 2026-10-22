const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const config = require('./config/config');
const loadCommands = require('./handlers/loadCommands');
const loadEvents = require('./handlers/loadEvents');
const initPlayer = require('./handlers/initPlayer');

if (!config.token) {
  console.error('❌ Thiếu DISCORD_TOKEN trong file .env. Hãy copy .env.example thành .env và điền token bot.');
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessageReactions
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction, Partials.GuildMember]
});

client.commands = new Collection();
client.cooldowns = new Collection();

loadCommands(client);
loadEvents(client);
initPlayer(client);

process.on('unhandledRejection', err => {
  console.error('⚠️  Unhandled promise rejection:', err);
});

client.login(config.token);
