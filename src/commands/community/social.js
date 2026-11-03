const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, MessageFlags } = require('discord.js');
const db = require('../../database/db');
const core = require('../../config/core');

const intents = [
  { name: 'Tình bạn', value: 'friendship' },
  { name: 'Hẹn hò', value: 'dating' },
  { name: 'Cả hai', value: 'both' }
];
const intentLabels = Object.fromEntries(intents.map((item) => [item.value, item.name]));

function nextProfile(guildId, userId) {
  return db.prepare(`SELECT profile.* FROM dating_profiles AS profile
    WHERE profile.guildId = ? AND profile.enabled = 1 AND profile.age >= 18 AND profile.userId != ?
      AND NOT EXISTS (
        SELECT 1 FROM dating_swipes AS swipe
        WHERE swipe.guildId = profile.guildId AND swipe.fromUserId = ? AND swipe.toUserId = profile.userId
      )
    ORDER BY RANDOM() LIMIT 1`).get(guildId, userId, userId);
}

function profileEmbed(profile, user) {
  const embed = new EmbedBuilder().setColor(core.brandColor).setTitle(`🌿 ${user.username}`)
    .setDescription(profile.bio)
    .addFields(
      { name: 'Tuổi tự xác nhận', value: String(profile.age), inline: true },
      { name: 'Đang tìm', value: intentLabels[profile.lookingFor], inline: true }
    );
  if (user.displayAvatarURL) embed.setThumbnail(user.displayAvatarURL({ size: 256 }));
  return embed;
}

async function browsePayload(interaction, client) {
  const profile = nextProfile(interaction.guildId, interaction.user.id);
  if (!profile) return { content: 'Chưa có hồ sơ mới để xem. Hãy quay lại sau nhé.', embeds: [], components: [] };

  const user = await client.users.fetch(profile.userId).catch(() => null);
  if (!user) return { content: 'Không thể tải hồ sơ này. Hãy thử lại sau.', embeds: [], components: [] };

  const buttons = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`dating:like:${profile.userId}`).setLabel('Thích').setEmoji('💚').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`dating:pass:${profile.userId}`).setLabel('Bỏ qua').setEmoji('➡️').setStyle(ButtonStyle.Secondary)
  );
  return { embeds: [profileEmbed(profile, user)], components: [buttons] };
}

function queueRandomMatch(guildId, userId) {
  const now = Date.now();
  return db.transaction(() => {
    db.prepare('DELETE FROM dating_match_queue WHERE guildId = ? AND queuedAt < ?').run(guildId, now - 30 * 60000);
    const queued = db.prepare('SELECT 1 FROM dating_match_queue WHERE guildId = ? AND userId = ?').get(guildId, userId);
    if (queued) {
      db.prepare('DELETE FROM dating_match_queue WHERE guildId = ? AND userId = ?').run(guildId, userId);
      return { state: 'cancelled' };
    }

    const candidate = db.prepare(`SELECT queue.userId FROM dating_match_queue AS queue
      JOIN dating_profiles AS profile ON profile.guildId = queue.guildId AND profile.userId = queue.userId
      WHERE queue.guildId = ? AND queue.userId != ? AND profile.enabled = 1 AND profile.age >= 18
      ORDER BY RANDOM() LIMIT 1`).get(guildId, userId);
    if (!candidate) {
      db.prepare('INSERT INTO dating_match_queue (guildId, userId, queuedAt) VALUES (?, ?, ?)')
        .run(guildId, userId, now);
      return { state: 'queued' };
    }

    db.prepare('DELETE FROM dating_match_queue WHERE guildId = ? AND userId IN (?, ?)')
      .run(guildId, userId, candidate.userId);
    const [userA, userB] = [userId, candidate.userId].sort();
    db.prepare('INSERT OR IGNORE INTO dating_matches (guildId, userA, userB, createdAt) VALUES (?, ?, ?, ?)')
      .run(guildId, userA, userB, now);
    return { state: 'matched', otherUserId: candidate.userId };
  })();
}

