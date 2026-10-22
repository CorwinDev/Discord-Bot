const {
  SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType
} = require('discord.js');
const gm = require('../../database/games');
const safety = require('../../database/safety');
const { confirmTransfer } = require('../../services/transferUi');
const { checkAutoAchievements, flashNotice } = require('../../services/gzwCore');
const { coin, fmt } = require('../../services/gzwUi');
const gzw = require('../../config/gzw');

const G = gzw.games;
const LETTERS = ['A', 'B', 'C', 'D'];
const duelCooldown = new Map(); // userId -> timestamp (chống spam thách đấu)
const quizCooldown = new Map();

const shuffle = (arr) => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
function pickQuestions(n) {
  return shuffle(gzw.questions).slice(0, n).map((q) => {
    const opts = shuffle(q.o.map((text, i) => ({ text, correct: i === q.a })));
    return { q: q.q, opts, answer: opts.findIndex((o) => o.correct) };
  });
}
const answerRow = (disabled = false, ids = 'a') => new ActionRowBuilder().addComponents(
  LETTERS.map((L, i) => new ButtonBuilder().setCustomId(`${ids}_${i}`).setLabel(L).setStyle(ButtonStyle.Primary).setDisabled(disabled))
);
const questionText = (q) => `**${q.q}**\n${q.opts.map((o, i) => `**${LETTERS[i]}.** ${o.text}`).join('\n')}`;
const matchLink = (m) => (m.messageId ? `https://discord.com/channels/${m.guildId}/${m.channelId}/${m.messageId}` : null);

/* ======================= Quiz solo ======================= */
async function soloQuiz(interaction) {
  const gid = interaction.guild.id, uid = interaction.user.id;
  const blocked = safety.gate(gid, uid, 'games', true);
  if (blocked) return interaction.reply({ content: blocked, ephemeral: true });
  const wait = (quizCooldown.get(uid) ?? 0) + G.soloCooldownSeconds * 1000 - Date.now();
  if (wait > 0) return interaction.reply({ content: `⏳ Chờ **${Math.ceil(wait / 1000)}s** nữa để chơi tiếp.`, ephemeral: true });
  if (!gm.quizStatus(gid, uid).ok) return interaction.reply({ content: '🌙 Hôm nay bạn đã đạt trần coin từ quiz. Quay lại ngày mai nhé.', ephemeral: true });

  quizCooldown.set(uid, Date.now());
  const [q] = pickQuestions(1);
  const embed = new EmbedBuilder().setColor(gzw.brandColor).setTitle('🧠 Quiz GZW')
    .setDescription(`${questionText(q)}\n\nThưởng **${coin(G.soloReward)}** nếu đúng · ${G.soloTimeSeconds}s · miễn phí, không mất coin`);
  await interaction.reply({ embeds: [embed], components: [answerRow(false, 'quiz')] });
  const message = await interaction.fetchReply();

  const collector = message.createMessageComponentCollector({
    componentType: ComponentType.Button, filter: (i) => i.user.id === uid, time: G.soloTimeSeconds * 1000, max: 1
  });
  collector.on('collect', async (btn) => {
    const pick = Number(btn.customId.split('_')[1]);
    if (pick !== q.answer) {
      return btn.update({ embeds: [embed.setColor(0xed4245).setDescription(`${questionText(q)}\n\n❌ Sai rồi! Đáp án đúng: **${LETTERS[q.answer]}. ${q.opts[q.answer].text}**`)], components: [answerRow(true, 'quiz')] });
    }
    const res = gm.awardQuiz(gid, uid);
    const note = res.ok ? `✅ Chính xác! +**${coin(res.reward)}** · Số dư ${coin(res.balance)}` : '✅ Chính xác! (đã đạt trần coin hôm nay)';
    await btn.update({ embeds: [embed.setColor(0x57f287).setDescription(`${questionText(q)}\n\n${note}`)], components: [answerRow(true, 'quiz')] });
  });
  collector.on('end', (c) => {
    if (c.size === 0) interaction.editReply({ embeds: [embed.setDescription(`${questionText(q)}\n\n⌛ Hết giờ.`)], components: [answerRow(true, 'quiz')] }).catch(() => {});
  });
}

