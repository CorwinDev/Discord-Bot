const fs = require('fs');
const path = require('path');

/**
 * Quét src/events/*.js, mỗi file export { name, once?, execute(...args, client) }.
 */
function loadEvents(client) {
  const eventsPath = path.join(__dirname, '..', 'events');
  const files = fs.readdirSync(eventsPath).filter(f => f.endsWith('.js'));

  for (const file of files) {
    const filePath = path.join(eventsPath, file);
    delete require.cache[require.resolve(filePath)];
    const event = require(filePath);

    if (!event?.name || !event?.execute) {
      console.log(`⚠️  Bỏ qua event ${file}: thiếu "name" hoặc "execute"`);
      continue;
    }

    const listener = (...args) => {
      try {
        Promise.resolve(event.execute(...args, client)).catch((error) => {
          console.error(`❌ Lỗi event ${event.name}:`, error);
        });
      } catch (error) {
        console.error(`❌ Lỗi event ${event.name}:`, error);
      }
    };

    if (event.once) client.once(event.name, listener);
    else client.on(event.name, listener);
  }

  client.on('error', (error) => console.error('❌ Discord client error:', error));

  console.log(`✅ Đã nạp ${files.length} event`);
}

module.exports = loadEvents;
