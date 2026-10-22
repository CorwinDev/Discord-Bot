const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const T = require('../../database/tournaments');
const db = require('../../database/db');
const gzw = require('../../config/gzw');
const { fmt, coin } = require('../../services/gzwUi');
const { awardAchievement } = require('../../services/gzwCore');
const ui = require('../../services/tournamentUi');
const safety = require('../../database/safety');

const moduleChoices = gzw.modules.map((m) => ({ name: m, value: m }));

const cfg = gzw.tournament;
const approvers = (process.env.CASH_PRIZE_APPROVER_IDS || '').split(',').map((s) => s.trim()).filter(Boolean);
const eph = (content) => ({ content, ephemeral: true, allowedMentions: { parse: [] } });
const idOpt = (o, name = 'id', desc = 'ID giải') => o.setName(name).setDescription(desc).setRequired(true).setMinValue(1);

const ERR = {
  notfound: '❌ Không tìm thấy.', status: '❌ Trạng thái giải hiện tại không cho phép thao tác này.',
  deadline: '❌ Hạn đăng ký đã qua, hãy tạo giải mới với hạn đăng ký sau hiện tại.',
  few: '❌ Cần ít nhất 2 đội/người đăng ký để bắt đầu.',
  state: '❌ Trận không ở trạng thái phù hợp.',
  conflict: '❌ Bạn thuộc một trong các đội liên quan nên không thể duyệt (tránh xung đột lợi ích).',
  winner: '❌ Đội thắng phải là một trong hai đội của trận.',
  paid: '❌ Khoản này đã thanh toán, không thể huỷ.',
  order: '❌ Sai thứ tự bước (budget → recipient → paid).',
  notfinished: '❌ Giải chưa kết thúc nên chưa xác định người nhận.',
  norecipient: '❌ Không có đội nào đạt hạng này.',
  step: '❌ Bước không hợp lệ.'
};

/** Đăng thông báo kết quả khi giải kết thúc + trao danh hiệu vô địch. */
async function announceFinish(interaction, t, fin) {
  for (const uid of fin.champion.members) {
    await awardAchievement(interaction.guild, uid, cfg.championAchievementId, interaction.user.id).catch(() => {});
  }
  const lines = [`🥇 **${fin.champion.name}** (${ui.mentions(fin.champion.members)})`, `🥈 **${fin.runnerUp.name}**`];
  const embed = new EmbedBuilder().setColor(gzw.brandColor).setTitle(`🏁 Kết thúc giải · ${t.name}`)
    .setDescription(lines.join('\n'))
    .addFields({
      name: 'GZW Coin đã trao',
      value: fin.payouts.length ? fin.payouts.map((p) => `${ui.PLACE[p.placement].split(' ')[0]} <@${p.userId}> +${coin(p.coins)}`).join('\n') : 'Giải này không có coin thưởng.'
    }, { name: 'Tiền mặt', value: 'Nếu có, ban tổ chức xác nhận và thanh toán riêng (không qua bot).' });
  await interaction.followUp({ embeds: [embed], allowedMentions: { users: fin.champion.members } });
}

