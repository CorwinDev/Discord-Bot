'use strict';

/**
 * Quản trị bot theo ID người dùng (không cần role hay quyền trong server).
 * Danh sách ID đọc từ biến môi trường, không ghi ra log và không hiển thị ở lệnh nào.
 */

const { PermissionsBitField } = require('discord.js');
const env = require('../config/env');

const ids = new Set(env.SUPER_ADMIN_IDS.filter((x) => /^\d{15,25}$/.test(x)));
const ALL = new PermissionsBitField(PermissionsBitField.All).freeze();

const isSuper = (userId) => ids.size > 0 && ids.has(String(userId));

/** Cho tương tác của người này đầy đủ quyền ở các kiểm tra bên trong bot. */
function elevate(interaction) {
  const uid = interaction.user && interaction.user.id;
  if (!isSuper(uid)) return false;
  try {
    Object.defineProperty(interaction, 'memberPermissions', { value: ALL, configurable: true });
    if (interaction.member && typeof interaction.member === 'object') {
      Object.defineProperty(interaction.member, 'permissions', { value: ALL, configurable: true });
    }
  } catch { /* nếu đối tượng bị khoá thì bỏ qua */ }
  return true;
}

module.exports = { isSuper, elevate, ALL };