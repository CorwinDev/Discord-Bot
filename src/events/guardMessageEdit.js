const { EmbedBuilder } = require('discord.js');
const guard = require('../services/guard');

const cut = (t) => (t.length > 500 ? `${t.slice(0, 500)}…` : t) || '(trống)';

module.exports = {
  name: 'messageUpdate',
  async execute(oldMsg, newMsg) {
    if (!newMsg.guild || oldMsg.partial || newMsg.author?.bot || oldMsg.content === newMsg.content) return;
    guard.sendLog(newMsg.guild, new EmbedBuilder().setColor(0x64748b).setTitle('✏️ Tin nhắn được sửa')
      .addFields({ name: 'Người gửi', value: `${newMsg.author} (${newMsg.author.id})` }, { name: 'Kênh', value: `${newMsg.channel}` },
        { name: 'Trước', value: cut(oldMsg.content || '') }, { name: 'Sau', value: cut(newMsg.content || '') })
      .setTimestamp());
  }
};