/* ======================= Duel ======================= */
function matchEmbed(state, extra = {}) {
  const { m, scores, round, question, deadline, locked } = state;
  const stats = gm.spectatorStats(m.id);
  const e = new EmbedBuilder().setColor(gzw.brandColor)
    .setTitle(`⚔️ Duel #${m.id}`)
    .setDescription(`<@${m.p1}>  **${scores[0]}** — **${scores[1]}**  <@${m.p2}>`);
  if (question) {
    e.addFields({ name: `Câu ${round}/${G.duel.rounds}${deadline ? ` · hết giờ <t:${Math.floor(deadline / 1000)}:R>` : ''}`, value: questionText(question) });
  }
  if (extra.note) e.addFields({ name: 'Kết quả vòng', value: extra.note });
  e.addFields({
    name: '👀 Khán giả',
    value: `🔮 Dự đoán (miễn phí): <@${m.p1}> **${stats.p1}** · <@${m.p2}> **${stats.p2}**\n📣 Cổ vũ: **${stats.cheers}**`
  });
  e.setFooter({ text: `Duel không cược coin · dự đoán chỉ mở trước khi kết thúc câu 1${locked ? '' : ''}` });
  return e;
}
function matchComponents(state, disabled = false) {
  const { m } = state;
  const rows = [answerRow(disabled, 'd_ans')];
  rows.push(new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('d_pred_1').setLabel('Dự đoán P1').setEmoji('🔮').setStyle(ButtonStyle.Secondary).setDisabled(disabled || state.roundsDone > 0),
    new ButtonBuilder().setCustomId('d_pred_2').setLabel('Dự đoán P2').setEmoji('🔮').setStyle(ButtonStyle.Secondary).setDisabled(disabled || state.roundsDone > 0),
    new ButtonBuilder().setCustomId('d_cheer_fire').setEmoji('🔥').setStyle(ButtonStyle.Secondary).setDisabled(disabled),
    new ButtonBuilder().setCustomId('d_cheer_clap').setEmoji('👏').setStyle(ButtonStyle.Secondary).setDisabled(disabled)
  ));
  rows.push(new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('d_gift_1').setLabel(`Tặng P1 ${gzw.transfer.spectatorGift}🪙`).setStyle(ButtonStyle.Success).setDisabled(disabled),
    new ButtonBuilder().setCustomId('d_gift_2').setLabel(`Tặng P2 ${gzw.transfer.spectatorGift}🪙`).setStyle(ButtonStyle.Success).setDisabled(disabled)
  ));
  return rows;
}

