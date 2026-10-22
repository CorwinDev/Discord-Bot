const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { awardAchievement } = require('../../services/gzwCore');
const perm = require('../../services/perm');
const gzw = require('../../config/gzw');
const safety = require('../../database/safety');

module.exports = {
  group: 'GZW CORE (Quản trị)',
  cooldown: 3,
  data: new SlashCommandBuilder()
    .setName('achievement-grant')
    .setDescription('Trao thành tích cho thành viên (giải đấu, vinh danh...)')
    .addUserOption((o) => o.setName('user').setDescription('Thành viên').setRequired(true))
    .addStringOption((o) => o.setName('thanh-tich').setDescription('Thành tích').setRequired(true)
      .addChoices(...gzw.achievements.map((a) => ({ name: a.name, value: a.id })))),

  async execute(interaction) {
    const denied = perm.require(interaction, 'admin');
    if (denied) return interaction.reply({ content: denied, ephemeral: true });
    const user = interaction.options.getUser('user');
    const id = interaction.options.getString('thanh-tich');
    if (user.bot) return interaction.reply({ content: '❌ Không áp dụng cho bot.', ephemeral: true });

    const res = await awardAchievement(interaction.guild, user.id, id, interaction.user.id);
    if (res.granted) safety.audit(interaction.guild.id, interaction.user.id, 'achievement.grant', user.id, id);
    const roleNote = res.roleAssigned
      ? `Đã gán role **${res.def.role}**.`
      : `Chưa gán role — hãy tạo role tên đúng \`${res.def.role}\` trong server (bot cần quyền Manage Roles và role bot phải nằm trên role đó).`;

    const embed = new EmbedBuilder()
      .setColor(gzw.brandColor)
      .setDescription(res.granted
        ? `🏅 ${user} nhận thành tích **${res.def.name}**.\n${roleNote}`
        : `ℹ️ ${user} đã có thành tích **${res.def.name}** từ trước.\n${roleNote}`);
    await interaction.reply({ embeds: [embed], allowedMentions: { users: [user.id] } });
  }
};