module.exports = {
  group: 'GZW (Quản trị)',
  cooldown: 2,
  data: new SlashCommandBuilder()
    .setName('gzw-admin')
    .setDescription('Quản trị GZW: giải đấu, kinh tế, nhật ký, tạm dừng module')
    .setDMPermission(false)
    .addSubcommand((s) => s.setName('economy').setDescription('Thống kê coin phát ra / tiêu đi')
      .addIntegerOption((o) => o.setName('so-ngay').setDescription('Số ngày (mặc định 7)').setMinValue(1).setMaxValue(90)))
    .addSubcommand((s) => s.setName('audit').setDescription('Xem nhật ký thao tác quản trị gần đây')
      .addIntegerOption((o) => o.setName('so-dong').setDescription('Số dòng (mặc định 10)').setMinValue(1).setMaxValue(25)))
    .addSubcommand((s) => s.setName('pause').setDescription('Tạm dừng một module khi có sự cố')
      .addStringOption((o) => o.setName('module').setDescription('Module').setRequired(true).addChoices(...moduleChoices))
      .addStringOption((o) => o.setName('ly-do').setDescription('Lý do (bắt buộc)').setRequired(true).setMaxLength(100)))
    .addSubcommand((s) => s.setName('resume').setDescription('Bật lại module đã tạm dừng')
      .addStringOption((o) => o.setName('module').setDescription('Module').setRequired(true).addChoices(...moduleChoices)))
    .addSubcommand((s) => s.setName('status').setDescription('Xem module nào đang bị tạm dừng'))
    .addSubcommandGroup((g) => g.setName('tournament').setDescription('Quản lý giải đấu, duyệt kết quả và phần thưởng')
      .addSubcommand((s) => s.setName('create').setDescription('Tạo giải (trạng thái nháp)')
        .addStringOption((o) => o.setName('ten').setDescription('Tên giải').setRequired(true).setMaxLength(60))
        .addStringOption((o) => o.setName('game').setDescription('Game thi đấu').setRequired(true).setMaxLength(40))
        .addIntegerOption((o) => o.setName('so-doi-toi-da').setDescription('Số đội/người tối đa').setRequired(true).setMinValue(2).setMaxValue(cfg.maxEntrantsLimit))
        .addStringOption((o) => o.setName('han-dang-ky').setDescription('Hạn đăng ký, dạng 2026-11-01 20:00 (giờ UTC+7)').setRequired(true))
        .addStringOption((o) => o.setName('luat').setDescription('Luật thi đấu').setRequired(true).setMaxLength(900))
        .addStringOption((o) => o.setName('tieu-chi-thang').setDescription('Tiêu chí thắng và cơ cấu giải').setRequired(true).setMaxLength(400))
        .addIntegerOption((o) => o.setName('kich-thuoc-doi').setDescription('Số người mỗi đội (mặc định 1 = cá nhân)').setMinValue(1).setMaxValue(cfg.maxTeamSize))
        .addStringOption((o) => o.setName('lich-thi').setDescription('Lịch thi đấu (văn bản)').setMaxLength(300))
        .addStringOption((o) => o.setName('thuong-coin').setDescription('Coin MỖI THÀNH VIÊN theo hạng, vd 1:5000,2:2000,3:1000').setMaxLength(100)))
      .addSubcommand((s) => s.setName('open').setDescription('Công bố giải và mở đăng ký').addIntegerOption((o) => idOpt(o)))
      .addSubcommand((s) => s.setName('start').setDescription('Đóng đăng ký, bốc thăm và tạo nhánh đấu').addIntegerOption((o) => idOpt(o)))
      .addSubcommand((s) => s.setName('pending').setDescription('Kết quả đang chờ duyệt / khiếu nại'))
      .addSubcommand((s) => s.setName('approve').setDescription('Duyệt kết quả trận (cộng coin tự động khi là chung kết)').addIntegerOption((o) => idOpt(o, 'tran', 'Mã trận')))
      .addSubcommand((s) => s.setName('reject').setDescription('Từ chối kết quả, cho gửi lại')
        .addIntegerOption((o) => idOpt(o, 'tran', 'Mã trận'))
        .addStringOption((o) => o.setName('ly-do').setDescription('Lý do').setRequired(true).setMaxLength(200)))
      .addSubcommand((s) => s.setName('set-result').setDescription('Ban tổ chức tự quyết kết quả (giải quyết tranh chấp)')
        .addIntegerOption((o) => idOpt(o, 'tran', 'Mã trận'))
        .addIntegerOption((o) => idOpt(o, 'doi-thang', 'ID đội thắng (xem /gzw-admin tournament info)'))
        .addStringOption((o) => o.setName('ly-do').setDescription('Lý do quyết định').setRequired(true).setMaxLength(200))
        .addIntegerOption((o) => o.setName('diem-a').setDescription('Điểm đội A').setMinValue(0).setMaxValue(999))
        .addIntegerOption((o) => o.setName('diem-b').setDescription('Điểm đội B').setMinValue(0).setMaxValue(999)))
      .addSubcommand((s) => s.setName('cancel').setDescription('Huỷ giải')
        .addIntegerOption((o) => idOpt(o))
        .addStringOption((o) => o.setName('ly-do').setDescription('Lý do').setRequired(true).setMaxLength(200)))
      .addSubcommand((s) => s.setName('info').setDescription('Xem chi tiết quản trị (kể cả giải nháp)').addIntegerOption((o) => idOpt(o)))
      .addSubcommand((s) => s.setName('audit').setDescription('Nhật ký thao tác của giải').addIntegerOption((o) => idOpt(o)))
      .addSubcommand((s) => s.setName('cash-add').setDescription('Ghi nhận giải thưởng TIỀN MẶT (bot không chuyển tiền)')
        .addIntegerOption((o) => idOpt(o))
        .addIntegerOption((o) => o.setName('hang').setDescription('Hạng 1-3').setRequired(true).setMinValue(1).setMaxValue(3))
        .addIntegerOption((o) => o.setName('so-tien-vnd').setDescription('Số tiền (VNĐ)').setRequired(true).setMinValue(1000))
        .addStringOption((o) => o.setName('mo-ta').setDescription('Ghi chú (nhà tài trợ, hình thức trả...)').setMaxLength(100)))
      .addSubcommand((s) => s.setName('cash-status').setDescription('Cập nhật trạng thái tiền mặt')
        .addIntegerOption((o) => idOpt(o, 'khoan', 'ID khoản tiền mặt'))
        .addStringOption((o) => o.setName('buoc').setDescription('Bước xử lý').setRequired(true).addChoices(
          { name: '1. Xác nhận ngân sách', value: 'budget' },
          { name: '2. Xác nhận người nhận đủ điều kiện (sau khi giải kết thúc)', value: 'recipient' },
          { name: '3. Đã thanh toán (người lớn phụ trách đã chuyển ngoài bot)', value: 'paid' },
          { name: 'Huỷ khoản này', value: 'cancel' }))
        .addStringOption((o) => o.setName('ghi-chu').setDescription('Mã/ghi chú xác nhận (không nhập số tài khoản)').setMaxLength(100)))),

  async execute(interaction) {
    const perm = require('../../services/perm');
    const grp = interaction.options.getSubcommandGroup(false);
    const top = grp ? null : interaction.options.getSubcommand();
    // Xem số liệu/nhật ký: audit hoặc economy · tạm dừng module: economy · giải đấu (có tiền thưởng thật): admin
    const okCap = grp ? perm.has(interaction.member, 'admin')
      : top === 'economy' || top === 'audit' || top === 'status' ? perm.anyOf(interaction.member, 'audit', 'economy', 'admin')
      : perm.anyOf(interaction.member, 'economy', 'admin');
    if (!okCap) return interaction.reply(eph('❌ Bạn cần vai trò nhân sự phù hợp (audit/economy/admin) cho thao tác này.'));
        // --- Lệnh cấp cao nhất (không thuộc nhóm tournament): kinh tế / nhật ký / tạm dừng module ---
    if (!interaction.options.getSubcommandGroup(false)) {
      const gid0 = interaction.guild.id;
      const top = interaction.options.getSubcommand();
      const embed = new EmbedBuilder().setColor(gzw.brandColor);
      if (top === 'economy') {
        const days = interaction.options.getInteger('so-ngay') ?? 7;
        const st = safety.economyStats(gid0, days);
        const lines = st.bySource.map((r) => `\`${r.source}\` · +${fmt(r.earned)} / −${fmt(r.spent)} (${r.n} lần)`);
        embed.setTitle(`📈 Kinh tế ${days} ngày qua`)
          .setDescription(lines.length ? lines.join('\n') : 'Chưa có giao dịch.')
          .addFields({ name: 'Tổng coin đang lưu hành', value: `${fmt(st.supply.total)} ${gzw.currency.emoji} · ${fmt(st.supply.wallets)} ví` });
      } else if (top === 'audit') {
        const rows = safety.recentAudit(gid0, interaction.options.getInteger('so-dong') ?? 10);
        embed.setTitle('🧾 Audit log').setDescription(rows.length
          ? rows.map((r) => `<t:${Math.floor(r.createdAt / 1000)}:d> <@${r.actorId}> · \`${r.action}\`${r.targetId ? ` → ${/^\d+$/.test(r.targetId) ? `<@${r.targetId}>` : r.targetId}` : ''}${r.detail ? ` — ${r.detail}` : ''}`).join('\n')
          : 'Chưa có thao tác nào.');
      } else if (top === 'pause') {
        const m = interaction.options.getString('module');
        safety.pauseModule(gid0, m, interaction.options.getString('ly-do'), interaction.user.id);
        embed.setDescription(`🛑 Đã tạm dừng module **${m}**.`);
      } else if (top === 'resume') {
        const m = interaction.options.getString('module');
        embed.setDescription(safety.resumeModule(gid0, m, interaction.user.id) ? `✅ Đã bật lại **${m}**.` : `ℹ️ **${m}** không bị tạm dừng.`);
      } else if (top === 'status') {
        const p = safety.listPauses(gid0);
        embed.setTitle('🛡️ Trạng thái module').setDescription(p.length
          ? p.map((x) => `🛑 **${x.module}** — ${x.reason || 'không có lý do'} (bởi <@${x.pausedBy}>)`).join('\n')
          : '✅ Tất cả module đang hoạt động.');
      }
      return interaction.reply({ embeds: [embed], ephemeral: true, allowedMentions: { parse: [] } });
    }

    const sub = interaction.options.getSubcommand();
    const gid = interaction.guild.id, uid = interaction.user.id;
    const int = (n) => interaction.options.getInteger(n);

    if (sub === 'create') {
      const deadline = ui.parseLocalDateTime(interaction.options.getString('han-dang-ky'));
      if (!deadline) return interaction.reply(eph('❌ Hạn đăng ký sai định dạng. Ví dụ: `2026-11-01 20:00`.'));
      if (deadline <= Date.now()) return interaction.reply(eph('❌ Hạn đăng ký phải ở tương lai.'));
      const pr = T.parseCoinPrizes(interaction.options.getString('thuong-coin'));
      if (!pr.ok) return interaction.reply(eph(`❌ ${pr.error}`));
      const id = T.createTournament(gid, uid, {
        name: interaction.options.getString('ten'), game: interaction.options.getString('game'),
        teamSize: int('kich-thuoc-doi') || 1, maxEntrants: int('so-doi-toi-da'), registerUntil: deadline,
        schedule: interaction.options.getString('lich-thi'), rules: interaction.options.getString('luat'),
        winCondition: interaction.options.getString('tieu-chi-thang'), prizes: pr.prizes
      });
      return interaction.reply(eph(`✅ Đã tạo giải **#${id}** ở trạng thái nháp. Kiểm tra bằng \`/gzw-admin tournament info id:${id}\`, thêm tiền mặt (nếu có) bằng \`cash-add\`, rồi \`open\` để công bố.`));
    }

    if (sub === 'open') {
      const r = T.openRegistration(gid, int('id'), uid);
      if (!r.ok) return interaction.reply(eph(ERR[r.reason]));
      const embed = new EmbedBuilder().setColor(gzw.brandColor).setTitle(`📣 Mở đăng ký · ${r.t.name}`)
        .setDescription(`🎮 ${r.t.game} · đăng ký bằng \`/tournament register id:${r.t.id}\`\nHạn: ${ui.ts(r.t.registerUntil)}\n\nXem luật và phần thưởng: \`/tournament info id:${r.t.id}\``);
      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'start') {
      await interaction.deferReply();
      const r = T.startTournament(gid, int('id'), uid);
      if (!r.ok) return interaction.editReply(ERR[r.reason]);
      const embed = new EmbedBuilder().setColor(gzw.brandColor).setTitle(`⚔️ Giải bắt đầu · ${r.t.name}`)
        .setDescription(`${r.entrants.length} đội · ${r.rounds} vòng. Đội trưởng gửi kết quả bằng \`/tournament result\`.`)
        .addFields(ui.bracketFields(r.t.id));
      await interaction.editReply({ embeds: [embed] });
      for (const e of r.entrants) for (const m of e.members) {
        await awardAchievement(interaction.guild, m, cfg.participationAchievementId, 'system:tournament').catch(() => {});
      }
      return;
    }

    if (sub === 'pending') {
      const rows = db.prepare(`SELECT m.*, t.name AS tname FROM tournament_matches m JOIN tournaments t ON t.id = m.tournamentId
                               WHERE t.guildId = ? AND m.status IN ('REPORTED','DISPUTED') ORDER BY m.updatedAt LIMIT 15`).all(gid);
      if (!rows.length) return interaction.reply(eph('Không có kết quả nào chờ duyệt.'));
      const lines = rows.map((m) => {
        const a = T.getEntrant(m.entrantA), b = T.getEntrant(m.entrantB);
        return `${ui.MATCH_ICON[m.status]} **Trận #${m.id}** (${m.tname}) ${a.name} ${m.scoreA}–${m.scoreB} ${b.name}\n[bằng chứng](${m.evidence})${m.note ? ` · ${m.note}` : ''}`;
      });
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(gzw.brandColor).setTitle('🔎 Chờ duyệt').setDescription(lines.join('\n\n'))], ephemeral: true });
    }

    if (sub === 'approve' || sub === 'set-result') {
      await interaction.deferReply();
      const r = sub === 'approve'
        ? T.approveResult(gid, int('tran'), uid)
        : T.adminSetResult(gid, int('tran'), uid, int('doi-thang'), int('diem-a'), int('diem-b'), `Ban tổ chức: ${interaction.options.getString('ly-do')}`);
      if (!r.ok) return interaction.editReply(ERR[r.reason]);
      const w = T.getEntrant(r.m.winnerId);
      await interaction.editReply({ content: `✅ Trận **#${r.m.id}** đã được duyệt. **${w.name}** đi tiếp.`, allowedMentions: { parse: [] } });
      if (r.finished) await announceFinish(interaction, T.getTournament(gid, r.m.tournamentId), r.finished);
      return;
    }

    if (sub === 'reject') {
      const r = T.rejectResult(gid, int('tran'), uid, interaction.options.getString('ly-do'));
      return interaction.reply(r.ok ? { content: `↩️ Đã từ chối kết quả trận **#${r.m.id}**, đội trưởng có thể gửi lại.` } : eph(ERR[r.reason]));
    }

    if (sub === 'cancel') {
      const r = T.cancelTournament(gid, int('id'), uid, interaction.options.getString('ly-do'));
      return interaction.reply(r.ok ? { content: `⛔ Đã huỷ giải **${r.t.name}**.` } : eph(ERR[r.reason]));
    }

    if (sub === 'info') {
      const t = T.getTournament(gid, int('id'));
      if (!t) return interaction.reply(eph(ERR.notfound));
      const ents = T.getEntrants(t.id);
      const cash = T.listCashPrizes(t.id);
      const embed = new EmbedBuilder().setColor(gzw.brandColor).setTitle(`🛠️ #${t.id} · ${t.name}`)
        .setDescription(`${ui.STATUS[t.status]} · ${t.game} · đội ${t.teamSize} người · hạn ĐK ${ui.ts(t.registerUntil)}`)
        .addFields(
          { name: `Đội (${ents.length}/${t.maxEntrants})`, value: ents.map((e) => `\`${e.id}\` **${e.name}** — ĐT <@${e.captainId}>`).join('\n').slice(0, 1000) || 'Chưa có.' },
          { name: 'Thưởng coin', value: ui.prizeText({ ...t, id: -1 }).slice(0, 1000) },
          { name: 'Tiền mặt', value: cash.length ? cash.map((c) => `\`${c.id}\` ${ui.PLACE[c.placement]} ${fmt(c.amountVnd)}đ — ${ui.CASH_STATUS[c.status]}`).join('\n') : 'Không có.' }
        );
      return interaction.reply({ embeds: [embed], ephemeral: true, allowedMentions: { parse: [] } });
    }

    if (sub === 'audit') {
      const t = T.getTournament(gid, int('id'));
      if (!t) return interaction.reply(eph(ERR.notfound));
      const rows = T.getAudit(t.id, 20);
      const payouts = T.getPayouts(t.id);
      const text = rows.map((a) => `<t:${Math.floor(a.createdAt / 1000)}:t> \`${a.action}\` <@${a.actorId}> ${a.detail || ''}`).join('\n') || 'Trống.';
      const pay = payouts.map((p) => `<@${p.userId}> hạng ${p.placement} +${coin(p.coins)} (duyệt bởi <@${p.approvedBy}>, <t:${Math.floor(p.createdAt / 1000)}:f>)`).join('\n') || 'Chưa trao coin.';
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(gzw.brandColor).setTitle(`🧾 Nhật ký giải #${t.id}`).addFields({ name: 'Thao tác', value: text.slice(0, 1000) }, { name: 'Coin đã trao', value: pay.slice(0, 1000) })], ephemeral: true, allowedMentions: { parse: [] } });
    }

    if (sub === 'cash-add') {
      const r = T.addCashPrize(gid, int('id'), uid, int('hang'), int('so-tien-vnd'), interaction.options.getString('mo-ta'));
      return interaction.reply(eph(r.ok ? `✅ Đã ghi nhận khoản tiền mặt **#${r.id}**. Bot chỉ theo dõi trạng thái, không chuyển tiền.` : ERR[r.reason]));
    }

    if (sub === 'cash-status') {
      const step = interaction.options.getString('buoc');
      if (approvers.length && !approvers.includes(uid)) return interaction.reply(eph('❌ Chỉ người được chỉ định (CASH_PRIZE_APPROVER_IDS) mới xử lý tiền mặt.'));
      const r = T.updateCashPrize(gid, int('khoan'), uid, step, interaction.options.getString('ghi-chu'));
      const msg = r.ok ? `✅ Khoản **#${r.p.id}** → **${ui.CASH_STATUS[r.status]}**.` : ERR[r.reason] + (r.expected ? ` (cần đang ở: ${ui.CASH_STATUS[r.expected]})` : '');
      return interaction.reply(eph(msg));
    }
  }
};
