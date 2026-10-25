const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const config = require('./config/config');
const loadCommands = require('./handlers/loadCommands');
const loadEvents = require('./handlers/loadEvents');

if (!config.token) {
  console.error('❌ Thiếu biến môi trường DISCORD_TOKEN. Hãy đặt biến này ở nơi chạy bot (Secrets/Variables của hosting, Docker -e...). Không cần tạo file .env, xem README.');
  process.exit(78);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction, Partials.GuildMember]
});

client.commands = new Collection();
client.cooldowns = new Collection();

loadCommands(client);
loadEvents(client);

process.on('unhandledRejection', err => {
  console.error('⚠️  Unhandled promise rejection:', err);
});

try {
  require('./monitor').start(client, config.token);
} catch (err) {
  console.error('⚠️  Không bật được phần giám sát, bot chạy ở chế độ thường:', err);
  client.login(config.token);
}