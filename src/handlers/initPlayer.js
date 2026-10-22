const { Player } = require('discord-player');
const { DefaultExtractors } = require('@discord-player/extractor');

/**
 * Khởi tạo discord-player và gắn vào client.player để các lệnh nhạc dùng chung.
 * Lưu ý: chỉ dùng để phát nhạc/âm thanh mà server có quyền sử dụng
 * (nhạc không bản quyền, nhạc tự có bản quyền, radio hợp pháp...).
 * KHÔNG dùng module này để phát phim/video có bản quyền.
 */
async function initPlayer(client) {
  const player = new Player(client);
  await player.extractors.loadMulti(DefaultExtractors);

  player.events.on('playerStart', (queue, track) => {
    queue.metadata?.channel?.send(`▶️ Đang phát: **${track.title}**`).catch(() => {});
  });

  player.events.on('emptyQueue', queue => {
    queue.metadata?.channel?.send('✅ Hàng chờ đã phát hết, bot sẽ rời voice sau ít phút nếu không có bài mới.').catch(() => {});
  });

  player.events.on('error', (queue, error) => {
    console.error('❌ Lỗi player:', error);
    queue.metadata?.channel?.send('❌ Đã xảy ra lỗi khi phát nhạc.').catch(() => {});
  });

  client.player = player;
  console.log('✅ Đã khởi tạo music player');
  return player;
}

module.exports = initPlayer;
