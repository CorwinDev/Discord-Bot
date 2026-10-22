const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const boosters = require('../../database/boosters');
const boosterPerks = require('../../services/boosterPerks');
const { fmt, coin } = require('../../services/gzwUi');
const gzw = require('../../config/gzw');
const safety = require('../../database/safety');
const perm = require('../../services/perm');

module.exports = {
  group: 'GZW CORE (Quản trị)',
  cooldown: 2,
  data: new SlashCommandBuilder()
    .setName('booster-admin')
    .setDescription('Chính sách thưởng Boost, lượt chờ trao thưởng và quyền lợi Booster')
    .setDMPermission(false)
    .addSubcommand((s) => s.setName('policy').setDescription('Xem hoặc đặt chính sách thưởng Boost')
      .addIntegerOption((o) => o.setName('coin').setDescription('Số coin thưởng cho MỖI lượt Boost').setMinValue(0).setMaxValue(gzw.booster.maxRewardPerBoost))
      .addBooleanOption((o) => o.setName('bat').setDescription('Bật/tắt thưởng coin cho Boost')))
    .addSubcommand((s) => s.setName('pending').setDescription('Lượt Boost đã ghi nhận nhưng chưa được thưởng coin'))
    .addSubcommand((s) => s.setName('grant').setDescription('Trao thưởng cho lượt Boost đang chờ, theo chính sách hiện hành')
      .addIntegerOption((o) => o.setName('id').setDescription('ID lượt boost').setRequired(true).setMinValue(1)))
    .addSubcommand((s) => s.setName('sync').setDescription('Đồng bộ role/vật phẩm Booster cho các thành viên đang Boost (không cộng coin)')),

  async execute(interaction) {
    const denied = perm.require(interaction, 'economy');
    if (denied) return interaction.reply({ content: denied, ephemeral: true });
    const gid = interaction.guild.id;
    const sub = interaction.options.getSubcommand();
    const eph = (content) => ({ content, ephemeral: true, allowedMentions: { parse: [] } });

    if (sub === 'policy') {
      const coins = interaction.options.getInteger('coin');
      const on = interaction.options.getBoolean('bat');
      if (coins !== null || on !== null) {
        const r = boosters.setPolicy(gid, interaction.user.id, { coins, enabled: on });
        if (!r.ok) return interaction.reply(eph('❌ Số coin không hợp lệ.'));
        safety.audit(gid, interaction.user.id, 'booster.policy', null, `${r.policy.coins} coin/boost · ${r.policy.enabled ? 'bật' : 'tắt'}`);
      }
      const p = boosters.getPolicy(gid);
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(gzw.brandColor).setTitle('⚙️ Chính sách thưởng Boost')
          .setDescription(`Trạng thái: **${p.enabled ? 'bật' : 'tắt'}**\nThưởng: **${coin(p.coins)}** cho mỗi lượt Boost đã xác minh\nNguồn: ${p.configured ? 'admin đã đặt' : 'mặc định trong config (chưa đặt)'}`)
          .setFooter({ text: 'Mỗi sự kiện Boost chỉ được thưởng một lần. Coin đã trao không bị thu hồi khi ngừng Boost.' })],
        ephemeral: true
      });
    }

    if (sub === 'pending') {
      const rows = boosters.listPending(gid);
      if (!rows.length) return interaction.reply(eph('Không có lượt Boost nào đang chờ trao thưởng.'));
      const embed = new EmbedBuilder().setColor(gzw.brandColor).setTitle('🔎 Boost chờ trao thưởng')
        .setDescription(rows.map((r) => `**#${r.id}** · <@${r.userId}> · <t:${Math.floor(r.createdAt / 1000)}:d>`).join('\n'));
      return interaction.reply({ embeds: [embed], ephemeral: true, allowedMentions: { parse: [] } });
    }

    if (sub === 'grant') {
      const res = boosters.grantBoost(gid, interaction.options.getInteger('id'), interaction.user.id);
      if (res.ok) safety.audit(gid, interaction.user.id, 'booster.grant', res.ev.userId, `boost #${res.ev.id} · +${res.coins} coin`);
      return interaction.reply(eph(res.ok
        ? `✅ Đã cộng **${coin(res.coins)}** cho <@${res.ev.userId}>. Số dư: ${coin(res.balance)}.`
        : { notfound: '❌ Không thấy lượt boost.', done: '❌ Lượt này đã được xử lý.', self: '❌ Không thể tự trao thưởng cho lượt boost của chính mình.', policy: '❌ Chính sách thưởng đang tắt hoặc 0 coin. Hãy đặt bằng `/booster-admin policy`.' }[res.reason]));
    }

    // sync: chỉ dựa trên dữ liệu Discord (premiumSince), không tạo thưởng coin
    await interaction.deferReply({ ephemeral: true });
    const members = await interaction.guild.members.fetch().catch(() => null);
    if (!members) return interaction.editReply('❌ Không tải được danh sách thành viên (cần bật SERVER MEMBERS INTENT).');
    let n = 0;
    for (const m of members.values()) {
      if (m.user.bot) continue;
      if (m.premiumSince) { await boosterPerks.grantPerks(interaction.guild, m.id).catch(() => {}); n++; }
      else if (boosters.getStatus(gid, m.id)?.active) await boosterPerks.revokePerks(interaction.guild, m.id).catch(() => {});
    }
    return interaction.editReply(`✅ Đã đồng bộ quyền lợi cho **${fmt(n)}** thành viên đang Boost và gỡ quyền lợi của người đã ngừng.`);
  }
};
