const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../../database/db');
const gzw = require('../../config/gzw');
const gw = require('../../services/giveaways');
const safety = require('../../database/safety');

const UNIT = { m: 60000, h: 3600000, d: 86400000 };
const parseDuration = (txt) => {
  const m = /^(\d+)([mhd])$/i.exec(txt.trim());
  return m ? Number(m[1]) * UNIT[m[2].toLowerCase()] : null;
};

module.exports = {
  group: 'Cộng đồng',
  cooldown: 3,
  data: new SlashCommandBuilder()
    .setName('giveaway')
    .setDescription('Quản lý giveaway')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .setDMPermission(false)
    .addSubcommand((s) => s.setName('start').setDescription('Bắt đầu giveaway')
      .addStringOption((o) => o.setName('phan-thuong').setDescription('Phần thưởng').setRequired(true).setMaxLength(100))
      .addStringOption((o) => o.setName('thoi-gian').setDescription('Ví dụ: 30m, 2h, 7d').setRequired(true))
      .addIntegerOption((o) => o.setName('so-nguoi-thang').setDescription('Số người thắng (mặc định 1)').setMinValue(1).setMaxValue(gzw.community.maxWinners)))
    .addSubcommand((s) => s.setName('end').setDescription('Kết thúc sớm một giveaway')
      .addIntegerOption((o) => o.setName('id').setDescription('ID giveaway').setRequired(true).setMinValue(1)))
    .addSubcommand((s) => s.setName('reroll').setDescription('Bốc thăm lại người thắng cho giveaway đã kết thúc')
      .addIntegerOption((o) => o.setName('id').setDescription('ID giveaway').setRequired(true).setMinValue(1)))
    .addSubcommand((s) => s.setName('cancel').setDescription('Huỷ giveaway đang chạy')
      .addIntegerOption((o) => o.setName('id').setDescription('ID giveaway').setRequired(true).setMinValue(1)))
    .addSubcommand((s) => s.setName('list').setDescription('Các giveaway đang chạy')),

  async execute(interaction, client) {
    const gid = interaction.guild.id;
    const sub = interaction.options.getSubcommand();
    const eph = (content) => interaction.reply({ content, ephemeral: true, allowedMentions: { parse: [] } });

    if (sub === 'start') {
      const ms = parseDuration(interaction.options.getString('thoi-gian'));
      if (!ms || ms < 60000 || ms > gzw.community.maxGiveawayDays * 86400000) {
        return eph(`❌ Thời gian không hợp lệ (từ 1m đến ${gzw.community.maxGiveawayDays}d, ví dụ \`30m\`, \`2h\`, \`7d\`).`);
      }
      const info = db.prepare('INSERT INTO giveaways (guildId, channelId, prize, winners, hostId, endsAt, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .run(gid, interaction.channelId, interaction.options.getString('phan-thuong'), interaction.options.getInteger('so-nguoi-thang') ?? 1,
          interaction.user.id, Date.now() + ms, Date.now());
      const g = db.prepare('SELECT * FROM giveaways WHERE id = ?').get(info.lastInsertRowid);
      await interaction.reply(gw.buildMessage(g));
      const msg = await interaction.fetchReply();
      db.prepare('UPDATE giveaways SET messageId = ? WHERE id = ?').run(msg.id, g.id);
      safety.audit(gid, interaction.user.id, 'giveaway.start', String(g.id), g.prize);
      return;
    }

    if (sub === 'list') {
      const rows = db.prepare("SELECT * FROM giveaways WHERE guildId = ? AND status = 'RUNNING' ORDER BY endsAt LIMIT 15").all(gid);
      return eph(rows.length ? rows.map((r) => `**#${r.id}** · ${r.prize} · kết thúc <t:${Math.floor(r.endsAt / 1000)}:R> · ${gw.entryCount(r.id)} người`).join('\n') : 'Không có giveaway nào đang chạy.');
    }

    const id = interaction.options.getInteger('id');
    const g = db.prepare('SELECT * FROM giveaways WHERE id = ? AND guildId = ?').get(id, gid);
    if (!g) return eph('❌ Không tìm thấy giveaway.');

    if (sub === 'end') {
      await interaction.deferReply({ ephemeral: true });
      const r = await gw.endGiveaway(client, id);
      safety.audit(gid, interaction.user.id, 'giveaway.end', String(id), null);
      return interaction.editReply(r ? '✅ Đã kết thúc giveaway.' : '❌ Giveaway này không còn chạy.');
    }
    if (sub === 'cancel') {
      const ok = db.prepare("UPDATE giveaways SET status = 'CANCELLED' WHERE id = ? AND status = 'RUNNING'").run(id).changes;
      if (ok) {
        const ch = await client.channels.fetch(g.channelId).catch(() => null);
        const msg = ch && await ch.messages.fetch(g.messageId).catch(() => null);
        await msg?.edit({ content: '⛔ Giveaway đã bị huỷ.', components: [] }).catch(() => {});
        safety.audit(gid, interaction.user.id, 'giveaway.cancel', String(id), null);
      }
      return eph(ok ? '✅ Đã huỷ giveaway.' : '❌ Giveaway này không còn chạy.');
    }
    if (sub === 'reroll') {
      if (g.status !== 'ENDED') return eph('❌ Chỉ bốc thăm lại được giveaway đã kết thúc.');
      const old = g.winnerIds ? JSON.parse(g.winnerIds) : [];
      const pool = db.prepare('SELECT userId FROM giveaway_entries WHERE giveawayId = ?').all(id).map((r) => r.userId).filter((u) => !old.includes(u));
      const winners = gw.pickWinners(pool, g.winners);
      if (!winners.length) return eph('❌ Không còn người tham gia nào khác để bốc thăm.');
      db.prepare('UPDATE giveaways SET winnerIds = ? WHERE id = ?').run(JSON.stringify(winners), id);
      safety.audit(gid, interaction.user.id, 'giveaway.reroll', String(id), winners.join(','));
      return interaction.reply({ content: `🔁 Người thắng mới của **${g.prize}**: ${winners.map((w) => `<@${w}>`).join(', ')}`, allowedMentions: { users: winners } });
    }
  }
};
