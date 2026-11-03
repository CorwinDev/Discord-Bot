const {
  ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, StringSelectMenuBuilder, PermissionFlagsBits
} = require('discord.js');
const db = require('../database/db');
const core = require('../config/core');

const ROLE_NAMES = { wolf: 'Ma Sói', seer: 'Tiên Tri', guard: 'Bảo Vệ', villager: 'Dân Làng' };
const MIN_PLAYERS = 5;
const MAX_PLAYERS = 16;

function buildSetupPanel() {
  const embed = new EmbedBuilder()
    .setColor(core.brandColor)
    .setTitle('🐺 Ma Sói')
    .setDescription('Bấm **Tạo lobby** để mở ván mới. Người chơi vào/rời lobby bằng nút; khi bắt đầu, vai trò được gửi riêng qua DM. Các phase tự chuyển khi mọi người hoàn tất hành động.')
    .setFooter({ text: `Tối thiểu ${MIN_PLAYERS} người · bật DM từ server để nhận vai trò` });
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('werewolf:open').setLabel('Tạo lobby').setEmoji('🐺').setStyle(ButtonStyle.Primary)
  );
  return { embeds: [embed], components: [row], allowedMentions: { parse: [] } };
}

async function postSetupPanel(guild, channel) {
  const settings = db.prepare('SELECT * FROM werewolf_settings WHERE guildId = ?').get(guild.id);
  const existing = settings?.panelMessageId
    ? await channel.messages.fetch(settings.panelMessageId).catch(() => null)
    : null;
  const message = existing ? await existing.edit(buildSetupPanel()) : await channel.send(buildSetupPanel());
  db.prepare('UPDATE werewolf_settings SET panelMessageId = ?, updatedAt = ? WHERE guildId = ?')
    .run(message.id, Date.now(), guild.id);
  return message;
}

function getSettings(guildId) {
  return db.prepare('SELECT * FROM werewolf_settings WHERE guildId = ?').get(guildId);
}

function getPlayers(gameId) {
  return db.prepare('SELECT * FROM werewolf_players WHERE gameId = ? ORDER BY joinedAt, userId').all(gameId);
}

function lobbyEmbed(game) {
  const players = getPlayers(game.id);
  return new EmbedBuilder().setColor(0x3977c5).setTitle(`🐺 Ma Sói · Lobby #${game.id}`)
    .setDescription(players.map((player, index) => `${index + 1}. <@${player.userId}>`).join('\n') || 'Chưa có người chơi')
    .addFields({ name: 'Người chơi', value: `${players.length}/${MAX_PLAYERS}`, inline: true }, { name: 'Host', value: `<@${game.hostId}>`, inline: true })
    .setFooter({ text: `Cần ít nhất ${MIN_PLAYERS} người · Vai trò gửi riêng qua DM` });
}

function lobbyControls(game, disabled = false) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`werewolf:join:${game.id}`).setLabel('Tham gia').setStyle(ButtonStyle.Success).setDisabled(disabled),
    new ButtonBuilder().setCustomId(`werewolf:leave:${game.id}`).setLabel('Rời lobby').setStyle(ButtonStyle.Secondary).setDisabled(disabled),
    new ButtonBuilder().setCustomId(`werewolf:start:${game.id}`).setLabel('Bắt đầu').setStyle(ButtonStyle.Primary).setDisabled(disabled),
    new ButtonBuilder().setCustomId(`werewolf:cancel:${game.id}`).setLabel('Huỷ').setStyle(ButtonStyle.Danger).setDisabled(disabled)
  );
}

async function updateLobby(client, gameId, disabled = false) {
  const game = db.prepare('SELECT * FROM werewolf_games WHERE id = ?').get(gameId);
  const channel = await client.channels.fetch(game?.channelId).catch(() => null);
  const message = channel?.messages && game?.lobbyMessageId
    ? await channel.messages.fetch(game.lobbyMessageId).catch(() => null)
    : null;
  if (message) await message.edit({ embeds: [lobbyEmbed(game)], components: [lobbyControls(game, disabled)] }).catch(() => {});
}

