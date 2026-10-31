const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const T = require('../../database/tournaments');
const gzw = require('../../config/gzw');
const ui = require('../../services/tournamentUi');

const eph = (content) => ({ content, ephemeral: true });
const NO_PING = { parse: [] };

function infoEmbed(t) {
  const count = T.getEntrants(t.id).length;
  const embed = new EmbedBuilder()
    .setColor(gzw.brandColor)
    .setTitle(`🏆 #${t.id} · ${t.name}`)
    .setDescription(`${ui.STATUS[t.status]}\n🎮 **${t.game}** · Loại trực tiếp (single elimination)`)
    .addFields(
      { name: 'Thể thức', value: t.teamSize > 1 ? `Đấu đội ${t.teamSize} người` : 'Đấu cá nhân', inline: true },
      { name: 'Đã đăng ký', value: `${count}/${t.maxEntrants}`, inline: true },
      { name: 'Hạn đăng ký', value: ui.ts(t.registerUntil), inline: true },
      ...(t.schedule ? [{ name: 'Lịch thi', value: t.schedule }] : []),
      { name: '📜 Luật', value: t.rules },
      { name: '🎯 Tiêu chí thắng', value: t.winCondition },
      { name: '🎁 Phần thưởng', value: ui.prizeText(t) }
    )
    .setFooter({ text: 'Tiền mặt (nếu có) do ban tổ chức quản lý riêng, không nằm trong ví coin. Coin không dùng để đặt cược.' });
  return embed;
}

