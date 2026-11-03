# Discord Bot

Bot Discord viết bằng Node.js và discord.js, dùng SQLite để lưu dữ liệu. Các nhóm tính năng gồm quản trị server, cộng đồng, game, hoạt động thành viên và kinh tế ảo.

## Yêu cầu

- Node.js 20 trở lên
- npm
- Ứng dụng bot được tạo tại [Discord Developer Portal](https://discord.com/developers/applications)

## Cài đặt

```bash
git clone https://github.com/ngdgnam/Discord-Bot.git
cd Discord-Bot
npm install
```

Thiết lập các biến môi trường dưới đây trong hosting, Docker hoặc file `.env` cục bộ:

```dotenv
DISCORD_TOKEN=token-cua-bot
CLIENT_ID=id-ung-dung-discord
GUILD_ID=id-server-thu-nghiem
```

`GUILD_ID` là tùy chọn. Có giá trị này thì slash command được đăng ký cho server thử nghiệm; bỏ trống để đăng ký command toàn cục. Không chia sẻ hoặc commit `.env`.

Trong Developer Portal, bật **Server Members Intent** và **Message Content Intent**. Bot cũng cần được mời với scope `bot` và `applications.commands`. Chỉ cấp thêm quyền Discord theo tính năng sử dụng, ví dụ Manage Messages cho kiểm duyệt, Manage Roles cho role, và quyền gửi tin/embed ở các kênh đã cấu hình.

## Chạy bot

```bash
npm run deploy  # đăng ký slash command; chạy lại sau khi command thay đổi
npm start       # chạy bot
```

Khi phát triển, dùng `npm run dev` để chạy chế độ theo dõi file. Command đăng ký theo server thường cập nhật ngay; command toàn cục có thể cần thời gian để Discord đồng bộ.

## Cập nhật gần đây

- **Tinder và ghép đôi:** thêm hồ sơ tự nguyện 18+, khám phá hồ sơ, hàng chờ ghép ngẫu nhiên và private chat sau khi hai người được ghép. Có thể tạm ẩn hoặc xóa hồ sơ.
- **Confession và feedback:** gửi confession ẩn danh tới kênh đã cấu hình hoặc gửi feedback cho đội ngũ server.
- **Thống kê chat/voice:** lưu số lượng tin nhắn và thời lượng tham gia voice theo tổng/ngày/tuần; thêm lựa chọn Chat và Voice cho `/leaderboard`. Không lưu nội dung tin nhắn.
- **Ma Sói:** thêm lobby 5–16 người, chia vai trò qua DM, hành động ban đêm và bỏ phiếu ban ngày.
- **Giám sát và tự khôi phục:** thêm dashboard trạng thái, báo lỗi qua webhook, backup SQLite và supervisor tự khởi động lại khi tiến trình gặp sự cố.
- **Bỏ thanh toán cũ:** loại bỏ luồng donate/SePay; vẫn giữ ví GZW Coin và sổ cái giao dịch.
- **Các file chính:** `src/commands/community/social.js`, `src/commands/community/setup.js`, `src/database/activity.js`, `src/events/voiceStateUpdate.js`, `src/events/werewolfInteractions.js`, `src/services/werewolf.js`, `src/monitor/`, `src/supervisor.js`.

## Cấu hình bằng biến môi trường (không cần file `.env`)

Bot đọc cấu hình trực tiếp từ **biến môi trường** của nơi chạy bot, nên token không phải nằm trong file nào của dự án:

| Nơi chạy | Cách đặt biến |
| --- | --- |
| Hosting (Replit, Railway, Render, Fly, Pterodactyl...) | Mục **Secrets / Variables / Environment** trên giao diện của hosting |
| Docker | `docker run -e DISCORD_TOKEN=... -p 3000:3000 ...` hoặc `environment:` trong docker-compose |
| Docker/Kubernetes secrets | `DISCORD_TOKEN_FILE=/run/secrets/discord_token` (bot đọc nội dung file) |
| Linux/macOS | `export DISCORD_TOKEN=...` |
| Windows | `setx DISCORD_TOKEN "..."` rồi mở lại terminal |

File `.env` vẫn dùng được khi chạy trên máy cá nhân, nhưng biến môi trường thật luôn được ưu tiên và không còn bắt buộc.

| Biến | Bắt buộc | Ý nghĩa |
| --- | --- | --- |
| `DISCORD_TOKEN` | Có | Token bot |
| `CLIENT_ID`, `GUILD_ID` | Khi deploy lệnh | Như hướng dẫn ở trên |
| `CASH_PRIZE_APPROVER_IDS` | Không | Như cũ |
| `ERROR_WEBHOOK_URL` | Không | Webhook Discord nhận thông báo lỗi/ngắt kết nối |
| `ALERT_MENTION_USER_ID` | Không | ID người được ping khi sự cố nghiêm trọng |
| `DASHBOARD_TOKEN` | Không | Mật khẩu xem web trạng thái (không đặt = trang công khai, chỉ hiện thông tin tổng quát) |
| `PORT` | Không | Cổng web trạng thái (mặc định 3000) |
| `AUTO_FIX` | Không | `true` (mặc định) hoặc `false` để tắt tự khắc phục |
| `RECOVERY_GRACE_SECONDS`, `RECOVERY_MAX_ATTEMPTS` | Không | Sau bao lâu mất kết nối thì chủ động đăng nhập lại (120s), số lần thử tối đa trước khi thoát (5) |
| `MAX_MEMORY_MB` | Không | Vượt ngưỡng RAM này thì tự khởi động lại (0 = tắt) |

 Nếu mất mạng, tin được giữ lại và gửi bù khi có mạng trở lại (ghi chú "gửi trễ"). URL webhook dán thừa dấu nháy hoặc dấu `/` cuối vẫn được chấp nhận.

**Báo cáo định kỳ (mặc định 5 phút/lần).** Dù không có lỗi, bot vẫn gửi một báo cáo gồm: kết luận (✅/🟡/🔴), các lỗi/cảnh báo đã gộp kèm lý do và giờ xảy ra, lý do và giờ mất kết nối gần nhất, độ trễ mạng tới Discord API và Internet (trung bình/cao nhất/số lần lỗi), tốc độ bot (ping gateway thấp/TB/cao, thời gian xử lý lệnh, độ trễ vòng lặp), CPU/RAM, tình trạng database, tổng giờ online, backup, và mốc thời gian báo cáo (khoảng đo, lần báo kế tiếp). Khi mất kết nối quá 20 giây, bot đo mạng ngay và báo luôn là do **mất Internet**, **Discord API không tới được**, hay **lỗi WebSocket/gateway**.
| `HIGH_PING_MS`, `CAPTURE_CONSOLE_ERRORS`, `DASHBOARD_ENABLED`, `HOST` | Không | Ngưỡng cảnh báo ping (1500), gửi `console.error` lên webhook (`true`), bật/tắt web, địa chỉ bind |

## Giám sát, thông báo lỗi và tự khắc phục (`src/monitor/`)

**Thông báo qua webhook.** Tạo webhook ở *Cài đặt kênh → Tích hợp → Webhook*, đặt URL vào `ERROR_WEBHOOK_URL`, rồi chạy `npm run webhook:test` để thử. Bot sẽ báo: khởi động / khởi động lại, mất kết nối và đã kết nối lại, lỗi WebSocket, ping cao, rate limit toàn cục, database lỗi, lỗi nghiêm trọng, và mọi `console.error` của bot (lỗi lệnh, lỗi event, unhandled rejection). Thông báo trùng được gộp, token và URL webhook luôn bị che.

**Tự khắc phục.**
1. discord.js tự reconnect/resume như bình thường.
2. Mất kết nối quá 20 giây: báo webhook. Quá `RECOVERY_GRACE_SECONDS`: bot tự đóng và đăng nhập lại (chờ lâu dần giữa các lần).
3. Đăng nhập thất bại do mạng: tự thử lại với thời gian chờ tăng dần.
4. Không hồi phục sau `RECOVERY_MAX_ATTEMPTS` lần, bị Discord vô hiệu phiên, hoặc có ≥3 lỗi nghiêm trọng trong 5 phút: bot báo rồi thoát để được chạy lại sạch.
5. Lỗi chỉ sửa được bằng cấu hình (token sai, chưa bật Privileged Intents): báo rõ cách sửa và thoát mã 78, không lặp vô hạn.

Để bước 4 thực sự "tự chạy lại", `npm start` / `node .` mặc định đã chạy bot dưới supervisor (`src/supervisor.js`): tiến trình chết, kể cả bị OOM-kill, sẽ được bật lại (chờ 2s, 4s, 8s... tối đa 60s nếu sập liên tục) và báo lên webhook kèm nguyên nhân. Nếu đã có Docker (`--restart unless-stopped`) / PM2 / hosting lo việc này, đặt `AUTO_SUPERVISE=false`.chạy lại và báo webhook khi tiến trình chết, kể cả bị OOM-kill), hoặc để Docker (`--restart unless-stopped`) / PM2 / hosting lo.

