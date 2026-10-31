const env = require('./config/env');

/**
 * Chạy dưới supervisor theo mặc định: nếu tiến trình bot sập (lỗi nghiêm trọng, hết RAM, bị kill...),
 * supervisor tự bật lại và báo lên webhook. Tắt bằng AUTO_SUPERVISE=false (khi đã có Docker restart / PM2).
 * Supervisor sẽ chạy lại chính file này với biến SUPERVISOR_RESTARTS, lúc đó mới vào phần bot thật.
 * Bỏ qua khi dùng `node --watch` (npm run dev) hoặc khi file này được require từ nơi khác.
 */
const supervised = process.env.SUPERVISOR_RESTARTS !== undefined;
const watching = process.execArgv.some((arg) => arg.startsWith('--watch'));

if (require.main === module && env.AUTO_SUPERVISE && !supervised && !watching) {
  require('./supervisor');
} else {
  main();
}

function main() {
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

  (async () => {
    try {
      await require('./monitor').start(client, config.token);
    } catch (err) {
      console.error('⚠️  Không bật được phần giám sát, bot chạy ở chế độ thường:', err);
      if (!client.isReady() && !client.ws.shards.size) client.login(config.token);
    }
  })();
}