async function runDuel(interaction, message, m, usersById) {
  const gid = m.guildId;
  const questions = pickQuestions(G.duel.rounds);
  const state = { m, scores: [0, 0], round: 0, question: null, deadline: null, roundsDone: 0, locked: new Set(), open: false, roundResolve: null };
  const need = Math.floor(G.duel.rounds / 2) + 1;

  const render = (extra, disabled = false) =>
    message.edit({ embeds: [matchEmbed(state, extra)], components: matchComponents(state, disabled), allowedMentions: { parse: [] } }).catch(() => {});

  const collector = message.createMessageComponentCollector({ componentType: ComponentType.Button, time: (G.duel.rounds * (G.duel.roundSeconds + 6) + 30) * 1000 });

  collector.on('collect', async (btn) => {
    try {
      const id = btn.customId;
      const uid = btn.user.id;
      const isPlayer = uid === m.p1 || uid === m.p2;

      if (id.startsWith('d_ans_')) {
        if (!isPlayer) return btn.reply({ content: '👀 Bạn đang xem trận — hãy dùng nút Dự đoán / Cổ vũ nhé.', ephemeral: true });
        if (!state.open) return btn.reply({ content: '⏳ Vòng này đã kết thúc.', ephemeral: true });
        if (state.locked.has(uid)) return btn.reply({ content: '🔒 Bạn đã trả lời sai vòng này.', ephemeral: true });
        const pick = Number(id.split('_')[2]);
        if (pick === state.question.answer) {
          await btn.deferUpdate();
          return state.roundResolve?.({ winner: uid === m.p1 ? 0 : 1 });
        }
        state.locked.add(uid);
        await btn.reply({ content: '❌ Sai rồi, bạn bị khoá trong vòng này.', ephemeral: true });
        if (state.locked.has(m.p1) && state.locked.has(m.p2)) state.roundResolve?.({ winner: null });
        return;
      }

      if (id === 'd_pred_1' || id === 'd_pred_2') {
        const pickId = id === 'd_pred_1' ? m.p1 : m.p2;
        if (state.roundsDone > 0) return btn.reply({ content: '🔒 Dự đoán đã đóng (câu 1 đã kết thúc).', ephemeral: true });
        const r = gm.addPrediction(m.id, gid, uid, pickId);
        const msg = r.ok ? `🔮 Đã ghi dự đoán: <@${pickId}> thắng. (Miễn phí, không đặt coin.)`
          : r.reason === 'player' ? '❌ Người chơi không thể dự đoán trận của mình.'
          : r.reason === 'duplicate' ? 'ℹ️ Bạn đã dự đoán trận này rồi.' : '❌ Dự đoán đã đóng.';
        return btn.reply({ content: msg, ephemeral: true, allowedMentions: { parse: [] } });
      }

      if (id === 'd_cheer_fire' || id === 'd_cheer_clap') {
        const r = gm.addCheer(m.id, gid, uid, id === 'd_cheer_fire' ? '🔥' : '👏');
        return btn.reply({ content: r.ok ? '📣 Đã cổ vũ!' : '⏳ Chờ vài giây rồi cổ vũ tiếp nhé.', ephemeral: true });
      }

      if (id === 'd_gift_1' || id === 'd_gift_2') {
        const toId = id === 'd_gift_1' ? m.p1 : m.p2;
        return confirmTransfer(btn, {
          toUser: usersById[toId], kind: 'coin', amount: gzw.transfer.spectatorGift, context: 'spectator', announce: false
        });
      }
    } catch (err) {
      console.error('⚠️  Lỗi duel button:', err);
    }
  });

  try {
    for (let r = 0; r < questions.length; r++) {
      state.round = r + 1;
      state.question = questions[r];
      state.locked = new Set();
      state.deadline = Date.now() + G.duel.roundSeconds * 1000;
      let timer;
      const resultPromise = new Promise((resolve) => {
        state.roundResolve = resolve;
        timer = setTimeout(() => resolve({ winner: null, timeout: true }), G.duel.roundSeconds * 1000);
      });
      state.open = true;
      await render();
      const result = await resultPromise;
      clearTimeout(timer);
      state.open = false;
      state.roundResolve = null;
      state.roundsDone++;
      if (result.winner !== null) state.scores[result.winner]++;

      const q = state.question;
      const note = result.winner !== null
        ? `✅ <@${result.winner === 0 ? m.p1 : m.p2}> trả lời đúng: **${q.opts[q.answer].text}**`
        : `⌛ Không ai ghi điểm. Đáp án: **${q.opts[q.answer].text}**`;
      state.deadline = null;
      await render({ note });

      const remaining = questions.length - (r + 1);
      if (state.scores[0] >= need || state.scores[1] >= need || state.scores[0] + remaining < state.scores[1] || state.scores[1] + remaining < state.scores[0]) break;
      await new Promise((res) => setTimeout(res, 3500));
    }
  } catch (err) {
    console.error('❌ Duel lỗi, huỷ trận:', err);
    gm.abortMatch(m.id);
    collector.stop();
    return message.edit({ content: '⚠️ Trận bị huỷ do lỗi, không ai được thưởng.', components: [] }).catch(() => {});
  }

  collector.stop();
  const fin = gm.finishDuel(m.id, state.scores[0], state.scores[1]);
  if (!fin) return;

  const winnerLine = fin.winnerId ? `🏆 Người thắng: <@${fin.winnerId}>` : '🤝 Hoà!';
  const rewardLine = fin.pairLimited
    ? 'ℹ️ Cặp đấu này đã đạt giới hạn thưởng trong ngày — không có coin thưởng.'
    : `🎁 Thưởng hệ thống: <@${m.p1}> +${fmt(fin.rewards[m.p1])} · <@${m.p2}> +${fmt(fin.rewards[m.p2])} ${gzw.currency.emoji}`;
  const stats = gm.spectatorStats(m.id);
  const done = matchEmbed(state).setTitle(`⚔️ Duel #${m.id} — kết thúc`)
    .setColor(fin.winnerId ? 0x57f287 : 0xfee75c)
    .addFields({ name: 'Kết quả', value: `${winnerLine}\n${rewardLine}\n🔮 Dự đoán đúng: **${fin.correctUsers.length}** người · 📣 ${stats.cheers} cổ vũ` });
  await message.edit({ embeds: [done], components: [], allowedMentions: { parse: [] } }).catch(() => {});

  // Thành tích tự động (người chơi + người dự đoán đúng)
  for (const uid of new Set([m.p1, m.p2, ...fin.correctUsers.slice(0, 25)])) {
    const earned = await checkAutoAchievements(interaction.guild, uid).catch(() => []);
    for (const a of earned) flashNotice(message.channel, `🏅 <@${uid}> đạt thành tích **${a.name}**${a.reward ? ` · +${a.reward} ${gzw.currency.emoji}` : ''}`, 15000);
  }
}