**Web báo tình hình.** Mở `http://<địa-chỉ-bot>:3000/` (hoặc URL do hosting cấp): trạng thái, ping (có đường theo dõi), thời gian chạy, số server/thành viên/lệnh, RAM, shard, số lần tự khắc phục và danh sách sự cố gần đây, tự làm mới mỗi 5 giây. `GET /api/status` trả JSON, `GET /health` trả 200/503 cho UptimeRobot hay health check của hosting. **Nên đặt `DASHBOARD_TOKEN`**: khi đó cần mật khẩu và mới thấy chi tiết lỗi; nếu không, trang công khai chỉ hiện sự cố kết nối.  Web được bật đầu tiên khi khởi động nên vẫn mở được kể cả khi webhook hoặc backup đang lỗi; cổng bị chiếm thì tự thử lại mỗi 15 giây. Có hiển thị tình trạng webhook (đang lỗi, số tin chờ gửi) và lý do trong báo cáo gần nhất.

## Tính năng

### Quản trị và tiện ích

- Kiểm duyệt thành viên, cảnh cáo, timeout, kick/ban, dọn tin nhắn và công cụ guard.
- Chào mừng thành viên, role tự động, ticket, poll, nhắc việc, thông tin server/thành viên và thông báo sự kiện.
- Giveaway, gợi ý có bình chọn, reaction role, sinh nhật và công cụ quản lý server.