function shuffle(items) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index--) {
    const swap = Math.floor(Math.random() * (index + 1));
    [result[index], result[swap]] = [result[swap], result[index]];
  }
  return result;
}

function winners(players) {
  const alive = players.filter((player) => player.alive);
  const wolves = alive.filter((player) => player.role === 'wolf').length;
  if (!wolves) return 'Dân Làng';
  if (wolves >= alive.length - wolves) return 'Ma Sói';
  return null;
}

function targetMenu(game, actor, action, players) {
  const candidates = players.filter((player) => player.alive && (action === 'protect' || player.userId !== actor.userId));
  const options = candidates.slice(0, 25).map((player) => ({
    label: `${player.displayName || player.username || player.userId.slice(-6)}`.slice(0, 100),
    description: 'Người chơi còn sống',
    value: player.userId
  }));
  return new ActionRowBuilder().addComponents(new StringSelectMenuBuilder()
    .setCustomId(`werewolf:action:${game.id}:${game.round}:${game.phase}:${action}`)
    .setPlaceholder(action === 'vote' ? 'Chọn người để vote treo cổ' : 'Chọn mục tiêu')
    .addOptions(options));
}

async function sendNightActions(client, game) {
  const players = getPlayers(game.id).filter((player) => player.alive);
  const wolves = players.filter((player) => player.role === 'wolf');
  for (const player of players) {
    const action = player.role === 'wolf' ? 'kill' : player.role === 'seer' ? 'inspect' : player.role === 'guard' ? 'protect' : null;
    if (!action) continue;
    const user = await client.users.fetch(player.userId).catch(() => null);
    if (!user) continue;
    await user.send({
      content: `🌙 **Đêm ${game.round}** · Vai trò: **${ROLE_NAMES[player.role]}**${player.role === 'wolf' && wolves.length > 1 ? ` · Sói cùng phe: ${wolves.filter((wolf) => wolf.userId !== player.userId).map((wolf) => `<@${wolf.userId}>`).join(', ')}` : ''}`,
      components: [targetMenu(game, player, action, players)],
      allowedMentions: { parse: [] }
    }).catch(() => {});
  }
}

async function sendDayBoard(client, game) {
  const channel = await client.channels.fetch(game.channelId).catch(() => null);
  if (!channel?.send) return;
  const alive = getPlayers(game.id).filter((player) => player.alive);
  const embed = new EmbedBuilder().setColor(0xd79b42).setTitle(`☀️ Ma Sói · Ngày ${game.round}`)
    .setDescription(`Còn sống: ${alive.map((player) => `<@${player.userId}>`).join(' ')}\nMỗi người chọn một mục tiêu bằng menu bên dưới. Kết quả hiện khi tất cả người còn sống đã vote.`);
  await channel.send({ embeds: [embed], components: [targetMenu({ ...game, phase: 'day' }, { userId: '' }, 'vote', alive)], allowedMentions: { parse: [] } });
}

async function announceRoles(client, gameId) {
  const players = getPlayers(gameId);
  const game = db.prepare('SELECT * FROM werewolf_games WHERE id = ?').get(gameId);
  const channel = await client.channels.fetch(game?.channelId).catch(() => null);
  if (!channel?.send) return;
  await channel.send({
    content: `🏁 Game kết thúc! Phe **${winners(players)}** chiến thắng.\n${players.map((player) => `<@${player.userId}> — ${ROLE_NAMES[player.role]}`).join('\n')}`,
    allowedMentions: { parse: [] }
  });
}