module.exports = {
  group: 'GZW Tournament',
  cooldown: 3,
  data: new SlashCommandBuilder()
    .setName('tournament')
    .setDescription('GZW Tournament: giải đấu cộng đồng')
    .setDMPermission(false)
    .addSubcommand((s) => s.setName('list').setDescription('Xem các giải đang mở / đang diễn ra'))
    .addSubcommand((s) => s.setName('info').setDescription('Xem luật, thể thức và phần thưởng')
      .addIntegerOption((o) => o.setName('id').setDescription('ID giải').setRequired(true).setMinValue(1)))
    .addSubcommand((s) => s.setName('register').setDescription('Đăng ký tham gia (bạn là đội trưởng)')
      .addIntegerOption((o) => o.setName('id').setDescription('ID giải').setRequired(true).setMinValue(1))
      .addStringOption((o) => o.setName('ten-doi').setDescription('Tên đội (bỏ trống nếu đấu cá nhân)').setMaxLength(32))
      .addUserOption((o) => o.setName('thanh-vien-2').setDescription('Thành viên thứ 2'))
      .addUserOption((o) => o.setName('thanh-vien-3').setDescription('Thành viên thứ 3'))
      .addUserOption((o) => o.setName('thanh-vien-4').setDescription('Thành viên thứ 4'))
      .addUserOption((o) => o.setName('thanh-vien-5').setDescription('Thành viên thứ 5')))
    .addSubcommand((s) => s.setName('withdraw').setDescription('Rút đăng ký (đội trưởng, khi giải còn mở đăng ký)')
      .addIntegerOption((o) => o.setName('id').setDescription('ID giải').setRequired(true).setMinValue(1)))
    .addSubcommand((s) => s.setName('bracket').setDescription('Xem nhánh đấu')
      .addIntegerOption((o) => o.setName('id').setDescription('ID giải').setRequired(true).setMinValue(1)))
    .addSubcommand((s) => s.setName('result').setDescription('Đội trưởng gửi kết quả trận kèm bằng chứng')
      .addIntegerOption((o) => o.setName('tran').setDescription('Mã trận (số sau dấu # trong nhánh đấu)').setRequired(true).setMinValue(1))
      .addIntegerOption((o) => o.setName('diem-doi-a').setDescription('Điểm của đội A (đội ghi trước trong nhánh đấu)').setRequired(true).setMinValue(0).setMaxValue(999))
      .addIntegerOption((o) => o.setName('diem-doi-b').setDescription('Điểm của đội B (đội ghi sau trong nhánh đấu)').setRequired(true).setMinValue(0).setMaxValue(999))
      .addAttachmentOption((o) => o.setName('bang-chung').setDescription('Ảnh chụp màn hình kết quả trận').setRequired(true))
      .addStringOption((o) => o.setName('ghi-chu').setDescription('Ghi chú thêm').setMaxLength(200)))
    .addSubcommand((s) => s.setName('dispute').setDescription('Khiếu nại kết quả đối thủ đã gửi (đội trưởng bên còn lại)')
      .addIntegerOption((o) => o.setName('tran').setDescription('Mã trận').setRequired(true).setMinValue(1))
      .addStringOption((o) => o.setName('ly-do').setDescription('Lý do khiếu nại').setRequired(true).setMaxLength(300)))
    .addSubcommand((s) => s.setName('leaderboard').setDescription('Bảng xếp hạng của một giải, hoặc bảng vinh danh toàn server')
      .addIntegerOption((o) => o.setName('id').setDescription('ID giải (bỏ trống = vinh danh toàn server)').setMinValue(1)))
    .addSubcommand((s) => s.setName('history').setDescription('Xem các giải đã kết thúc')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const gid = interaction.guild.id, uid = interaction.user.id;

    if (sub === 'list') {
      const rows = T.listActive(gid);
      if (!rows.length) return interaction.reply(eph('Hiện chưa có giải nào đang mở.'));
      const embed = new EmbedBuilder().setColor(gzw.brandColor).setTitle('🏆 Giải đấu GZW')
        .setDescription(rows.map((t) => `**#${t.id}** · ${t.name} · 🎮 ${t.game}\n${ui.STATUS[t.status]} · ${T.getEntrants(t.id).length}/${t.maxEntrants} · hạn ĐK ${ui.ts(t.registerUntil)}`).join('\n\n'))
        .setFooter({ text: 'Dùng /tournament info id:<số> để xem luật và phần thưởng' });
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (sub === 'info' || sub === 'bracket') {
      const t = T.getTournament(gid, interaction.options.getInteger('id'));
      if (!t || t.status === 'DRAFT') return interaction.reply(eph('❌ Không tìm thấy giải này.'));
      if (sub === 'info') return interaction.reply({ embeds: [infoEmbed(t)], allowedMentions: NO_PING });
      if (!['RUNNING', 'FINISHED'].includes(t.status) && !T.getMatches(t.id).length) {
        return interaction.reply(eph('Giải chưa bắt đầu nên chưa có nhánh đấu.'));
      }
      const embed = new EmbedBuilder().setColor(gzw.brandColor).setTitle(`🗺️ Nhánh đấu · ${t.name}`)
        .addFields(ui.bracketFields(t.id))
        .setFooter({ text: '🕹️ chờ đấu · 📨 chờ duyệt · ⚠️ đang khiếu nại · ✅ đã xong' });
      return interaction.reply({ embeds: [embed], allowedMentions: NO_PING });
    }

    if (sub === 'register') {
      const id = interaction.options.getInteger('id');
      const t = T.getTournament(gid, id);
      if (!t || t.status === 'DRAFT') return interaction.reply(eph('❌ Không tìm thấy giải này.'));

      const extra = [2, 3, 4, 5].map((n) => interaction.options.getUser(`thanh-vien-${n}`)).filter(Boolean);
      if (extra.some((u) => u.bot)) return interaction.reply(eph('❌ Không thể thêm bot vào đội.'));
      let name = interaction.options.getString('ten-doi')?.trim();
      if (!name) {
        if (t.teamSize > 1) return interaction.reply(eph('❌ Giải đấu đội cần nhập `ten-doi`.'));
        name = interaction.member?.displayName?.slice(0, 32) || interaction.user.username;
      }
      const res = T.register(gid, id, uid, name, [uid, ...extra.map((u) => u.id)]);
      if (!res.ok) {
        const msg = {
          notfound: '❌ Không tìm thấy giải.',
          closed: '❌ Giải không còn mở đăng ký.',
          deadline: '❌ Đã quá hạn đăng ký.',
          dupe: '❌ Một thành viên bị chọn hai lần.',
          size: `❌ Giải này cần đúng **${t?.teamSize}** người mỗi đội (bạn + ${t?.teamSize - 1} thành viên).`,
          full: '❌ Giải đã đủ số đội.',
          already: `❌ <@${res.userId}> đã đăng ký trong giải này rồi.`,
          name: '❌ Tên đội đã có người dùng, hãy chọn tên khác.'
        }[res.reason];
        return interaction.reply({ content: msg, ephemeral: true, allowedMentions: NO_PING });
      }
      return interaction.reply({
        content: `✅ **${name}** đã đăng ký giải **${t.name}** (${res.count}/${t.maxEntrants}).${t.teamSize > 1 ? `\nThành viên: ${ui.mentions([uid, ...extra.map((u) => u.id)])}` : ''}`,
        allowedMentions: { users: [uid, ...extra.map((u) => u.id)] }
      });
    }

    if (sub === 'withdraw') {
      const res = T.withdraw(gid, interaction.options.getInteger('id'), uid);
      const msg = res.ok ? `✅ Đã rút đăng ký **${res.entrant.name}**.`
        : { notfound: '❌ Không tìm thấy giải.', closed: '❌ Chỉ rút được khi giải còn mở đăng ký.', notregistered: '❌ Bạn chưa đăng ký giải này.', notcaptain: '❌ Chỉ đội trưởng mới được rút đăng ký.' }[res.reason];
      return interaction.reply(eph(msg));
    }

    if (sub === 'result') {
      const att = interaction.options.getAttachment('bang-chung');
      if (!att.contentType?.startsWith('image/')) return interaction.reply(eph('❌ Bằng chứng phải là ảnh chụp màn hình.'));
      const res = T.reportResult(gid, interaction.options.getInteger('tran'), uid,
        interaction.options.getInteger('diem-doi-a'), interaction.options.getInteger('diem-doi-b'), att.url, interaction.options.getString('ghi-chu'));
      if (!res.ok) {
        return interaction.reply(eph({
          notfound: '❌ Không thấy trận này.',
          notrunning: '❌ Giải không còn diễn ra.',
          state: '❌ Trận này không ở trạng thái chờ gửi kết quả (đã gửi, đang khiếu nại hoặc đã xong).',
          notcaptain: '❌ Chỉ đội trưởng của một trong hai đội mới được gửi kết quả.',
          score: '❌ Điểm không hợp lệ (không được hoà trong thể thức loại trực tiếp).'
        }[res.reason]));
      }
      const [a, b] = [T.getEntrant(res.m.entrantA), T.getEntrant(res.m.entrantB)];
      const opponentCaptain = res.m.entrantA && (a.captainId === uid ? b.captainId : a.captainId);
      const embed = new EmbedBuilder().setColor(gzw.brandColor)
        .setTitle(`📨 Kết quả trận #${res.m.id} · chờ ban tổ chức duyệt`)
        .setDescription(`**${a.name}** ${res.m.scoreA}–${res.m.scoreB} **${b.name}**`)
        .setImage(att.url)
        .setFooter({ text: 'Đội còn lại có thể dùng /tournament dispute nếu không đồng ý.' });
      await interaction.reply({ content: `<@${opponentCaptain}>, hãy kiểm tra kết quả này.`, embeds: [embed], allowedMentions: { users: [opponentCaptain] } });
      ui.notifyStaff(interaction.guild, `🔎 Trận #${res.m.id} (giải #${res.t.id}) có kết quả chờ duyệt: \`/gzw-admin tournament approve tran:${res.m.id}\``);
      return;
    }

    if (sub === 'dispute') {
      const res = T.disputeResult(gid, interaction.options.getInteger('tran'), uid, interaction.options.getString('ly-do'));
      if (!res.ok) {
        return interaction.reply(eph({
          notfound: '❌ Không thấy trận này.',
          state: '❌ Chỉ khiếu nại được khi kết quả đã gửi và đang chờ duyệt.',
          notcaptain: '❌ Chỉ đội trưởng của một trong hai đội mới được khiếu nại.',
          own: '❌ Bạn là người đã gửi kết quả này.'
        }[res.reason]));
      }
      ui.notifyStaff(interaction.guild, `⚠️ Khiếu nại trận #${res.m.id} (giải #${res.t.id}) từ <@${uid}>. Xem \`/gzw-admin tournament pending\`.`);
      return interaction.reply(`⚠️ Đã ghi nhận khiếu nại trận **#${res.m.id}**. Ban tổ chức sẽ xem xét bằng chứng của hai bên.`);
    }

    if (sub === 'leaderboard') {
      const id = interaction.options.getInteger('id');
      if (!id) {
        const rows = T.globalLeaderboard(gid);
        if (!rows.length) return interaction.reply(eph('Chưa có giải nào kết thúc.'));
        const embed = new EmbedBuilder().setColor(gzw.brandColor).setTitle('🏅 Vinh danh GZW Tournament')
          .setDescription(rows.map((r, i) => `**${i + 1}.** <@${r.userId}> — 🥇 ${r.golds} · 🥈 ${r.silvers} · 🥉 ${r.bronzes}`).join('\n'));
        return interaction.reply({ embeds: [embed], allowedMentions: NO_PING });
      }
      const t = T.getTournament(gid, id);
      if (!t || t.status === 'DRAFT') return interaction.reply(eph('❌ Không tìm thấy giải này.'));
      const rows = T.standings(id);
      if (!rows.length) return interaction.reply(eph('Chưa có đội nào đăng ký.'));
      const embed = new EmbedBuilder().setColor(gzw.brandColor).setTitle(`📊 Bảng xếp hạng · ${t.name}`)
        .setDescription(rows.slice(0, 25).map((r, i) => `${r.placement ? ui.PLACE[r.placement].split(' ')[0] : `**${i + 1}.**`} **${r.name}** — ${r.wins} trận thắng`).join('\n'));
      return interaction.reply({ embeds: [embed], allowedMentions: NO_PING });
    }

    if (sub === 'history') {
      const rows = T.listHistory(gid);
      if (!rows.length) return interaction.reply(eph('Chưa có giải nào kết thúc.'));
      const embed = new EmbedBuilder().setColor(gzw.brandColor).setTitle('📚 Lịch sử giải đấu')
        .setDescription(rows.map((t) => `**#${t.id}** · ${t.name} · ${t.game}\n${t.status === 'FINISHED' ? `🏆 Vô địch: **${t.championName}**` : '⛔ Đã huỷ'} · ${ui.ts(t.finishedAt)}`).join('\n\n'));
      return interaction.reply({ embeds: [embed] });
    }
  }
};
