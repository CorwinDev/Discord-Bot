const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const mgdb = require('../../database/management');
const { audit } = require('../../database/safety');
const perm = require('../../services/perm');
const ui = require('../../services/eventsUi');
const gzw = require('../../config/gzw');

/** "YYYY-MM-DD HH:mm" theo múi giờ của server (gzw.utcOffsetHours) -> timestamp UTC */
function parseTime(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})$/.exec(s.trim());
  if (!m) return null;
  const t = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]) - gzw.utcOffsetHours * 3600000;
  return Number.isNaN(t) ? null : t;
}
const needEvents = (i) => perm.require(i, 'events');
const idOpt = (s) => s.addIntegerOption((o) => o.setName('id').setDescription('Số sự kiện').setRequired(true).setMinValue(1));

module.exports = {
  group: 'GZW Management',
  cooldown: 3,
  data: new SlashCommandBuilder()
    .setName('event')
    .setDescription('Quản lý sự kiện: đăng ký, check-in, chia đội, trao thưởng')
    .setDMPermission(false)
    .addSubcommand((s) => s.setName('create').setDescription('(Event) tạo sự kiện')
      .addStringOption((o) => o.setName('ten').setDescription('Tên sự kiện').setRequired(true).setMaxLength(100))
      .addStringOption((o) => o.setName('bat-dau').setDescription('Giờ bắt đầu, dạng 2026-11-05 20:00 (giờ server)').setRequired(true))
      .addIntegerOption((o) => o.setName('suc-chua').setDescription('Số người tối đa (0 = không giới hạn)').setMinValue(0).setMaxValue(500))
      .addIntegerOption((o) => o.setName('ngan-sach').setDescription('Ngân sách coin thưởng cho sự kiện').setMinValue(0).setMaxValue(1000000))
      .addStringOption((o) => o.setName('mo-ta').setDescription('Mô tả').setMaxLength(500)))
    .addSubcommand((s) => s.setName('list').setDescription('Sự kiện đang mở'))
    .addSubcommand((s) => idOpt(s.setName('info').setDescription('Chi tiết sự kiện')))
    .addSubcommand((s) => idOpt(s.setName('roster').setDescription('(Event) danh sách đăng ký / đội / check-in')))
    .addSubcommand((s) => idOpt(s.setName('checkin').setDescription('(Event) check-in người tham dự'))
      .addUserOption((o) => o.setName('user').setDescription('Người tham dự').setRequired(true)))
    .addSubcommand((s) => idOpt(s.setName('teams').setDescription('(Event) chia đội ngẫu nhiên từ người đã check-in'))
      .addIntegerOption((o) => o.setName('so-doi').setDescription('Số đội').setRequired(true).setMinValue(2).setMaxValue(16)))
    .addSubcommand((s) => idOpt(s.setName('reward').setDescription('(Event) trao thưởng cho người đã check-in, trong ngân sách'))
      .addUserOption((o) => o.setName('user').setDescription('Người nhận').setRequired(true))
      .addIntegerOption((o) => o.setName('hang').setDescription('Thứ hạng').setRequired(true).setMinValue(1).setMaxValue(999))
      .addIntegerOption((o) => o.setName('coins').setDescription('Số coin').setRequired(true).setMinValue(0).setMaxValue(100000)))
    .addSubcommand((s) => idOpt(s.setName('finish').setDescription('(Event) kết thúc sự kiện')))
    .addSubcommand((s) => idOpt(s.setName('cancel').setDescription('(Event) huỷ sự kiện'))),

  async execute(interaction) {
    const guild = interaction.guild, gid = guild.id;
    const sub = interaction.options.getSubcommand();
    const staffSubs = ['create', 'roster', 'checkin', 'teams', 'reward', 'finish', 'cancel'];
    if (staffSubs.includes(sub)) {
      const err = needEvents(interaction);
      if (err) return interaction.reply({ content: err, ephemeral: true });
    }

    if (sub === 'create') {
      const startsAt = parseTime(interaction.options.getString('bat-dau'));
      if (!startsAt || startsAt < Date.now() - 60000) return interaction.reply({ content: '❌ Giờ không hợp lệ hoặc đã qua. Dạng đúng: `2026-11-05 20:00`.', ephemeral: true });
      const id = mgdb.createEvent(gid, interaction.user.id, {
        title: interaction.options.getString('ten'), description: interaction.options.getString('mo-ta'), startsAt,
        capacity: interaction.options.getInteger('suc-chua') ?? 0, rewardBudget: interaction.options.getInteger('ngan-sach') ?? 0, channelId: interaction.channel.id
      });
      audit(gid, interaction.user.id, 'event.create', String(id), `ngân sách ${interaction.options.getInteger('ngan-sach') ?? 0}`);
      const e = mgdb.getEvent(gid, id);
      const msg = await interaction.channel.send({ embeds: [ui.eventEmbed(e)], components: [ui.eventButtons(e)] });
      mgdb.setEventMessage(id, msg.id);
      return interaction.reply({ content: `✅ Đã tạo sự kiện #${id}.`, ephemeral: true });
    }

    if (sub === 'list') {
      const list = mgdb.listEvents(gid);
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(gzw.brandColor).setTitle('🎉 Sự kiện đang mở')
        .setDescription(list.length ? list.map((e) => `**#${e.id}** ${e.title} · <t:${Math.floor(e.startsAt / 1000)}:R> · ${mgdb.signupCount(e.id)}${e.capacity ? `/${e.capacity}` : ''} người`).join('\n') : 'Chưa có sự kiện.')], ephemeral: true });
    }

    const id = interaction.options.getInteger('id');
    const e = mgdb.getEvent(gid, id);
    if (!e) return interaction.reply({ content: '❌ Không có sự kiện này.', ephemeral: true });

    if (sub === 'info') return interaction.reply({ embeds: [ui.eventEmbed(e)], components: [ui.eventButtons(e)], ephemeral: true });

    if (sub === 'roster') {
      const r = mgdb.roster(id);
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(gzw.brandColor).setTitle(`📋 Danh sách #${id} — ${e.title}`)
        .setDescription(r.length ? r.map((x) => `<@${x.userId}> ${x.checkedIn ? '✅' : '▫️'}${x.team ? ` · Đội ${x.team}` : ''}${x.placement ? ` · Hạng ${x.placement}` : ''}`).join('\n').slice(0, 3900) : 'Chưa có ai đăng ký.')], ephemeral: true, allowedMentions: { parse: [] } });
    }
    if (sub === 'checkin') {
      const u = interaction.options.getUser('user');
      const r = mgdb.checkIn(gid, id, u.id);
      if (r.ok) ui.refresh(guild, mgdb.getEvent(gid, id));
      return interaction.reply({ content: r.ok ? `✅ Đã check-in ${u}.` : r.reason === 'notjoined' ? '❌ Người này chưa đăng ký sự kiện.' : '❌ Sự kiện đã đóng.', ephemeral: true, allowedMentions: { parse: [] } });
    }
    if (sub === 'teams') {
      const r = mgdb.makeTeams(gid, id, interaction.options.getInteger('so-doi'));
      if (!r.ok) return interaction.reply({ content: r.reason === 'few' ? `❌ Chỉ có ${r.count} người đã check-in, không đủ để chia.` : '❌ Sự kiện đã đóng.', ephemeral: true });
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(gzw.brandColor).setTitle(`🧩 Chia đội — ${e.title}`)
        .setDescription(r.teams.map((t, i) => `**Đội ${i + 1}:** ${t.map((u) => `<@${u}>`).join(' ')}`).join('\n'))], allowedMentions: { parse: [] } });
    }
    if (sub === 'reward') {
      const u = interaction.options.getUser('user');
      const coins = interaction.options.getInteger('coins');
      if (u.id === interaction.user.id && !perm.has(interaction.member, 'admin')) return interaction.reply({ content: '❌ Bạn không thể tự trao thưởng cho chính mình.', ephemeral: true });
      const r = mgdb.rewardEvent(gid, id, interaction.user.id, [{ userId: u.id, placement: interaction.options.getInteger('hang'), coins }]);
      const msg = r.ok ? `🎁 Đã trao **${coins}** ${gzw.currency.emoji} cho ${u}. Ngân sách còn **${r.remaining}**.`
        : r.reason === 'budget' ? `❌ Vượt ngân sách (còn ${r.remaining}, cần ${r.need}).`
        : r.reason === 'notcheckedin' ? '❌ Người này chưa check-in.' : r.reason === 'alreadyrewarded' ? '❌ Người này đã nhận thưởng sự kiện.' : '❌ Sự kiện đã đóng.';
      if (r.ok) ui.refresh(guild, mgdb.getEvent(gid, id));
      return interaction.reply({ content: msg, allowedMentions: { parse: [] } });
    }
    if (sub === 'finish' || sub === 'cancel') {
      if (sub === 'cancel' && e.createdBy !== interaction.user.id && !perm.has(interaction.member, 'admin')) return interaction.reply({ content: '❌ Chỉ người tạo hoặc admin được huỷ.', ephemeral: true });
      const ok = mgdb.finishEvent(gid, id, sub === 'finish' ? 'finished' : 'cancelled');
      if (ok) { audit(gid, interaction.user.id, `event.${sub}`, String(id), e.title); ui.refresh(guild, mgdb.getEvent(gid, id)); }
      return interaction.reply({ content: ok ? `✅ Đã ${sub === 'finish' ? 'kết thúc' : 'huỷ'} sự kiện #${id}.` : 'ℹ️ Sự kiện đã đóng trước đó.', ephemeral: true });
    }
  }
};