function tryResolve(gameId) {
  return db.transaction(() => {
    const game = db.prepare('SELECT * FROM werewolf_games WHERE id = ?').get(gameId);
    if (!game || game.status !== 'active') return null;
    const players = getPlayers(game.id);
    const alive = players.filter((player) => player.alive);
    const required = game.phase === 'night'
      ? alive.filter((player) => ['wolf', 'seer', 'guard'].includes(player.role)).length
      : alive.length;
    const actions = db.prepare('SELECT * FROM werewolf_actions WHERE gameId = ? AND round = ? AND phase = ?')
      .all(game.id, game.round, game.phase);
    if (actions.length < required) return null;

    let eliminated = null;
    const votes = new Map();
    for (const action of actions.filter((item) => item.action === (game.phase === 'night' ? 'kill' : 'vote'))) {
      votes.set(action.targetId, (votes.get(action.targetId) || 0) + 1);
    }
    const highest = Math.max(0, ...votes.values());
    const selected = [...votes.entries()].filter(([, count]) => count === highest && highest > 0);
    if (selected.length === 1) {
      const target = players.find((player) => player.userId === selected[0][0]);
      const protectedId = actions.find((item) => item.action === 'protect')?.targetId;
      if (target && (game.phase !== 'night' || target.userId !== protectedId)) eliminated = target;
    }
    if (eliminated) db.prepare('UPDATE werewolf_players SET alive = 0 WHERE gameId = ? AND userId = ?').run(game.id, eliminated.userId);

    const winner = winners(getPlayers(game.id));
    const fromPhase = game.phase;
    const nextPhase = fromPhase === 'night' ? 'day' : 'night';
    const nextRound = fromPhase === 'night' ? game.round : game.round + 1;
    db.prepare('DELETE FROM werewolf_actions WHERE gameId = ? AND round = ? AND phase = ?').run(game.id, game.round, fromPhase);
    if (winner) {
      db.prepare("UPDATE werewolf_games SET phase = 'finished', status = 'finished', updatedAt = ? WHERE id = ? AND status = 'active'")
        .run(Date.now(), game.id);
      return { game, fromPhase, eliminated, winner };
    }
    db.prepare('UPDATE werewolf_games SET phase = ?, round = ?, updatedAt = ? WHERE id = ? AND status = \'active\' AND phase = ? AND round = ?')
      .run(nextPhase, nextRound, Date.now(), game.id, fromPhase, game.round);
    return { game: { ...game, phase: nextPhase, round: nextRound }, fromPhase, eliminated, winner: null };
  })();
}

async function publishResolution(client, result) {
  const channel = await client.channels.fetch(result.game.channelId).catch(() => null);
  if (!channel?.send) return;
  const outcome = result.eliminated
    ? `<@${result.eliminated.userId}> (${ROLE_NAMES[result.eliminated.role]}) bị loại.`
    : result.fromPhase === 'night' ? 'Đêm qua không ai bị loại.' : 'Phiếu hòa, không ai bị treo cổ.';
  if (result.winner) {
    await channel.send({ content: `${result.fromPhase === 'night' ? '☀️ Đêm kết thúc.' : '🪢 Ngày kết thúc.'} ${outcome}\n🏆 Phe **${result.winner}** chiến thắng!`, allowedMentions: { parse: [] } });
    return announceRoles(client, result.game.id);
  }
  if (result.game.phase === 'day') {
    await channel.send({ content: `☀️ **Ngày ${result.game.round} bắt đầu.** ${outcome}`, allowedMentions: { parse: [] } });
    return sendDayBoard(client, result.game);
  }
  await channel.send({ content: `🌙 **Đêm ${result.game.round} bắt đầu.** ${outcome}`, allowedMentions: { parse: [] } });
  return sendNightActions(client, result.game);
}

function nightMenu(game, actor, action, players) {
  const targets = players.filter((player) => player.alive && (action === 'protect' || player.userId !== actor.userId));
  const options = targets.map((player) => ({ label: player.userId.slice(-6), description: 'Người chơi còn sống', value: player.userId }));
  return new ActionRowBuilder().addComponents(new StringSelectMenuBuilder()
    .setCustomId(`werewolf:action:${game.id}:${game.round}:night:${action}`)
    .setPlaceholder(action === 'kill' ? 'Ma Sói: chọn mục tiêu' : action === 'inspect' ? 'Tiên Tri: chọn người để soi' : 'Bảo Vệ: chọn người để bảo vệ')
    .addOptions(options));
}

