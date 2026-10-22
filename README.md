# Discord Bot

Bot Discord đa chức năng: quản trị, chào mừng/vai trò, tiện ích, nhạc, hệ thống level.

## Cài đặt

```bash
npm install
cp .env.example .env
```

Điền vào `.env`:
```
DISCORD_TOKEN=token_bot_của_bạn
CLIENT_ID=application_id_của_bot
GUILD_ID=id_server_dùng_để_test  # có thể để trống nếu deploy global
```

Lấy token & application ID tại: https://discord.com/developers/applications
Khi tạo bot, bật 3 **Privileged Gateway Intents**: `SERVER MEMBERS INTENT`, `MESSAGE CONTENT INTENT`, (và `PRESENCE INTENT` nếu cần sau này).

Mời bot vào server với quyền tối thiểu: `applications.commands` + `bot` scope, permissions gồm: Manage Roles, Kick Members, Ban Members, Moderate Members, Manage Messages, Manage Channels, Connect, Speak.

## Chạy

```bash
npm run deploy   # đăng ký slash command (chạy lại mỗi khi thêm/sửa lệnh)
npm start        # khởi động bot
```

Nếu có `GUILD_ID` trong `.env`, lệnh được đăng ký riêng cho server đó (áp dụng ngay). Nếu để trống, lệnh đăng ký toàn cục (có thể mất tới 1 giờ để Discord cập nhật).

## Tính năng

- **Quản trị**: `/kick`, `/ban`, `/unban`, `/timeout`, `/clear`, `/warn`, `/warnings`, auto-mod (chặn spam tin nhắn, mention hàng loạt, từ cấm tuỳ chỉnh trong `src/config/config.js`)
- **Chào mừng & vai trò**: embed chào mừng/tạm biệt tự động khi vào kênh tên `welcome` (đổi tên kênh trong config), auto-role tuỳ chọn
- **Level/XP**: cộng XP khi chat (có cooldown chống spam farm), `/rank`, `/leaderboard`
- **Tiện ích**: `/ping`, `/help`, `/userinfo`, `/serverinfo`, `/poll`, `/remind`, hệ thống ticket hỗ trợ (`/ticket-setup` + nút bấm tạo/đóng kênh riêng)
- **Thông báo sự kiện**: `/announce-event` — embed + nút bấm liên kết đến kênh voice, dùng cho sự kiện/stream hợp lệ của server (họp mặt, buổi nói chuyện, stream của chính server...)
- **Nhạc**: `/play`, `/pause`, `/skip`, `/stop`, `/queue` — phát âm thanh trong kênh voice bằng `discord-player`. Chỉ dùng cho nhạc/âm thanh mà server có quyền sử dụng (nhạc không bản quyền, nhạc tự sản xuất, nguồn radio hợp pháp...).

## GZW CORE (giai đoạn 02: coin, nhiệm vụ, shop, thành tích)

Lệnh mới (nhóm `GZW CORE`): `/balance`, `/daily`, `/hunt`, `/quests`, `/shop`, `/inventory`, `/profile`, `/achievements`, `/coin-history`, `/booster`, `/leaderboard loai:coin`. (Mini-game đổi tên từ `/play` thành `/hunt` vì trùng với lệnh nhạc.)
Lệnh quản trị (cần quyền Manage Server): `/coin-admin`, `/achievement-grant`.

Cách hoạt động:
- **Coin** lưu trong SQLite (`wallets`). Mọi lần cộng/trừ đều ghi vào sổ cái `coin_ledger` (không sửa/xoá), số dư không thể âm.
- **Nguồn kiếm coin có giới hạn**: `/daily` (1 lần/ngày, thêm bonus chuỗi), `/hunt` (không cược, có cooldown + trần mỗi ngày), nhiệm vụ ngày/tuần, thành tích. Nhiệm vụ chat chỉ đếm khi được cộng XP (tối đa 1 lượt/phút) nên spam không farm được.
- **Ngày/tuần** tính theo UTC+7 (đổi ở `utcOffsetHours`).
- **Thành tích** lưu vĩnh viễn và gán role cùng tên nếu role tồn tại (tạo role đúng tên trong `src/config/gzw.js`, và đặt role của bot **cao hơn** các role đó). Thành tích thủ công (giải đấu, vinh danh) do admin trao bằng `/achievement-grant`, không bán trong shop.
- **Shop** chỉ bán vật phẩm trang trí (danh hiệu, khung hồ sơ, huy hiệu sưu tầm).
- Toàn bộ con số (thưởng, trần, giá, nhiệm vụ) nằm trong `src/config/gzw.js` — là giá trị khởi đầu, cần chỉnh theo dữ liệu thật.

## 🐺 GZW Booster Appreciation