async function duel(interaction) {
  const gid = interaction.guild.id, challenger = interaction.user, target = interaction.options.getUser('doi-thu');
  const blocked = safety.gate(gid, challenger.id, 'games', true);
  if (blocked) return interaction.reply({ content: blocked, ephemeral: true });
  if (target.bot || target.id === challenger.id) return interaction.reply({ content: '❌ Hãy thách đấu một thành viên khác (không phải bot hay chính bạn).', ephemeral: true });
  if (safety.gate(gid, target.id, 'games', true)) return interaction.reply({ content: '🌙 Đối thủ đang tạm dừng tham gia game.', ephemeral: true });
  if (gm.isInActiveMatch(gid, challenger.id) || gm.isInActiveMatch(gid, target.id)) return interaction.reply({ content: '❌ Một trong hai người đang trong trận khác.', ephemeral: true });
  const wait = (duelCooldown.get(challenger.id) ?? 0) + G.duel.cooldownSeconds * 1000 - Date.now();
  if (wait > 0) return interaction.reply({ content: `⏳ Chờ **${Math.ceil(wait / 1000)}s** nữa để thách đấu tiếp.`, ephemeral: true });
  duelCooldown.set(challenger.id, Date.now());

  const invite = new EmbedBuilder().setColor(gzw.brandColor).setTitle('⚔️ Thách đấu Quiz')
    .setDescription(`${challenger} thách đấu ${target}!\n${G.duel.rounds} câu hỏi, ai trả lời đúng trước được điểm. **Không cược coin.**\nThưởng hệ thống: thắng +${G.duel.winnerReward}, thua +${G.duel.loserReward} ${gzw.currency.emoji} (có trần mỗi ngày).`);
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('duel_accept').setLabel('Chấp nhận').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('duel_decline').setLabel('Từ chối').setStyle(ButtonStyle.Danger)
  );
  await interaction.reply({ content: `${target}`, embeds: [invite], components: [row], allowedMentions: { users: [target.id] } });
  const message = await interaction.fetchReply();

  const collector = message.createMessageComponentCollector({
    componentType: ComponentType.Button, time: G.duel.acceptSeconds * 1000,
    filter: (i) => i.user.id === target.id || i.user.id === challenger.id
  });
  let started = false;
  collector.on('collect', async (btn) => {
    if (btn.customId === 'duel_decline' || (btn.customId === 'duel_accept' && btn.user.id === challenger.id)) {
      collector.stop('declined');
      return btn.update({ content: btn.user.id === challenger.id ? '🚫 Người thách đấu đã huỷ.' : '🚫 Lời thách đấu bị từ chối.', embeds: [], components: [] });
    }
    if (btn.customId !== 'duel_accept' || started) return;
    // kiểm tra lại ngay trước khi bắt đầu
    if (safety.gate(gid, challenger.id, 'games', true) || safety.gate(gid, target.id, 'games', true) ||
        gm.isInActiveMatch(gid, challenger.id) || gm.isInActiveMatch(gid, target.id)) {
      collector.stop('invalid');
      return btn.update({ content: '❌ Không thể bắt đầu trận lúc này.', embeds: [], components: [] });
    }
    started = true;
    collector.stop('accepted');
    const matchId = gm.createMatch(gid, interaction.channel.id, 'duel', challenger.id, target.id);
    await btn.update({ content: '', embeds: [new EmbedBuilder().setColor(gzw.brandColor).setDescription('⚔️ Chuẩn bị…')], components: [] });
    gm.setMatchMessage(matchId, message.id);
    const m = gm.getMatch(matchId);
    runDuel(interaction, message, m, { [challenger.id]: challenger, [target.id]: target })
      .catch((err) => { console.error('❌ runDuel:', err); gm.abortMatch(matchId); });
  });
  collector.on('end', (_c, reason) => {
    if (!started && reason === 'time') interaction.editReply({ content: '⌛ Hết thời gian, lời thách đấu hết hạn.', embeds: [], components: [] }).catch(() => {});
  });
}