async function startLobby(interaction, client, game) {
  if (game.hostId !== interaction.user.id) return interaction.reply({ content: 'Chỉ host tạo lobby mới bắt đầu được.', ephemeral: true });
  const claimed = db.prepare(`UPDATE werewolf_games SET startedAt = ?, updatedAt = ?
    WHERE id = ? AND status = 'lobby' AND startedAt IS NULL`).run(Date.now(), Date.now(), game.id).changes;
  if (!claimed) return interaction.reply({ content: 'Lobby đang bắt đầu hoặc đã đóng.', ephemeral: true });
  const players = getPlayers(game.id);
  if (players.length < MIN_PLAYERS) {
    db.prepare('UPDATE werewolf_games SET startedAt = NULL WHERE id = ?').run(game.id);
    return interaction.reply({ content: `Cần ít nhất ${MIN_PLAYERS} người (hiện có ${players.length}).`, ephemeral: true });
  }

  await interaction.deferReply({ ephemeral: true });
  const users = [];
  for (const player of players) {
    const user = await client.users.fetch(player.userId).catch(() => null);
    if (!user) {
      db.prepare('UPDATE werewolf_games SET startedAt = NULL WHERE id = ?').run(game.id);
      return interaction.editReply('Không thể tải một người chơi. Hãy kiểm tra thành viên còn trong server.');
    }
    try { await user.send('🐺 Game Ma Sói sắp bắt đầu; bot sẽ gửi vai trò bí mật tiếp theo.'); }
    catch {
      db.prepare('UPDATE werewolf_games SET startedAt = NULL WHERE id = ?').run(game.id);
      return interaction.editReply(`Không gửi DM được cho <@${user.id}>. Người này cần bật DM từ server.`);
    }
    users.push({ player, user });
  }

  const wolfCount = players.length >= 8 ? 2 : 1;
  const roles = shuffle([...Array(wolfCount).fill('wolf'), 'seer', 'guard', ...Array(players.length - wolfCount - 2).fill('villager')]);
  const wolfIds = players.filter((_, index) => roles[index] === 'wolf').map((player) => player.userId);
  const firstNight = { ...game, phase: 'night', round: 1 };
  const delivered = [];
  try {
    for (let index = 0; index < users.length; index++) {
      const { player, user } = users[index];
      const role = roles[index];
      const team = role === 'wolf' ? `\nĐồng đội: ${wolfIds.filter((id) => id !== player.userId).map((id) => `<@${id}>`).join(', ') || 'Không có.'}` : '';
      const allPlayers = players.map((item, playerIndex) => ({ ...item, role: roles[playerIndex], alive: true }));
      const menu = role === 'wolf' || role === 'seer' || role === 'guard'
        ? [nightMenu(firstNight, { ...player, role }, role === 'wolf' ? 'kill' : role === 'seer' ? 'inspect' : 'protect', allPlayers)]
        : [];
      await user.send({ content: `🎭 Vai trò bí mật: **${ROLE_NAMES[role]}**.${team}\n🌙 Đêm 1: dùng menu này để hành động.`, components: menu, allowedMentions: { parse: [] } });
      delivered.push(user);
    }
  } catch {
    await Promise.all(delivered.map((user) => user.send('Game đã bị huỷ vì không thể gửi đủ vai trò. Hãy bỏ qua tin nhắn trước.').catch(() => {})));
    db.prepare('UPDATE werewolf_games SET startedAt = NULL WHERE id = ?').run(game.id);
    return interaction.editReply('Không gửi đủ DM vai trò nên lobby chưa bắt đầu. Kiểm tra DM người chơi rồi thử lại.');
  }

  const now = Date.now();
  db.transaction(() => {
    const updateRole = db.prepare('UPDATE werewolf_players SET role = ? WHERE gameId = ? AND userId = ?');
    for (let index = 0; index < players.length; index++) updateRole.run(roles[index], game.id, players[index].userId);
    db.prepare(`UPDATE werewolf_games SET status = 'active', phase = 'night', round = 1, startedAt = ?, updatedAt = ?
      WHERE id = ? AND status = 'lobby'`).run(now, now, game.id);
  })();
  await updateLobby(client, game.id, true);
  await interaction.channel.send({ content: '🌙 **Đêm 1 bắt đầu.** Vai trò đã gửi riêng; hành động chọn qua menu DM.', allowedMentions: { parse: [] } });
  return interaction.editReply('✅ Game bắt đầu. Vai trò và menu hành động đã gửi qua DM.');
}