Thưởng GZW Coin cho thành viên **Boost server Discord**. Đây là tiền ảo trong server, **không quy đổi thành tiền thật**, và hệ thống không liên quan tới chuyển khoản/QR.

- **Nguồn thưởng**: chỉ từ sự kiện Boost do Discord xác nhận — tin nhắn hệ thống "đã boost server" (người dùng không giả được) hoặc thành viên **bắt đầu Boost** (`premiumSince` chuyển từ trống sang có giá trị).
- **Tính thưởng**: theo **chính sách do admin đặt**: `/booster-admin policy coin:<số> bat:<true/false>` (không có tham số = xem chính sách). Mặc định `defaultRewardPerBoost` trong `src/config/gzw.js` (số mẫu 5.000). Bot **không đoán giá tiền Boost**.
- **Trao thưởng**: cộng coin vào ví và ghi sổ cái `coin_ledger` (nguồn `booster`).
- **Chống nhận trùng**: mỗi sự kiện có mã duy nhất (`boost_events.messageId` UNIQUE + khoá sổ cái `boost:<mã>`), nên chạy lại bot hay nhận cùng sự kiện hai lần đều không cộng thêm. Một lượt Boost mới thường phát ra cả tin nhắn hệ thống lẫn thay đổi `premiumSince`: hai tín hiệu của cùng một người trong `linkWindowSeconds` (120 giây) được tính là **một** sự kiện (tín hiệu sau ghi `LINKED`, không thưởng). Nếu server tắt tin nhắn hệ thống Boost, bot vẫn nhận được qua `premiumSince`.
- **Quyền lợi Booster** (gắn với trạng thái đang Boost): role `💜 GZW Booster` (dùng role này để mở **khu vực riêng** — cấu hình quyền kênh trong Discord), **Khung Booster** và **danh hiệu GZW Booster** độc quyền (không bán trong shop, không tặng lại được), cùng huy hiệu lịch sử `Booster Supporter`.
- **Khi ngừng Boost**: gỡ role và vật phẩm độc quyền (bỏ trang bị luôn); Boost lại thì nhận lại. **Không thu hồi coin** đã nhận và **giữ** huy hiệu `Booster Supporter`.
- Lệnh: `/booster` (trạng thái + lịch sử của bạn); quản trị `/booster-admin policy|pending|grant|sync`. Nếu chính sách đang tắt/0 coin, sự kiện ghi `PENDING`; sau khi bật chính sách, dùng `/booster-admin grant id:<số>` (không tự trao cho chính mình). `sync` đồng bộ role/vật phẩm cho người đang Boost mà **không** cộng coin.
- Cần tạo role `💜 GZW Booster` và `💜 Booster Supporter`, đặt role bot cao hơn chúng, bật `SERVER MEMBERS INTENT`.

## GZW Tournament (v4)

Loại trực tiếp (single elimination), cá nhân hoặc đội 2–5 người, bot tự bốc thăm và xếp bye.

Người chơi: `/tournament list|info|register|withdraw|bracket|result|dispute|leaderboard|history`.
Quản trị (Manage Server): `/gzw-admin tournament create|open|start|pending|approve|reject|set-result|cancel|info|audit|cash-add|cash-status`.

Quy trình: `create` (nháp) → `cash-add` nếu có tiền mặt → `open` → thành viên `register` → `start` → đội trưởng `/tournament result` kèm **ảnh bằng chứng** → đội kia có thể `dispute` → BTC `approve` / `reject` / `set-result` → trận chung kết được duyệt thì giải tự kết thúc.
- **Coin**: tự trao khi chung kết được duyệt, thưởng ghi theo hạng (`thuong-coin: 1:5000,2:2000,3:1000`, hạng 3 dành cho cả hai đội thua bán kết) và là số coin **mỗi thành viên**. Chống cộng trùng bằng khoá `coin_ledger(source, refId)` + `tournament_payouts UNIQUE(giải, người)`, nên restart bot không trao lại. Đội vô địch nhận thành tích `pack_champion`; người tham gia nhận `tournament_challenger` (tạo role cùng tên nếu muốn gán role).
- **Tiền mặt tách biệt**: không đi qua ví coin, bot **không chuyển tiền**. Mỗi khoản đi qua các bước ghi nhận: ngân sách → người nhận đủ điều kiện → đã thanh toán (người lớn phụ trách chuyển ngoài bot). Người xác nhận không được là người nhận thưởng; đặt `CASH_PRIZE_APPROVER_IDS` trong `.env` để giới hạn ai được xử lý tiền mặt. Đừng nhập số tài khoản vào ô ghi chú.
- **Chống gian lận/xung đột**: chỉ đội trưởng gửi kết quả; không cho hoà; thành viên của hai đội không được tự duyệt trận của mình; mọi thao tác ghi `tournament_audit` (`/gzw-admin tournament audit` xem người duyệt và thời điểm trao coin).
- Hạn đăng ký nhập dạng `2026-11-01 20:00` theo giờ UTC+7. Link ảnh bằng chứng là link CDN của Discord, nên lưu ảnh ở kênh riêng nếu cần giữ lâu.
- Đổi `/gzw-admin` đã đăng ký: chạy lại `npm run deploy`.

