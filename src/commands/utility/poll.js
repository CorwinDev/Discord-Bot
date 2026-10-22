const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../config/config');

const NUMBER_EMOJIS = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

module.exports = {
  group: 'Tiện ích',
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('poll')
    .setDescription('Tạo bình chọn nhanh bằng reaction')
    .addStringOption(opt => opt.setName('question').setDescription('Câu hỏi').setRequired(true))
    .addStringOption(opt => opt.setName('options').setDescription('Các lựa chọn, cách nhau bởi dấu |  (bỏ trống = 👍/👎)')),

  async execute(interaction) {
    const question = interaction.options.getString('question');
    const optionsRaw = interaction.options.getString('options');

    const embed = new EmbedBuilder().setColor(config.colors.primary).setTitle(`📊 ${question}`).setFooter({ text: `Tạo bởi ${interaction.user.tag}` });

    if (!optionsRaw) {
      embed.setDescription('Bình chọn bằng cách react 👍 hoặc 👎');
      await interaction.reply({ embeds: [embed] });
      const msg = await interaction.fetchReply();
      await msg.react('👍');
      await msg.react('👎');
      return;
    }

    const options = optionsRaw.split('|').map(s => s.trim()).filter(Boolean).slice(0, 10);
    if (options.length < 2) {
      return interaction.reply({ content: '❌ Cần ít nhất 2 lựa chọn, cách nhau bởi dấu `|`.', ephemeral: true });
    }

    embed.setDescription(options.map((opt, i) => `${NUMBER_EMOJIS[i]} ${opt}`).join('\n'));
    await interaction.reply({ embeds: [embed] });
    const msg = await interaction.fetchReply();
    for (let i = 0; i < options.length; i++) await msg.react(NUMBER_EMOJIS[i]);
  }
};
