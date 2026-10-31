const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const gzw = require('../../config/gzw');

const HOWLS = [
  'Đàn sói mạnh nhờ từng con sói biết giữ nhịp cho cả bầy.',
  'Đêm nay trăng sáng, hợp để bắt đầu việc bạn đã trì hoãn.',
  'Săn mồi không cần vội, cần đúng hướng gió.',
  'Một tiếng tru đủ gọi cả bầy, hãy rủ ai đó cùng chơi.',
  'Sói đơn độc đi nhanh, nhưng cả bầy đi xa.',
  'Hôm nay hãy giúp một thành viên mới; mai họ sẽ giúp lại bạn.',
  'Dấu chân nhỏ hôm nay là con đường lớn ngày mai.'
];

module.exports = {
  group: 'Giải trí',
  cooldown: 5,
  data: new SlashCommandBuilder().setName('howl').setDescription('Nghe một tiếng tru của bầy sói GZW'),
  async execute(interaction) {
    await interaction.reply({
      embeds: [new EmbedBuilder().setColor(gzw.brandColor).setTitle('🐺 Tiếng tru của bầy').setDescription(HOWLS[Math.floor(Math.random() * HOWLS.length)])]
    });
  }
};