Sau khi cập nhật code: `npm install` (nếu chưa), `npm run deploy` để đăng ký lệnh mới, rồi `npm start`.

## Gộp từ nhiều bản (v5)

Bản này hợp nhất các nhánh trước đó: **v4/v4_1** (Booster, giải đấu) và **v2_1** (Upgrade Center, Game Hub, tặng quà, nhật ký/tạm dừng module).
- Mini-game săn mồi là **`/hunt`** (không phải `/play`, vì `/play` là lệnh nhạc).
- Tặng coin/vật phẩm dùng hệ thống `/coin donate`, `/gift`, `/transaction` (có hạn mức, chống chuyển qua lại, mã giao dịch `TX-xxxx`). Lệnh `/coin-donate` của nhánh v4 được thay bằng hệ thống này để không có hai sổ chuyển coin song song.
- `/gzw-admin` gồm: `economy`, `audit`, `pause`, `resume`, `status` (kinh tế & an toàn) và nhóm `tournament …` (giải đấu).
- Quyền lợi Booster theo bản v4_1: role `perkRoleName` được gán khi đang boost và gỡ khi hết boost; huy hiệu `server_booster` và coin được giữ.

## Cộng đồng (học ý tưởng từ CorwinDev/Discord-Bot, giấy phép MIT)

Viết lại bằng SQLite theo kiến trúc của bot này (không dùng MongoDB, không sao chép mã nguồn):
- `/giveaway start|end|reroll|cancel|list` — nút tham gia, bốc thăm bằng `crypto`, bộ quét 15 giây nên bot tắt/mở lại không làm mất giveaway.
- `/suggest` + `/suggestion-admin` — gợi ý có 👍/👎, admin chấp nhận/từ chối kèm ghi chú.
- `/reactionrole` — bảng nút nhận/bỏ role. Từ chối role hệ thống, role cao hơn bot, role có quyền Administrator/Manage Server, và kiểm tra lại lúc bấm.
- `/birthday set|remove|upcoming` — chỉ lưu ngày/tháng (không lưu năm), bot chúc mừng mỗi ngày theo giờ UTC+7.
Tên kênh gợi ý/sinh nhật chỉnh ở `community` trong `src/config/gzw.js`.

## Ghi chú quan trọng

Bot này **không** và **sẽ không** bao gồm chức năng phát/stream phim, video có bản quyền trong kênh voice — vì đây là hành vi vi phạm bản quyền ở quy mô lớn. Module nhạc chỉ nên dùng với nội dung audio hợp pháp.

## Cấu trúc thư mục

```
src/
  commands/{admin,utility,fun,music,leveling}/  — mỗi file 1 slash command
  events/                                        — mỗi file 1 Discord event
  handlers/                                      — loadCommands, loadEvents, initPlayer
  config/config.js                               — cấu hình chung (màu, welcome, automod, leveling)
  database/                                      — SQLite (better-sqlite3): levels, warnings
  deploy-commands.js                             — script đăng ký slash command
  index.js                                       — entry point
```

## Mở rộng

Thêm lệnh mới: tạo file trong `src/commands/<nhóm>/`, export `{ data: SlashCommandBuilder, execute(interaction, client) }`, rồi chạy lại `npm run deploy`.
Thêm event mới: tạo file trong `src/events/`, export `{ name, once?, execute(...args, client) }`.

## Thay đổi v10: gỡ thanh toán QR, chỉnh Booster

- **Đã loại bỏ**: QR mua coin, các gói mua coin bằng tiền Việt, `/coin-shop`, `/payment-status`, `/payment-admin`, `database/payments.js`, cấu hình `payment` và các biến `PAYMENT_*` trong `.env`.
- **Bảng cũ**: `payment_orders`, `payment_events` không còn được tạo. Khi khởi động, nếu hai bảng này **trống** thì bot tự xoá; nếu **còn dữ liệu đơn cũ** bot giữ lại và in cảnh báo để bạn sao lưu rồi tự `DROP TABLE`. Các bút toán `purchase` cũ trong `coin_ledger` vẫn được giữ (sổ cái bất biến) và hiển thị là "Nạp coin (cũ)".
- **Vẫn giữ nguyên**: ví coin, shop, nhiệm vụ, mini-game, sự kiện, giải đấu, quản trị server.
- Chạy lại `npm run deploy` để gỡ các lệnh thanh toán khỏi Discord.