async function createMatchChat(guildId, userId, otherUserId, client) {
  const [userA, userB] = [userId, otherUserId].sort();
  const matched = db.prepare('SELECT 1 FROM dating_matches WHERE guildId = ? AND userA = ? AND userB = ?')
    .get(guildId, userA, userB);
  if (!matched) return { error: 'Chỉ có thể mở chat sau khi hai bạn đã match.' };

  const existing = db.prepare('SELECT * FROM dating_match_chats WHERE guildId = ? AND userA = ? AND userB = ?')
    .get(guildId, userA, userB);
  if (existing?.status === 'active' && existing.threadId) {
    const thread = await client.channels.fetch(existing.threadId).catch(() => null);
    if (thread?.isThread()) return { threadId: thread.id };
    db.prepare("UPDATE dating_match_chats SET status = 'failed', updatedAt = ? WHERE guildId = ? AND userA = ? AND userB = ?")
      .run(Date.now(), guildId, userA, userB);
  }
  if (existing?.status === 'creating' && existing.updatedAt > Date.now() - 5 * 60000) {
    return { error: 'Bot đang tạo chat riêng cho hai bạn, hãy thử lại sau ít phút.' };
  }

  const now = Date.now();
  db.prepare(`INSERT INTO dating_match_chats (guildId, userA, userB, status, createdAt, updatedAt)
    VALUES (?, ?, ?, 'creating', ?, ?)
    ON CONFLICT (guildId, userA, userB) DO UPDATE SET threadId = NULL, status = 'creating', updatedAt = excluded.updatedAt`)
    .run(guildId, userA, userB, now, now);

  let thread;
  try {
    const guild = await client.guilds.fetch(guildId);
    const settings = db.prepare('SELECT tinderChannelId FROM social_settings WHERE guildId = ?').get(guildId);
    const channel = settings
      ? guild.channels.cache.get(settings.tinderChannelId) || await guild.channels.fetch(settings.tinderChannelId).catch(() => null)
      : null;
    if (!channel?.threads) throw new Error('Kênh Tinder chưa được cấu hình hoặc không hỗ trợ private thread');
    thread = await channel.threads.create({
      name: `match-${userA.slice(-4)}-${userB.slice(-4)}`,
      type: ChannelType.PrivateThread,
      autoArchiveDuration: 1440,
      invitable: false,
      reason: 'Tạo chat riêng sau khi ghép đôi tự nguyện'
    });
    await thread.members.add(userA);
    await thread.members.add(userB);
    await thread.send({ content: '💚 Hai bạn đã được ghép đôi và có thể trò chuyện tại đây.', allowedMentions: { parse: [] } });
    db.prepare("UPDATE dating_match_chats SET threadId = ?, status = 'active', updatedAt = ? WHERE guildId = ? AND userA = ? AND userB = ?")
      .run(thread.id, Date.now(), guildId, userA, userB);
    return { threadId: thread.id };
  } catch (error) {
    if (thread) await thread.delete('Không thể hoàn tất chat sau ghép đôi').catch(() => {});
    db.prepare("UPDATE dating_match_chats SET status = 'failed', updatedAt = ? WHERE guildId = ? AND userA = ? AND userB = ?")
      .run(Date.now(), guildId, userA, userB);
    console.error('Không thể tạo chat sau ghép đôi:', error.message);
    return { error: 'Không tạo được private chat. Bot cần quyền Create Private Threads, Manage Threads và Send Messages in Threads.' };
  }
}

function chatLinkRow(guildId, threadId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setLabel('Mở chat riêng').setEmoji('💬').setStyle(ButtonStyle.Link)
      .setURL(`https://discord.com/channels/${guildId}/${threadId}`)
  );
}