/* ======================= Xem trận / luật / lịch sử ======================= */
async function watch(interaction) {
  const list = gm.activeMatches(interaction.guild.id);
  const e = new EmbedBuilder().setColor(gzw.brandColor).setTitle('👀 Trận đang diễn ra');
  if (!list.length) e.setDescription('Hiện không có trận nào. Dùng `/games duel` để tạo trận!');
  else e.setDescription(list.map((m) => `**#${m.id}** · <@${m.p1}> vs <@${m.p2}> · [Xem trận](${matchLink(m)})`).join('\n'))
    .setFooter({ text: 'Trong trận: dự đoán miễn phí, cổ vũ, hoặc tặng coin cho người chơi' });
  await interaction.reply({ embeds: [e], ephemeral: true, allowedMentions: { parse: [] } });
}

async function rules(interaction) {
  const e = new EmbedBuilder().setColor(gzw.brandColor).setTitle('📜 Luật Game Hub').setDescription([
    '• **Không cược coin.** Chơi miễn phí; coin chỉ là thưởng từ hệ thống.',
    `• Quiz solo: +${G.soloReward} coin/lần đúng, chờ ${G.soloCooldownSeconds}s, trần ${G.soloDailyCap} coin/ngày.`,
    `• Duel ${G.duel.rounds} câu: thắng +${G.duel.winnerReward}, thua/hoà +${G.duel.loserReward}; trần ${G.duel.dailyRewardCap} coin/ngày; cùng một cặp chỉ được thưởng ${G.duel.pairRewardedPerDay} trận/ngày.`,
    '• Khán giả: dự đoán **miễn phí** (không đặt coin, chỉ tính thành tích Oracle Wolf), cổ vũ, hoặc tặng coin ảo từ ví của bạn.',
    '• Quà tặng không ảnh hưởng kết quả trận.',
    '• Muốn nghỉ: `/coin pause`. Admin có thể tạm dừng game khi phát hiện gian lận.'
  ].join('\n'));
  await interaction.reply({ embeds: [e], ephemeral: true });
}

async function history(interaction) {
  const rows = gm.matchHistory(interaction.guild.id, interaction.user.id, 10);
  const e = new EmbedBuilder().setColor(gzw.brandColor).setTitle('📚 Lịch sử trận của bạn');
  e.setDescription(rows.length ? rows.map((m) => {
    const me = m.p1 === interaction.user.id ? 1 : 2;
    const res = !m.winnerId ? '🤝 Hoà' : m.winnerId === interaction.user.id ? '🏆 Thắng' : '❌ Thua';
    return `#${m.id} · ${res} · <@${m.p1}> ${m.score1}–${m.score2} <@${m.p2}> · <t:${Math.floor(m.endedAt / 1000)}:R>`;
  }).join('\n') : 'Bạn chưa có trận nào.');
  await interaction.reply({ embeds: [e], ephemeral: true, allowedMentions: { parse: [] } });
}

module.exports = {
  group: 'GZW CORE',
  cooldown: 3,
  data: new SlashCommandBuilder()
    .setName('games')
    .setDescription('Game Hub: quiz, duel, xem trận')
    .addSubcommand((s) => s.setName('play').setDescription('Quiz solo — trả lời đúng để nhận coin (miễn phí)'))
    .addSubcommand((s) => s.setName('duel').setDescription('Thách đấu quiz với thành viên khác (không cược)')
      .addUserOption((o) => o.setName('doi-thu').setDescription('Đối thủ').setRequired(true)))
    .addSubcommand((s) => s.setName('watch').setDescription('Xem các trận đang diễn ra'))
    .addSubcommand((s) => s.setName('rules').setDescription('Luật và giới hạn của Game Hub'))
    .addSubcommand((s) => s.setName('history').setDescription('Lịch sử trận của bạn')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    if (sub === 'play') return soloQuiz(interaction);
    if (sub === 'duel') return duel(interaction);
    if (sub === 'watch') return watch(interaction);
    if (sub === 'rules') return rules(interaction);
    if (sub === 'history') return history(interaction);
  }
};