async function handleCreate(interaction) {
  const settings = getSettings(interaction.guild.id);
  if (!settings) return interaction.reply({ content: 'Quản trị viên cần chạy `/setup werewolf` trước.', ephemeral: true });
  if (interaction.channelId !== settings.channelId) return interaction.reply({ content: `Hãy tạo lobby trong <#${settings.channelId}>.`, ephemeral: true });
  let gameId;
  try {
    gameId = db.prepare(`INSERT INTO werewolf_games (guildId, channelId, hostId, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?)`).run(interaction.guild.id, interaction.channelId, interaction.user.id, Date.now(), Date.now()).lastInsertRowid;
  } catch {
    return interaction.reply({ content: 'Kênh đã có một game/lobby đang hoạt động.', ephemeral: true });
  }
  db.prepare('INSERT INTO werewolf_players (gameId, userId, role, joinedAt) VALUES (?, ?, ?, ?)').run(gameId, interaction.user.id, 'pending', Date.now());
  const game = db.prepare('SELECT * FROM werewolf_games WHERE id = ?').get(gameId);
  let message;
  try {
    message = await interaction.channel.send({ embeds: [lobbyEmbed(game)], components: [lobbyControls(game)], allowedMentions: { parse: [] } });
  } catch (error) {
    db.prepare("UPDATE werewolf_games SET status = 'cancelled', phase = 'finished', updatedAt = ? WHERE id = ? AND status = 'lobby'")
      .run(Date.now(), gameId);
    console.error('Không thể đăng lobby Ma Sói:', error.message);
    return interaction.reply({ content: 'Không thể đăng lobby trong kênh này. Hãy kiểm tra quyền gửi tin và embed của bot.', ephemeral: true });
  }
  db.prepare('UPDATE werewolf_games SET lobbyMessageId = ? WHERE id = ?').run(message.id, gameId);
  return interaction.reply({ content: `✅ Lobby #${gameId} đã tạo. Bấm nút **Tham gia** bên dưới để vào game.`, ephemeral: true });
}

async function handleLobbyButton(interaction, client, action, gameId) {
  const game = db.prepare('SELECT * FROM werewolf_games WHERE id = ?').get(gameId);
  if (!game || game.status !== 'lobby' || game.guildId !== interaction.guildId || game.channelId !== interaction.channelId) {
    return interaction.reply({ content: 'Lobby này đã đóng hoặc không thuộc kênh hiện tại.', ephemeral: true });
  }
  const player = db.prepare('SELECT 1 FROM werewolf_players WHERE gameId = ? AND userId = ?').get(gameId, interaction.user.id);
  if (action === 'join') {
    if (player) return interaction.reply({ content: 'Bạn đã ở trong lobby rồi.', ephemeral: true });
    const count = db.prepare('SELECT COUNT(*) AS count FROM werewolf_players WHERE gameId = ?').get(gameId).count;
    if (count >= MAX_PLAYERS) return interaction.reply({ content: `Lobby đủ ${MAX_PLAYERS} người rồi.`, ephemeral: true });
    db.prepare('INSERT INTO werewolf_players (gameId, userId, role, joinedAt) VALUES (?, ?, ?, ?)').run(gameId, interaction.user.id, 'pending', Date.now());
    await updateLobby(client, gameId);
    return interaction.reply({ content: `✅ Đã vào lobby #${gameId}.`, ephemeral: true });
  }
  if (action === 'leave') {
    if (!player) return interaction.reply({ content: 'Bạn chưa ở trong lobby này.', ephemeral: true });
    if (game.hostId === interaction.user.id) {
      db.prepare("UPDATE werewolf_games SET status = 'cancelled', phase = 'finished', updatedAt = ? WHERE id = ?").run(Date.now(), gameId);
      await updateLobby(client, gameId, true);
      return interaction.reply({ content: 'Lobby đã huỷ vì host rời game.', ephemeral: true });
    }
    db.prepare('DELETE FROM werewolf_players WHERE gameId = ? AND userId = ?').run(gameId, interaction.user.id);
    await updateLobby(client, gameId);
    return interaction.reply({ content: '✅ Đã rời lobby.', ephemeral: true });
  }
  if (action === 'cancel') {
    if (game.hostId !== interaction.user.id && !interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({ content: 'Chỉ host mới được huỷ lobby.', ephemeral: true });
    }
    db.prepare("UPDATE werewolf_games SET status = 'cancelled', phase = 'finished', updatedAt = ? WHERE id = ?").run(Date.now(), gameId);
    await updateLobby(client, gameId, true);
    return interaction.reply({ content: '✅ Lobby đã được huỷ.', ephemeral: true });
  }
  if (action === 'start') return startLobby(interaction, client, game);
  return interaction.reply({ content: 'Thao tác lobby không hợp lệ.', ephemeral: true });
}

