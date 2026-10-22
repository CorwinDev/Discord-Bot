/**
 * GZW CORE — cấu hình kinh tế, nhiệm vụ, thành tích và shop.
 * Mọi con số ở đây là GIÁ TRỊ KHỞI ĐẦU để thử nghiệm, hãy chỉnh sau khi quan sát
 * dữ liệu thật (coin kiếm ra / tiêu đi mỗi ngày) để tránh lạm phát.
 */
require('dotenv').config();

module.exports = {
  brandColor: 0x8b5cf6, // tím GZW
  currency: { name: 'GZW Coin', emoji: '🪙' },


  /**
   * Booster Appreciation — thưởng coin cho lượt Boost server Discord ĐÃ XÁC MINH.
   * - Chỉ tính khi có sự kiện Boost hợp lệ từ Discord (tin nhắn hệ thống Boost, hoặc thành viên bắt đầu Boost).
   * - Số coin theo CHÍNH SÁCH do admin đặt (/booster-admin policy), không phụ thuộc chuyển khoản/QR
   *   và bot không đoán giá tiền Boost. Giá trị dưới đây là mặc định khi admin chưa đặt (đặt 0 = tắt, sự kiện chờ admin).
   * - Mỗi sự kiện chỉ được thưởng một lần (khoá sổ cái boost:<mã sự kiện>).
   * - GZW Coin là tiền ảo trong server, không quy đổi thành tiền thật.
   */
  booster: {
    defaultRewardPerBoost: 5000, // coin cho MỖI lượt Boost (số mẫu, hãy chỉnh bằng /booster-admin policy)
    maxRewardPerBoost: 100000,   // trần an toàn khi admin nhập chính sách
    linkWindowSeconds: 120,      // hai tín hiệu (tin nhắn + bắt đầu Boost) trong khoảng này được coi là CÙNG một sự kiện

    // Quyền lợi gắn với TRẠNG THÁI Boost: gỡ khi ngừng Boost, cấp lại khi Boost lại.
    // perkRoleName: dùng role này để mở kênh/khu vực dành riêng cho Booster (cấu hình quyền kênh trong Discord). null = không dùng.
    perkRoleName: '💜 GZW Booster',
    // Vật phẩm độc quyền (không bán trong shop, không tặng lại được); bị gỡ khỏi kho khi ngừng Boost.
    perkItems: [
      { id: 'frame_booster', type: 'frame', name: 'Khung Booster', emoji: '💜', desc: 'Khung hồ sơ độc quyền cho Booster', color: 0xf472d0, tradable: false, boosterPerk: true },
      { id: 'title_booster', type: 'title', name: 'GZW Booster', emoji: '🚀', desc: 'Danh hiệu độc quyền cho Booster', tradable: false, boosterPerk: true }
    ],
    // Huy hiệu ghi nhận lịch sử hỗ trợ (achievement) — được GIỮ vĩnh viễn kể cả khi ngừng Boost.
    badgeAchievementId: 'server_booster'
  },

  /**
   * GZW Tournament. Coin thưởng giải đấu do bot trao tự động sau khi kết quả cuối được duyệt.
   * Giải thưởng TIỀN MẶT không đi qua ví coin: bot chỉ ghi trạng thái (xem tournament_cash_prizes).
   */
  tournament: {
    maxEntrantsLimit: 64,
    maxTeamSize: 5,
    maxCoinPrizePerMember: 100000, // trần an toàn khi tạo giải
    participationAchievementId: 'tournament_challenger',
    championAchievementId: 'pack_champion'
  },

  // Múi giờ dùng để chia "ngày" cho daily/quest/giới hạn: UTC+7 (Việt Nam)
  utcOffsetHours: 7,

  daily: {
    base: 50,
    streakBonusPerDay: 10, // cộng thêm mỗi ngày liên tiếp
    streakCapDays: 7       // tối đa tính bonus 7 ngày
  },

  // Mini-game KHÔNG cược coin (không mất coin để chơi) — chỉ có thưởng, có cooldown và trần mỗi ngày.
  play: {
    cooldownSeconds: 300,
    rewardRange: [8, 30],
    doubleChance: 0.15,    // xác suất nhân đôi phần thưởng
    dailyCap: 300          // tổng coin tối đa từ /hunt mỗi ngày
  },

  // Nhiệm vụ: event = loại hành động được đếm; period = daily | weekly
  quests: [
    { id: 'd_chat',  period: 'daily',  event: 'message', target: 15, reward: 40,  name: 'Trò chuyện 15 lượt (tính tối đa 1 lượt/phút)' },
    { id: 'd_play',  period: 'daily',  event: 'play',    target: 3,  reward: 30,  name: 'Chơi /hunt 3 lần' },
    { id: 'd_daily', period: 'daily',  event: 'daily',   target: 1,  reward: 20,  name: 'Nhận thưởng /daily' },
    { id: 'w_chat',  period: 'weekly', event: 'message', target: 120, reward: 150, name: 'Trò chuyện 120 lượt trong tuần' },
    { id: 'w_play',  period: 'weekly', event: 'play',    target: 15, reward: 120, name: 'Chơi /hunt 15 lần trong tuần' }
  ],

  /**
   * Thành tích: được lưu vĩnh viễn trong DB (không mất khi hết mùa) và gán role cùng tên nếu role tồn tại.
   * auto:true  -> bot tự cấp khi đủ điều kiện.
   * auto:false -> chỉ admin cấp bằng /achievement-grant (giải đấu, vinh danh...). KHÔNG bán trong shop.
   */
  achievements: [
    { id: 'scout_wolf',     role: '🐾 Scout Wolf',      name: 'Scout Wolf',      auto: true,  rule: 'firstQuest',   reward: 100,  desc: 'Hoàn thành nhiệm vụ đầu tiên' },
    { id: 'oracle_wolf',    role: '🔮 Oracle Wolf',     name: 'Oracle Wolf',     auto: true,  rule: 'predictions',  value: 10, reward: 0,    desc: 'Dự đoán đúng 10 trận (miễn phí, không đặt coin)' },
    { id: 'supporter_wolf', role: '📣 Supporter Wolf',  name: 'Supporter Wolf',  auto: true,  rule: 'supporter',    value: 10, reward: 0,    desc: 'Cổ vũ hoặc tặng quà cho người khác 10 lần' },
    { id: 'duelist_wolf',   role: '🗡️ Duelist Wolf',    name: 'Duelist Wolf',    auto: true,  rule: 'duels',        value: 5,  reward: 150,  desc: 'Hoàn thành 5 trận duel' },
    { id: 'alpha_hunter',   role: '⚔️ Alpha Hunter',    name: 'Alpha Hunter',    auto: true,  rule: 'level', value: 10, reward: 300,  desc: 'Đạt cấp 10' },
    { id: 'apex_wolf',      role: '👑 Apex Wolf',       name: 'Apex Wolf',       auto: true,  rule: 'level', value: 30, reward: 1000, desc: 'Đạt cấp 30' },
    { id: 'server_booster',  role: '💜 Booster Supporter', name: 'Booster Supporter', auto: false, reward: 0, desc: 'Đã hỗ trợ server bằng Boost (giữ lại vĩnh viễn)' },
    { id: 'tournament_challenger', role: '🎯 Tournament Challenger', name: 'Tournament Challenger', auto: false, reward: 0, desc: 'Đã tham gia một giải đấu GZW' },
    { id: 'pack_champion',  role: '🏅 Pack Champion',   name: 'Pack Champion',   auto: false, reward: 0,    desc: 'Chiến thắng giải đấu hoặc thử thách' },
    { id: 'legend_of_gzw',  role: '🌠 Legend of GZW',   name: 'Legend of GZW',   auto: false, reward: 0,    desc: 'Danh hiệu vinh danh đặc biệt' },
    { id: 'founders_honor', role: '🐺 Founder’s Honor', name: 'Founder’s Honor', auto: false, reward: 0,    desc: 'Đóng góp nổi bật được xác nhận' }
  ],

  /**
   * Shop coin: CHỈ vật phẩm trang trí. Không bán quyền quản trị, không bán thành tích.
   * type: title (danh hiệu hiển thị ở hồ sơ) | frame (màu khung hồ sơ) | badge (huy hiệu sưu tầm)
   */
  shop: [
    { id: 'title_night_runner', type: 'title', name: 'Night Runner',   emoji: '🌙', price: 400,  desc: 'Danh hiệu trang trí', tradable: true },
    { id: 'title_moon_howler',  type: 'title', name: 'Moon Howler',    emoji: '🐺', price: 600,  desc: 'Danh hiệu trang trí', tradable: true },
    { id: 'title_silver_fang',  type: 'title', name: 'Silver Fang',    emoji: '🦷', price: 900,  desc: 'Danh hiệu trang trí', tradable: true },
    { id: 'frame_violet',       type: 'frame', name: 'Khung Tím Đêm',  emoji: '🟣', price: 500,  desc: 'Đổi màu khung hồ sơ', color: 0x8b5cf6, tradable: true },
    { id: 'frame_ice',          type: 'frame', name: 'Khung Băng',     emoji: '🔷', price: 500,  desc: 'Đổi màu khung hồ sơ', color: 0x6fd8e8, tradable: true },
    { id: 'frame_amber',        type: 'frame', name: 'Khung Hổ Phách', emoji: '🟠', price: 500,  desc: 'Đổi màu khung hồ sơ', color: 0xe8a24d, tradable: true },
    { id: 'badge_collector_s1', type: 'badge', name: 'Sưu tầm Mùa 1',  emoji: '✨', price: 300,  desc: 'Huy hiệu sưu tầm (không phải thành tích)', tradable: false }
  ],

  /**
   * Upgrade Center — nâng cấp vĩnh viễn, giá tăng dần theo cấp.
   * Lợi ích cố ý nhỏ (tiện ích / trưng bày), không tạo lợi thế thắng trong game.
   * branch: Hồ sơ | Sưu tầm | Tiện ích | Tiến trình (nhãn hiển thị)
   * costs[i] = giá lên cấp i+1; minPlayerLevel[i] = cấp chat tối thiểu để lên cấp i+1.
   */
  upgrades: [
    {
      id: 'showcase', branch: 'Sưu tầm', emoji: '🗃️', name: 'Ô trưng bày',
      desc: 'Số huy hiệu sưu tầm hiển thị trên hồ sơ', base: 2, perLevel: 1, unit: 'ô',
      costs: [200, 400, 700, 1100], minPlayerLevel: [0, 3, 5, 8]
    },
    {
      id: 'daily_bonus', branch: 'Tiện ích', emoji: '🎁', name: 'Quà chăm chỉ',
      desc: 'Cộng thêm coin mỗi lần nhận /daily', base: 0, perLevel: 5, unit: 'coin/daily',
      costs: [300, 600, 1000, 1600, 2400], minPlayerLevel: [0, 2, 4, 6, 10]
    },
    {
      id: 'game_cap', branch: 'Tiến trình', emoji: '📈', name: 'Sức bền thợ săn',
      desc: 'Tăng trần coin nhận từ mini-game mỗi ngày (/hunt)', base: 0, perLevel: 20, unit: 'coin/ngày',
      costs: [400, 800, 1400, 2200], minPlayerLevel: [1, 3, 6, 9]
    }
  ],

  // Hạn mức an toàn cho tặng coin / vật phẩm (mọi con số có thể chỉnh)
  transfer: {
    minAmount: 10,
    maxPerTx: 2000,
    dailySentCap: 5000,      // tổng coin gửi tối đa mỗi ngày
    dailyTxCap: 10,          // số giao dịch tặng (coin + vật phẩm) tối đa mỗi ngày
    minSenderLevel: 1,       // cấp chat tối thiểu để gửi (chống tài khoản phụ mới tạo)
    reciprocalWindowHours: 24, // chặn A gửi B nếu B đã gửi A trong khoảng này (chống farm qua lại)
    spectatorGift: 20        // số coin của nút "Tặng" khi xem trận
  },

  // Module có thể bị admin tạm dừng bằng /gzw-admin pause
  modules: ['play', 'games', 'shop', 'upgrade', 'transfer'],

  selfPauseChoices: [
    { name: '1 giờ', hours: 1 }, { name: '24 giờ', hours: 24 }, { name: '3 ngày', hours: 72 }, { name: '7 ngày', hours: 168 }
  ],

  // Game Hub
  games: {
    soloCooldownSeconds: 90,
    soloReward: 25,
    soloDailyCap: 200,
    soloTimeSeconds: 20,
    duel: {
      rounds: 3,               // số câu; thắng khi dẫn điểm không thể bị đuổi kịp
      roundSeconds: 20,
      acceptSeconds: 60,
      winnerReward: 40,
      loserReward: 10,
      dailyRewardCap: 200,     // tổng coin duel mỗi người mỗi ngày
      pairRewardedPerDay: 3,   // cùng một cặp chỉ được thưởng tối đa N trận/ngày (chống bắt tay farm)
      cooldownSeconds: 120     // thời gian chờ giữa 2 lần thách đấu của cùng một người
    },
    predictionBadgeNeeded: 10
  },

  // Tính năng cộng đồng (giveaway / gợi ý / sinh nhật). Tên kênh có thể đổi; không có kênh thì dùng kênh hiện tại / kênh hệ thống.
  community: {
    suggestionChannelName: 'goi-y',
    birthdayChannelName: 'sinh-nhat',
    maxWinners: 10,
    maxGiveawayDays: 30
  },

  // Ngân hàng câu hỏi quiz (đáp án đúng nằm ở vị trí `a`, bot xáo trộn khi hiển thị)
  questions: [
    { q: 'Thủ đô của Nhật Bản là gì?', o: ['Tokyo', 'Kyoto', 'Osaka', 'Nagoya'], a: 0 },
    { q: 'Hành tinh nào lớn nhất Hệ Mặt Trời?', o: ['Sao Mộc', 'Sao Thổ', 'Trái Đất', 'Sao Hải Vương'], a: 0 },
    { q: 'Ký hiệu hoá học của vàng là gì?', o: ['Au', 'Ag', 'Gd', 'Go'], a: 0 },
    { q: 'Trên bàn cờ vua có bao nhiêu ô?', o: ['64', '56', '72', '81'], a: 0 },
    { q: 'Số nguyên tố nhỏ nhất là số nào?', o: ['2', '1', '3', '0'], a: 0 },
    { q: '2 mũ 10 bằng bao nhiêu?', o: ['1024', '512', '2048', '1000'], a: 0 },
    { q: 'Căn bậc hai của 144 là?', o: ['12', '14', '16', '11'], a: 0 },
    { q: 'Tác giả của Truyện Kiều là ai?', o: ['Nguyễn Du', 'Nguyễn Trãi', 'Hồ Xuân Hương', 'Nguyễn Đình Chiểu'], a: 0 },
    { q: 'Quốc khánh Việt Nam là ngày nào?', o: ['2/9', '30/4', '19/5', '20/11'], a: 0 },
    { q: 'Một năm nhuận có bao nhiêu ngày?', o: ['366', '365', '364', '367'], a: 0 },
    { q: 'HTML là viết tắt của cụm từ nào?', o: ['HyperText Markup Language', 'High Text Machine Language', 'Hyper Tool Make Language', 'Home Text Markup Level'], a: 0 },
    { q: 'Kim loại nào ở thể lỏng tại nhiệt độ phòng?', o: ['Thuỷ ngân', 'Sắt', 'Đồng', 'Nhôm'], a: 0 },
    { q: 'Thủ đô của Hàn Quốc là?', o: ['Seoul', 'Busan', 'Incheon', 'Daegu'], a: 0 },
    { q: 'Quân cờ vua nào chỉ di chuyển theo đường chéo?', o: ['Tượng', 'Xe', 'Mã', 'Tốt'], a: 0 },
    { q: 'Đội tuyển nào vô địch World Cup 2022?', o: ['Argentina', 'Pháp', 'Brazil', 'Croatia'], a: 0 },
    { q: 'Pokémon hệ điện nổi tiếng nhất trong anime là?', o: ['Pikachu', 'Charmander', 'Squirtle', 'Bulbasaur'], a: 0 },
    { q: 'Minecraft ban đầu do studio nào phát triển?', o: ['Mojang', 'Valve', 'Riot Games', 'Epic Games'], a: 0 },
    { q: 'Discord ra mắt lần đầu vào năm nào?', o: ['2015', '2010', '2012', '2018'], a: 0 },
    { q: '7 nhân 8 bằng bao nhiêu?', o: ['56', '54', '48', '64'], a: 0 },
    { q: 'Đại dương nào lớn nhất thế giới?', o: ['Thái Bình Dương', 'Đại Tây Dương', 'Ấn Độ Dương', 'Bắc Băng Dương'], a: 0 }
  ]
};
