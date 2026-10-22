const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const gzw = require('../../config/gzw');

const ANSWERS = [
  'Chắc chắn rồi.', 'Có vẻ ổn đấy.', 'Mọi dấu hiệu đều nói là có.', 'Cứ làm đi, đừng ngần ngại.',
  'Hỏi lại sau nhé, sói chưa nghe rõ.', 'Chưa thể nói trước được.', 'Thử tập trung rồi hỏi lại.',
  'Đừng đặt nhiều hy vọng.', 'Câu trả lời là không.', 'Khá đáng ngờ.', 'Nên cân nhắc lại.'
];

module.exports = {
  group: 'Giải trí',
  cooldown: 3,
  data: new SlashCommandBuilder().setName('8ball').setDescription('Hỏi quả cầu tiên tri một câu có/không')
    .addStringOption((o) => o.setName('cau-hoi').setDescription('Câu hỏi của bạn').setRequired(true).setMaxLength(200)),
  async execute(interaction) {
    const q = interaction.options.getString('cau-hoi');
    const a = ANSWERS[Math.floor(Math.random() * ANSWERS.length)];
    await interaction.reply({
      embeds: [new EmbedBuilder().setColor(gzw.brandColor).setTitle('🎱 Quả cầu tiên tri').addFields({ name: 'Câu hỏi', value: q }, { name: 'Trả lời', value: a })],
      allowedMentions: { parse: [] }
    });
  }
};