async function handleAction(interaction, client, parts) {
  const [, , gameIdText, roundText, phase, action] = parts;
  const gameId = Number(gameIdText);
  const round = Number(roundText);
  const game = db.prepare('SELECT * FROM werewolf_games WHERE id = ?').get(gameId);
  if (!Number.isInteger(gameId) || !Number.isInteger(round) || !game || game.status !== 'active' || game.phase !== phase || game.round !== round) {
    return interaction.reply({ content: 'Hành động này đã hết hạn.', ephemeral: Boolean(interaction.guild) });
  }
  const player = db.prepare('SELECT * FROM werewolf_players WHERE gameId = ? AND userId = ? AND alive = 1').get(gameId, interaction.user.id);
  if (!player) return interaction.reply({ content: 'Bạn không phải người chơi còn sống trong game này.', ephemeral: Boolean(interaction.guild) });
  const allowed = action === 'vote' ? phase === 'day'
    : phase === 'night' && (action === 'kill' ? player.role === 'wolf' : action === 'inspect' ? player.role === 'seer' : action === 'protect' && player.role === 'guard');
  if (!allowed) return interaction.reply({ content: 'Vai trò của bạn không có hành động này.', ephemeral: Boolean(interaction.guild) });
  const targetId = interaction.values?.[0];
  const target = db.prepare('SELECT * FROM werewolf_players WHERE gameId = ? AND userId = ? AND alive = 1').get(gameId, targetId);
  if (!target || (targetId === interaction.user.id && action !== 'protect')) {
    return interaction.reply({ content: 'Mục tiêu không hợp lệ.', ephemeral: Boolean(interaction.guild) });
  }
  if (action === 'protect' && round > 1) {
    const prior = db.prepare(`SELECT targetId FROM werewolf_actions WHERE gameId = ? AND round = ? AND phase = 'night' AND userId = ? AND action = 'protect'`)
      .get(gameId, round - 1, interaction.user.id);
    if (prior?.targetId === targetId) return interaction.reply({ content: 'Không thể bảo vệ cùng một người hai đêm liên tiếp.', ephemeral: Boolean(interaction.guild) });
  }
  db.prepare(`INSERT INTO werewolf_actions (gameId, round, phase, userId, action, targetId, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT (gameId, round, phase, userId) DO UPDATE SET action = excluded.action, targetId = excluded.targetId, createdAt = excluded.createdAt`)
    .run(gameId, round, phase, interaction.user.id, action, targetId, Date.now());
  if (action === 'inspect') {
    await interaction.reply({ content: `<@${targetId}> thuộc phe **${target.role === 'wolf' ? 'Ma Sói' : 'Dân Làng'}**.`, ephemeral: Boolean(interaction.guild), allowedMentions: { parse: [] } });
  } else {
    await interaction.reply({ content: '✅ Hành động đã ghi nhận riêng tư.', ephemeral: Boolean(interaction.guild) });
  }
  const result = tryResolve(gameId);
  if (result) await publishResolution(client, result);
}

async function handleInteraction(interaction, client) {
  if (interaction.isButton()) {
    const parts = interaction.customId.split(':');
    if (parts[0] !== 'werewolf') return false;
    if (parts[1] === 'open') return handleCreate(interaction);
    return handleLobbyButton(interaction, client, parts[1], Number(parts[2]));
  }
  if (interaction.isStringSelectMenu() && interaction.customId.startsWith('werewolf:action:')) {
    return handleAction(interaction, client, interaction.customId.split(':'));
  }
  return false;
}

module.exports = { buildSetupPanel, postSetupPanel, handleInteraction };