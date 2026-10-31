const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const mgdb = require('../../database/management');
const eco = require('../../database/economy');
const { audit } = require('../../database/safety');
const { getUser } = require('../../database/levels');
const perm = require('../../services/perm');
const { coin } = require('../../services/gzwUi');
const mg = require('../../config/management');

const staffOnly = (i) => (perm.has(i.member, 'mod') || perm.has(i.member, 'support')) ? null : '❌ Lệnh này dành cho nhân sự (mod/support).';

module.exports = {
  group: 'GZW Management',
  cooldown: 3,
  data: new SlashCommandBuilder()
    .setName('member')
    .setDescription('Quản lý hồ sơ thành viên (nhân sự)')
    .setDMPermission(false)
    .addSubcommand((s) => s.setName('info').setDescription('Hồ sơ quản trị của thành viên')
      .addUserOption((o) => o.setName('user').setDescription('Thành viên').setRequired(true)))
    .addSubcommand((s) => s.setName('search').setDescription('Tìm thành viên theo tên')
      .addStringOption((o) => o.setName('ten').setDescription('Tên hoặc một phần tên').setRequired(true).setMinLength(2).setMaxLength(32)))
    .addSubcommand((s) => s.setName('history').setDescription('Lịch sử hoạt động bot + xử lý của thành viên')
      .addUserOption((o) => o.setName('user').setDescription('Thành viên').setRequired(true)))
    .addSubcommand((s) => s.setName('note-add').setDescription('Thêm ghi chú nội bộ (chỉ nhân sự xem)')
      .addUserOption((o) => o.setName('user').setDescription('Thành viên').setRequired(true))
      .addStringOption((o) => o.setName('noi-dung').setDescription('Ghi chú').setRequired(true).setMaxLength(500)))
    .addSubcommand((s) => s.setName('note-list').setDescription('Xem ghi chú nội bộ')
      .addUserOption((o) => o.setName('user').setDescription('Thành viên').setRequired(true))),

  async execute(interaction) {
    const err = staffOnly(interaction);
    if (err) return interaction.reply({ content: err, ephemeral: true });
    const gid = interaction.guild.id;
    const sub = interaction.options.getSubcommand();
    const e = new EmbedBuilder().setColor(0x8b5cf6);

    if (sub === 'search') {
      const found = await interaction.guild.members.search({ query: interaction.options.getString('ten'), limit: 10 }).catch(() => null);
      e.setTitle('🔎 Kết quả tìm kiếm').setDescription(found?.size ? [...found.values()].map((m) => `${m} · \`${m.id}\` · vào <t:${Math.floor(m.joinedTimestamp / 1000)}:d>`).join('\n') : 'Không thấy.');
      return interaction.reply({ embeds: [e], ephemeral: true, allowedMentions: { parse: [] } });
    }

    const user = interaction.options.getUser('user');
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);

    if (sub === 'info') {
      const lv = getUser(gid, user.id);
      const w = eco.getWallet(gid, user.id);
      const staff = member ? [...member.roles.cache.values()].filter((r) => mg.staffRoles[r.name]).map((r) => r.name) : [];
      e.setTitle(`👤 ${user.username}`).setThumbnail(user.displayAvatarURL())
        .addFields(
          { name: 'ID', value: user.id, inline: true },
          { name: 'Tham gia server', value: member ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:D>` : 'Không còn trong server', inline: true },
          { name: 'Tài khoản tạo', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:D>`, inline: true },
          { name: 'Cấp chat', value: String(lv.level), inline: true },
          { name: 'Coin', value: coin(w.balance), inline: true },
          { name: 'Booster', value: `${mgdb.boostCount(gid, user.id)} boost${member?.premiumSince ? ' · đang boost' : ''}`, inline: true },
          { name: 'Cảnh cáo còn hiệu lực', value: String(mgdb.activeWarnCount(gid, user.id)), inline: true },
          { name: 'Vai trò nhân sự', value: staff.join(', ') || '—', inline: true },
          { name: 'Timeout', value: member?.communicationDisabledUntilTimestamp > Date.now() ? `đến <t:${Math.floor(member.communicationDisabledUntilTimestamp / 1000)}:f>` : '—', inline: true }
        );
      return interaction.reply({ embeds: [e], ephemeral: true });
    }

    if (sub === 'history') {
      if (!perm.has(interaction.member, 'mod')) return interaction.reply({ content: '❌ Cần quyền mod để xem lịch sử xử lý.', ephemeral: true });
      const cases = mgdb.userCases(gid, user.id, 8);
      const led = eco.getLedger(gid, user.id, 8);
      const quests = eco.getQuestStatus(gid, user.id).filter((q) => q.completed).length;
      e.setTitle(`📚 Lịch sử — ${user.username}`)
        .addFields(
          { name: 'Case kiểm duyệt', value: cases.length ? cases.map((c) => `#${c.id} ${c.type}${c.revoked ? ' (thu hồi)' : ''} — ${c.reason || '—'}`).join('\n').slice(0, 1000) : 'Không có' },
          { name: 'Giao dịch coin gần đây', value: led.length ? led.map((l) => `${l.amount > 0 ? '+' : ''}${l.amount} · ${l.source}`).join('\n') : 'Không có' },
          { name: 'Nhiệm vụ hoàn thành kỳ này', value: String(quests), inline: true },
          { name: 'Thành tích', value: String(eco.listAchievements(gid, user.id).length), inline: true }
        );
      return interaction.reply({ embeds: [e], ephemeral: true });
    }

    if (!perm.has(interaction.member, 'mod')) return interaction.reply({ content: '❌ Cần quyền mod để dùng ghi chú nội bộ.', ephemeral: true });
    if (sub === 'note-add') {
      const id = mgdb.addNote(gid, user.id, interaction.user.id, interaction.options.getString('noi-dung'));
      audit(gid, interaction.user.id, 'member.note', user.id, `note #${id}`);
      return interaction.reply({ content: `📝 Đã lưu ghi chú #${id}. Thành viên không thấy ghi chú này.`, ephemeral: true });
    }
    if (sub === 'note-list') {
      const notes = mgdb.listNotes(gid, user.id);
      e.setTitle(`📝 Ghi chú nội bộ — ${user.username}`).setDescription(notes.length
        ? notes.map((n) => `**#${n.id}** <t:${Math.floor(n.createdAt / 1000)}:d> <@${n.authorId}>: ${n.note}`).join('\n') : 'Chưa có ghi chú.');
      return interaction.reply({ embeds: [e], ephemeral: true, allowedMentions: { parse: [] } });
    }
  }
};
