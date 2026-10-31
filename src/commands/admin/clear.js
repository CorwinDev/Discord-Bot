const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  group: 'Quản trị',
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Xoá hàng loạt tin nhắn trong kênh')
    .addIntegerOption(opt => opt.setName('amount').setDescription('Số lượng tin nhắn cần xoá (1-100)').setRequired(true).setMinValue(1).setMaxValue(100))
    .addUserOption(opt => opt.setName('user').setDescription('Chỉ xoá tin nhắn của user này (tuỳ chọn)'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .setDMPermission(false),

  async execute(interaction) {
    const amount = interaction.options.getInteger('amount');
    const user = interaction.options.getUser('user');

    await interaction.deferReply({ ephemeral: true });

    const messages = await interaction.channel.messages.fetch({ limit: amount });
    const filtered = user ? messages.filter(m => m.author.id === user.id) : messages;

    const deleted = await interaction.channel.bulkDelete(filtered, true).catch(() => null);

    if (!deleted) {
      return interaction.editReply('❌ Không thể xoá (tin nhắn có thể cũ hơn 14 ngày).');
    }

    await interaction.editReply(`🧹 Đã xoá ${deleted.size} tin nhắn${user ? ` của ${user.tag}` : ''}.`);
  }
};