### Cộng đồng và ghép đôi

- Quản trị viên dùng `/setup social` để chọn kênh confession và Tinder; kênh feedback có thể cấu hình thêm.
- Thành viên dùng `/social profile` để tạo hồ sơ tự nguyện, `/social discover` để xem hồ sơ, và `/social pause` hoặc `/social erase` để ẩn/xóa hồ sơ.
- `/social random` vào hoặc rời hàng chờ ghép đôi ngẫu nhiên. Cần hồ sơ đang bật và xác nhận từ 18 tuổi trở lên. Khi ghép thành công, bot tạo private thread; `/social match-chat` mở lại cuộc trò chuyện.
- `/social confession` gửi confession ẩn danh tới kênh đã cấu hình. `/social feedback` gửi góp ý tới đội ngũ server.

### Game và hoạt động

- **Ma Sói:** quản trị viên dùng `/setup werewolf kenh:<kênh>` để đăng bảng lobby. Một ván cần 5–16 người; vai trò và hành động ban đêm được gửi qua DM.
- **Nối Từ:** quản trị viên bật game trong kênh bằng `/noitu-add`, chọn chế độ bot hoặc PvP. Các lệnh `/noitu-new`, `/noitu-hint`, `/noitu-stats`, `/noitu-leaderboard`, `/noitu-mode` và `/noitu-remove` quản lý ván chơi.
- **Quiz:** `/games play` chơi solo; `/games duel` thách đấu thành viên khác.
- **Chat và voice:** `/leaderboard loai:chat` hoặc `voice`; chọn kỳ `all`, `day` hoặc `week` để xem tổng, hôm nay hoặc tuần này. Bot đếm tin nhắn, không lưu nội dung; thời lượng voice được tính khi thành viên tham gia voice.
- **Level:** `/rank` xem cấp độ và `/leaderboard loai:level` xem bảng xếp hạng.

### Kinh tế ảo và giải đấu

- `/daily`, `/hunt`, `/quests`, `/shop`, `/inventory`, `/profile`, `/achievements` và `/coin-history` dùng hệ thống GZW Coin trong server.
- `/gift` chuyển vật phẩm; `/coin limits` xem hạn mức và `/coin pause` tự tạm dừng một số hoạt động.
- Coin được lưu trong ví SQLite và mọi thay đổi được ghi vào `coin_ledger`, sổ cái không cho sửa/xóa. Coin là vật phẩm ảo trong server, không phải tiền thật.
- `/booster` xem trạng thái Booster. Quản trị dùng `/booster-admin` để cấu hình và xử lý quyền lợi Boost.
- `/tournament` dành cho người chơi; `/gzw-admin tournament` dành cho ban tổ chức quản lý giải. Coin thưởng được ghi qua ledger; bot không chuyển tiền mặt.
- Bot không có luồng nạp coin, donate hoặc thanh toán SePay.

## Dữ liệu và cấu hình

- SQLite được lưu tại `data/bot.sqlite`; thư mục `data/` nằm trong `.gitignore`.
- Cấu hình chung, XP và automod: `src/config/config.js`.
- Kinh tế, nhiệm vụ, thành tích và giải đấu: `src/config/core.js`.
- Cấu hình vai trò nhân sự và giới hạn quản trị: `src/config/management.js`.
- Dữ liệu chat/voice chỉ gồm số lượng và thời lượng hoạt động, không chứa nội dung tin nhắn.

## Cấu trúc mã nguồn

```text
src/
  commands/       Slash command theo nhóm tính năng
  config/         Cấu hình bot và tính năng
  database/       SQLite schema và truy vấn dữ liệu
  events/         Discord gateway events và component interactions
  handlers/       Nạp command và event
  services/       Luồng nghiệp vụ dùng chung
```

Thêm command trong `src/commands/` hoặc event trong `src/events/`, theo cấu trúc export hiện có. Sau khi thay đổi slash command, chạy lại `npm run deploy`.