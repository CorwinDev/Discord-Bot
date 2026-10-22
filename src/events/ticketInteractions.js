const {
  EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ChannelType, PermissionFlagsBits
} = require('discord.js');
const config = require('../config/config');
const mg = require('../config/management');
const mgdb = require('../database/management');
const perm = require('../services/perm');
const { logToStaff } = require('../services/modTools');

const staffRoleIds = (guild) => guild.roles.cache
  .filter((r) => mg.staffRoles[r.name] && (mg.staffRoles[r.name].caps.includes('support') || mg.staffRoles[r.name].caps.includes('mod')))
  .map((r) => r.id);
const isStaff = (member) => perm.has(member, 'support') || perm.has(member, 'mod');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    try {
      /* --- Bước 1: bấm "Tạo ticket" -> chọn loại --- */
      if (interaction.isButton() && interaction.customId === 'ticket_open') {
        const gid = interaction.guild.id;
        const open = mgdb.openTicketOf(gid, interaction.user.id);
        if (open) {
          const ch = interaction.guild.channels.cache.get(open.channelId);
          if (ch) return interaction.reply({ content: `❌ Bạn đã có ticket đang mở: ${ch}`, ephemeral: true });
          mgdb.closeTicket(open.id, interaction.client.user.id); // kênh đã bị xoá thủ công -> dọn bản ghi
        }
        const menu = new StringSelectMenuBuilder().setCustomId('ticket_category').setPlaceholder('Chọn loại yêu cầu')
          .addOptions(mg.ticketCategories.map((c) => ({ label: c.label, value: c.id, emoji: c.emoji })));
        return interaction.reply({ content: 'Bạn cần hỗ trợ về vấn đề gì?', components: [new ActionRowBuilder().addComponents(menu)], ephemeral: true });
      }

      /* --- Bước 2: tạo kênh riêng --- */
      if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_category') {
        const guild = interaction.guild, gid = guild.id;
        const cat = mg.ticketCategories.find((c) => c.id === interaction.values[0]);
        if (!cat) return interaction.update({ content: '❌ Loại không hợp lệ.', components: [] });
        if (mgdb.openTicketOf(gid, interaction.user.id)) return interaction.update({ content: '❌ Bạn đã có ticket đang mở.', components: [] });

        const overwrites = [
          { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
          { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
          { id: interaction.client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels] },
          ...staffRoleIds(guild).map((id) => ({ id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] }))
        ];
        const parent = guild.channels.cache.find((c) => c.type === ChannelType.GuildCategory && c.name === mg.ticketCategoryName);
        const channel = await guild.channels.create({
          name: `${cat.id}-${interaction.user.username}`.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 50) || `ticket-${interaction.user.id}`,
          type: ChannelType.GuildText, parent: parent?.id, permissionOverwrites: overwrites, topic: `Ticket ${cat.label} · ${interaction.user.id}`
        });
        const id = mgdb.createTicket(guild.id, interaction.user.id, cat.id, channel.id);

        const embed = new EmbedBuilder().setColor(config.colors.primary).setTitle(`${cat.emoji} Ticket #${id} — ${cat.label}`)
          .setDescription(`Xin chào ${interaction.user}, hãy mô tả vấn đề của bạn. Nhân sự sẽ phản hồi sớm.\nChỉ chia sẻ thông tin cần thiết; ticket là kênh riêng tư.`);
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('ticket_claim').setLabel('Nhận ticket').setEmoji('🙋').setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId('ticket_close').setLabel('Đóng ticket').setEmoji('🔒').setStyle(ButtonStyle.Danger)
        );
        await channel.send({ content: `${interaction.user}`, embeds: [embed], components: [row] });
        logToStaff(guild, { content: `🎫 Ticket #${id} (${cat.label}) mở bởi <@${interaction.user.id}>: ${channel}` });
        return interaction.update({ content: `✅ Đã tạo ticket: ${channel}`, components: [] });
      }

      /* --- Nhận ticket --- */
      if (interaction.isButton() && interaction.customId === 'ticket_claim') {
        const t = mgdb.ticketByChannel(interaction.channel.id);
        if (!t || t.status !== 'open') return interaction.reply({ content: '❌ Không tìm thấy ticket đang mở.', ephemeral: true });
        if (!isStaff(interaction.member)) return interaction.reply({ content: '❌ Chỉ nhân sự hỗ trợ được nhận ticket.', ephemeral: true });
        if (t.userId === interaction.user.id) return interaction.reply({ content: '❌ Bạn không thể tự nhận ticket của chính mình.', ephemeral: true });
        if (!mgdb.claimTicket(t.id, interaction.user.id)) return interaction.reply({ content: 'ℹ️ Ticket đã có người nhận.', ephemeral: true });
        return interaction.reply({ content: `🙋 ${interaction.user} đã nhận ticket này.`, allowedMentions: { parse: [] } });
      }

      /* --- Đóng ticket (chủ ticket hoặc nhân sự) --- */
      if (interaction.isButton() && interaction.customId === 'ticket_close') {
        const t = mgdb.ticketByChannel(interaction.channel.id);
        if (!t) return interaction.reply({ content: '❌ Đây không phải kênh ticket.', ephemeral: true });
        if (t.userId !== interaction.user.id && !isStaff(interaction.member)) return interaction.reply({ content: '❌ Bạn không có quyền đóng ticket này.', ephemeral: true });
        if (!mgdb.closeTicket(t.id, interaction.user.id)) return interaction.reply({ content: 'ℹ️ Ticket đã đóng.', ephemeral: true });
        await interaction.reply('🔒 Ticket đã đóng, kênh sẽ bị xoá sau 5 giây. (Chỉ lưu thông tin ticket, không lưu nội dung chat.)');
        logToStaff(interaction.guild, { content: `🔒 Ticket #${t.id} (${t.category}) đóng bởi <@${interaction.user.id}>${t.claimedBy ? ` · nhận bởi <@${t.claimedBy}>` : ''}.` });
        setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
      }
    } catch (err) {
      console.error('⚠️  Lỗi ticket:', err);
      if (!interaction.replied && !interaction.deferred) interaction.reply({ content: '❌ Có lỗi xảy ra khi xử lý ticket.', ephemeral: true }).catch(() => {});
    }
  }
};