module.exports = {
  group: 'Cộng đồng',
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('social')
    .setDescription('Hồ sơ tự nguyện, confession và feedback trong server')
    .setDMPermission(false)
    .addSubcommand((subcommand) => subcommand.setName('profile').setDescription('Tạo/cập nhật hồ sơ; chỉ dành cho người từ 18 tuổi')
      .addIntegerOption((option) => option.setName('tuoi').setDescription('Xác nhận tuổi của bạn').setRequired(true).setMinValue(18).setMaxValue(99))
      .addStringOption((option) => option.setName('gioi-thieu').setDescription('Giới thiệu ngắn').setRequired(true).setMinLength(10).setMaxLength(300))
      .addStringOption((option) => option.setName('tim-kiem').setDescription('Bạn đang tìm kiếm điều gì?').setRequired(true).addChoices(...intents)))
    .addSubcommand((subcommand) => subcommand.setName('discover').setDescription('Khám phá hồ sơ trong kênh đã cấu hình'))
    .addSubcommand((subcommand) => subcommand.setName('random').setDescription('Vào hàng chờ ghép đôi ngẫu nhiên; dùng lại để hủy'))
    .addSubcommand((subcommand) => subcommand.setName('match-chat').setDescription('Mở lại chat với người bạn đã match')
      .addUserOption((option) => option.setName('nguoi').setDescription('Người đã match với bạn').setRequired(true)))
    .addSubcommand((subcommand) => subcommand.setName('pause').setDescription('Tạm ẩn hồ sơ ghép đôi'))
    .addSubcommand((subcommand) => subcommand.setName('erase').setDescription('Xóa hồ sơ, lượt thích và kết nối của bạn'))
    .addSubcommand((subcommand) => subcommand.setName('confession').setDescription('Gửi confession ẩn danh')
      .addStringOption((option) => option.setName('noi-dung').setDescription('Nội dung confession').setRequired(true).setMinLength(5).setMaxLength(1500)))
    .addSubcommand((subcommand) => subcommand.setName('feedback').setDescription('Gửi feedback tới đội ngũ server')
      .addStringOption((option) => option.setName('noi-dung').setDescription('Nội dung feedback').setRequired(true).setMinLength(5).setMaxLength(1500))),

  async execute(interaction, client) {
    const guildId = interaction.guildId;
    const userId = interaction.user.id;
    const subcommand = interaction.options.getSubcommand();
    const replyPrivate = (content) => interaction.reply({ content, flags: MessageFlags.Ephemeral });

    if (subcommand === 'profile') {
      const age = interaction.options.getInteger('tuoi');
      const bio = interaction.options.getString('gioi-thieu').trim();
      const lookingFor = interaction.options.getString('tim-kiem');
      db.prepare(`INSERT INTO dating_profiles (guildId, userId, age, bio, lookingFor, enabled, consentedAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, 1, ?, ?)
        ON CONFLICT(guildId, userId) DO UPDATE SET age = excluded.age, bio = excluded.bio,
          lookingFor = excluded.lookingFor, enabled = 1, consentedAt = excluded.consentedAt, updatedAt = excluded.updatedAt`)
        .run(guildId, userId, age, bio, lookingFor, Date.now(), Date.now());
      return replyPrivate('✅ Hồ sơ đã bật riêng trong server này. Tuổi chỉ là xác nhận của bạn, không phải xác minh danh tính. Dùng `/social pause` để ẩn hoặc `/social erase` để xóa dữ liệu.');
    }

    if (subcommand === 'discover') {
      const settings = db.prepare('SELECT tinderChannelId FROM social_settings WHERE guildId = ?').get(guildId);
      if (!settings) return replyPrivate('Quản trị viên cần cấu hình kênh bằng `/setup social` trước.');
      if (interaction.channelId !== settings.tinderChannelId) {
        return replyPrivate(`Hãy dùng lệnh này trong <#${settings.tinderChannelId}>.`);
      }
      const profile = db.prepare('SELECT 1 FROM dating_profiles WHERE guildId = ? AND userId = ? AND age >= 18 AND enabled = 1').get(guildId, userId);
      if (!profile) return replyPrivate('Tạo hoặc bật hồ sơ bằng `/social profile` trước khi khám phá.');
      return interaction.reply({ ...(await browsePayload(interaction, client)), flags: MessageFlags.Ephemeral });
    }

    if (subcommand === 'random') {
      const settings = db.prepare('SELECT tinderChannelId FROM social_settings WHERE guildId = ?').get(guildId);
      if (!settings) return replyPrivate('Quản trị viên cần cấu hình kênh bằng `/setup social` trước.');
      if (interaction.channelId !== settings.tinderChannelId) return replyPrivate(`Hãy dùng lệnh này trong <#${settings.tinderChannelId}>.`);
      const profile = db.prepare('SELECT 1 FROM dating_profiles WHERE guildId = ? AND userId = ? AND age >= 18 AND enabled = 1')
        .get(guildId, userId);
      if (!profile) return replyPrivate('Tạo hoặc bật hồ sơ 18+ bằng `/social profile` trước khi tìm người.');

      const result = queueRandomMatch(guildId, userId);
      if (result.state === 'cancelled') return replyPrivate('Đã rời hàng chờ ghép đôi.');
      if (result.state === 'queued') return replyPrivate('Bạn đã vào hàng chờ. Khi có người khác cũng chủ động tìm, bot sẽ ghép hai bạn. Dùng `/social random` lần nữa để hủy.');

      const chat = await createMatchChat(guildId, userId, result.otherUserId, client);
      const other = await client.users.fetch(result.otherUserId).catch(() => null);
      if (chat.threadId) {
        const row = chatLinkRow(guildId, chat.threadId);
        await other?.send({ content: '💚 Bạn đã được ghép đôi với một thành viên đang tìm kết nối. Mở private chat trong server:', components: [row] }).catch(() => {});
        return interaction.reply({ content: `💚 Đã ghép đôi thành công${other ? ` với **${other.username}**` : ''}.`, components: [row], flags: MessageFlags.Ephemeral });
      }
      await other?.send('💚 Bạn đã được ghép đôi với một thành viên đang tìm kết nối. Chat riêng chưa mở được; hãy thử lại bằng `/social match-chat`.').catch(() => {});
      return replyPrivate(`💚 Đã ghép đôi${other ? ` với **${other.username}**` : ''}, nhưng ${chat.error || 'chat riêng chưa mở được'}`);
    }

    if (subcommand === 'match-chat') {
      const other = interaction.options.getUser('nguoi');
      if (other.id === userId) return replyPrivate('Hãy chọn người đã match với bạn.');
      const chat = await createMatchChat(guildId, userId, other.id, client);
      if (!chat.threadId) return replyPrivate(chat.error || 'Không thể mở chat riêng lúc này.');
      return interaction.reply({ content: 'Chat riêng của hai bạn đã sẵn sàng:', components: [chatLinkRow(guildId, chat.threadId)], flags: MessageFlags.Ephemeral });
    }

    if (subcommand === 'pause') {
      db.prepare('DELETE FROM dating_match_queue WHERE guildId = ? AND userId = ?').run(guildId, userId);
      const changed = db.prepare('UPDATE dating_profiles SET enabled = 0, updatedAt = ? WHERE guildId = ? AND userId = ?')
        .run(Date.now(), guildId, userId).changes;
      return replyPrivate(changed ? '✅ Hồ sơ đã được ẩn.' : 'Bạn chưa có hồ sơ ghép đôi.');
    }

    if (subcommand === 'erase') {
      const erase = db.transaction(() => {
        db.prepare('DELETE FROM dating_match_queue WHERE guildId = ? AND userId = ?').run(guildId, userId);
        db.prepare('DELETE FROM dating_match_chats WHERE guildId = ? AND (userA = ? OR userB = ?)').run(guildId, userId, userId);
        db.prepare('DELETE FROM dating_swipes WHERE guildId = ? AND (fromUserId = ? OR toUserId = ?)').run(guildId, userId, userId);
        db.prepare('DELETE FROM dating_matches WHERE guildId = ? AND (userA = ? OR userB = ?)').run(guildId, userId, userId);
        return db.prepare('DELETE FROM dating_profiles WHERE guildId = ? AND userId = ?').run(guildId, userId).changes;
      });
      const changed = erase();
      return replyPrivate(changed ? '✅ Hồ sơ, lượt thích/bỏ qua và kết nối đã được xóa khỏi server này.' : 'Bạn chưa có hồ sơ ghép đôi.');
    }

    const isConfession = subcommand === 'confession';
    const settings = db.prepare('SELECT confessionChannelId, feedbackChannelId FROM social_settings WHERE guildId = ?').get(guildId);
    const channelId = isConfession ? settings?.confessionChannelId : settings?.feedbackChannelId;
    const fallbackName = isConfession ? core.community.confessionChannelName : core.community.feedbackChannelName;
    const channel = channelId
      ? await interaction.guild.channels.fetch(channelId).catch(() => null)
      : interaction.guild.channels.cache.find((item) => item.name === fallbackName && item.isTextBased());
    if (!channel?.isTextBased()) return replyPrivate(`Chưa cấu hình kênh ${isConfession ? 'confession' : 'feedback'}. Hãy yêu cầu quản trị viên chạy "/setup social".`);

    const content = interaction.options.getString('noi-dung').trim();
    const embed = new EmbedBuilder().setColor(core.brandColor)
      .setTitle(isConfession ? '🕊️ Confession' : '📝 Feedback')
      .setDescription(content).setTimestamp();
    if (!isConfession) embed.setFooter({ text: `Gửi bởi ${interaction.user.username}` });
    await channel.send({ embeds: [embed], allowedMentions: { parse: [] } });
    return replyPrivate(isConfession ? '✅ Confession đã được gửi ẩn danh; bot không lưu ID người gửi.' : '✅ Feedback đã được gửi tới đội ngũ server.');
  },

  async handleButton(interaction, client) {
    const parts = interaction.customId.split(':');
    const action = parts[1];
    const targetId = parts[2];
    if (!['like', 'pass'].includes(action) || !/^\d{17,20}$/.test(targetId) || targetId === interaction.user.id) {
      return interaction.reply({ content: 'Lựa chọn này không hợp lệ.', flags: MessageFlags.Ephemeral });
    }

    const target = db.prepare('SELECT 1 FROM dating_profiles WHERE guildId = ? AND userId = ? AND age >= 18 AND enabled = 1')
      .get(interaction.guildId, targetId);
    if (!target) return interaction.update({ content: 'Hồ sơ này không còn khả dụng.', embeds: [], components: [] });

    const result = db.transaction(() => {
      const inserted = db.prepare(`INSERT OR IGNORE INTO dating_swipes (guildId, fromUserId, toUserId, action, createdAt)
        VALUES (?, ?, ?, ?, ?)`).run(interaction.guildId, interaction.user.id, targetId, action, Date.now()).changes;
      if (!inserted || action !== 'like') return { matched: false };

      const mutual = db.prepare(`SELECT 1 FROM dating_swipes
        WHERE guildId = ? AND fromUserId = ? AND toUserId = ? AND action = 'like'`)
        .get(interaction.guildId, targetId, interaction.user.id);
      if (!mutual) return { matched: false };

      const [userA, userB] = [interaction.user.id, targetId].sort();
      const matched = db.prepare('INSERT OR IGNORE INTO dating_matches (guildId, userA, userB, createdAt) VALUES (?, ?, ?, ?)')
        .run(interaction.guildId, userA, userB, Date.now()).changes > 0;
      return { matched };
    })();

    if (result.matched) {
      const other = await client.users.fetch(targetId).catch(() => null);
      await interaction.user.send(`💚 Hai bạn đã cùng thích nhau: <@${targetId}>. Chỉ hai người nhận được thông báo này.`).catch(() => {});
      await other?.send(`💚 Hai bạn đã cùng thích nhau: <@${interaction.user.id}>. Chỉ hai người nhận được thông báo này.`).catch(() => {});
    }

    const payload = await browsePayload(interaction, client);
    if (result.matched) payload.content = `💚 Ghép đôi thành công. ${payload.content || ''}`;
    else if (action === 'like') payload.content = `Đã gửi lượt thích. ${payload.content || ''}`;
    return interaction.update(payload);
  }
};