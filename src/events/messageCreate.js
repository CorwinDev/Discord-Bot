const { EmbedBuilder } = require('discord.js');
const config = require('../config/config');
const { addXp, canGainXp, xpForNextLevel } = require('../database/levels');
const eco = require('../database/economy');
const { checkAutoAchievements, flashNotice } = require('../services/gzwCore');
const gzw = require('../config/gzw');
const guard = require('../services/guard');
const { isInviteLink } = require('../services/guardRules');

// Theo dõi spam đơn giản trong bộ nhớ: Map<userId, number[]> (timestamps)
const messageLog = new Map();

function checkSpam(userId) {
  const now = Date.now();
  const timestamps = (messageLog.get(userId) || []).filter(t => now - t < config.automod.intervalMs);
  timestamps.push(now);
  messageLog.set(userId, timestamps);
  return timestamps.length > config.automod.maxMessagesPerInterval;
}

module.exports = {
  name: 'messageCreate',
  async execute(message, client) {
    if (message.author.bot || !message.guild || message.system) return;

    // ---- Auto-mod ----
    if (config.automod.enabled) {
      const member = message.member;
      const isModerator = member?.permissions?.has('ManageMessages');

      if (!isModerator) {
        let kind = null;
        if (message.mentions.users.size + message.mentions.roles.size > config.automod.maxMentions) kind = 'mention';
        else if (checkSpam(message.author.id)) kind = 'spam';
        else if (config.automod.bannedWords.some((w) => message.content.toLowerCase().includes(w))) kind = 'word';
        else if (config.automod.blockInvites && isInviteLink(message.content)) kind = 'invite';
        if (kind) return guard.violation(message, kind);
      }
    }

    // ---- Leveling / XP ----
    if (config.leveling.enabled && canGainXp(message.guild.id, message.author.id, config.leveling.cooldownSeconds)) {
      const [min, max] = config.leveling.xpPerMessage;
      const amount = Math.floor(Math.random() * (max - min + 1)) + min;
      const { leveledUp, newLevel } = addXp(message.guild.id, message.author.id, amount);

      if (leveledUp) {
        const embed = new EmbedBuilder()
          .setColor(config.colors.success)
          .setDescription(`🎉 ${message.author} đã lên **cấp ${newLevel}**!`);
        message.channel.send({ embeds: [embed] }).catch(() => {});
      }

      // ---- GZW CORE: nhiệm vụ chat + thành tích ----
      // Chỉ đếm khi được cộng XP (tối đa 1 lượt/cooldown) để chat spam không farm được nhiệm vụ.
      try {
        const completed = eco.progressQuests(message.guild.id, message.author.id, 'message', 1);
        for (const q of completed) {
          flashNotice(message.channel, `✅ ${message.author} hoàn thành nhiệm vụ **${q.name}** · +${q.reward} ${gzw.currency.emoji}`);
        }
        const earned = await checkAutoAchievements(message.guild, message.author.id, { level: newLevel });
        for (const a of earned) {
          flashNotice(message.channel, `🏅 ${message.author} đạt thành tích **${a.name}**${a.reward ? ` · +${a.reward} ${gzw.currency.emoji}` : ''}`, 15000);
        }
      } catch (err) {
        console.error('⚠️  Lỗi GZW CORE (messageCreate):', err);
      }
    }
  }
};
