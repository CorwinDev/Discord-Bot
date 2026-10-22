const { EmbedBuilder } = require('discord.js');
const guard = require('../services/guard');

const cut = (t) => (t.length > 700 ? `${t.slice(0, 700)}…` : t) || '(không có chữ)';

module.exports = {
  name: 'messageDelete',
  async execute(message) {
    if (!message.guild || message.partial || message.author?.bot) return;
    guard.sendLog(message.guild, new EmbedBuilder().setColor(0x64748b).setTitle('🗑️ Tin nhắn bị xoá')
      .addFields({ name: 'Người gửi', value: `${message.author} (${message.author.id})` }, { name: 'Kênh', value: `${message.channel}` }, { name: 'Nội dung', value: cut(message.content || '') })
      .setTimestamp());
  }
};
