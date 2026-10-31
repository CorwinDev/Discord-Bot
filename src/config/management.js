/**
 * GZW Management + Booster — cấu hình. Tên role/kênh khớp theo TÊN (giống phần còn lại của bot).
 */
module.exports = {
  // Vai trò nhân sự -> năng lực. Nguyên tắc ít quyền nhất: không nhóm nào mặc định có 'economy' ngoài Alpha / Economy Manager.
  staffRoles: {
    'Alpha Wolf':      { rank: 100, caps: ['admin', 'mod', 'support', 'events', 'economy', 'audit'] },
    'Guardian Wolf':   { rank: 80,  caps: ['admin', 'mod', 'support', 'events', 'audit'] },
    'Hunter Wolf':     { rank: 60,  caps: ['mod'] },
    'Healer Wolf':     { rank: 50,  caps: ['support'] },
    'Spirit Wolf':     { rank: 40,  caps: ['events'] },
    'Economy Manager': { rank: 30,  caps: ['economy'] },
    'Auditor':         { rank: 20,  caps: ['audit'] }
  },
  // Quyền Discord -> năng lực (chủ server / Administrator luôn có tất cả)
  discordPermCaps: { ManageGuild: ['admin', 'economy', 'audit'], ModerateMembers: ['mod'] },

  channels: {
    modLog: 'mod-log',
    reports: 'mod-log',
    eventAnnounce: 'events'
  },
  ticketCategoryName: 'Tickets', // (tuỳ chọn) tên danh mục Discord để đặt kênh ticket, nếu không có thì để ngoài danh mục

  ticketCategories: [
    { id: 'report',  label: 'Báo cáo vi phạm',            emoji: '🚨' },
    { id: 'appeal',  label: 'Khiếu nại quyết định',       emoji: '⚖️' },
    { id: 'bug',     label: 'Lỗi bot / giao dịch coin',   emoji: '🐞' },
    { id: 'item',    label: 'Hỗ trợ vật phẩm & nâng cấp', emoji: '🛒' },
    { id: 'event',   label: 'Sự kiện',                    emoji: '🎉' },
    { id: 'feedback',label: 'Góp ý cho server',           emoji: '💡' }
  ],

  // Quyền Discord KHÔNG được phép có trong role menu (chống leo thang quyền)
  dangerousPerms: [
    'Administrator', 'ManageGuild', 'ManageRoles', 'ManageChannels', 'KickMembers', 'BanMembers',
    'ModerateMembers', 'ManageMessages', 'ManageWebhooks', 'MentionEveryone', 'ManageNicknames', 'ViewAuditLog'
  ],

  modLimits: { maxTimeoutMinutes: 40320, confirmAboveMinutes: 1440 }
};
