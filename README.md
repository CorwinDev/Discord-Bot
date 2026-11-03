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

Tạo file `.env` ở thư mục gốc và khai báo:

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
- **Bỏ thanh toán cũ:** loại bỏ luồng donate/SePay; vẫn giữ ví GZW Coin và sổ cái giao dịch.
- **Các file chính:** `src/commands/community/social.js`, `src/commands/community/setup.js`, `src/database/activity.js`, `src/events/voiceStateUpdate.js`, `src/events/werewolfInteractions.js`, `src/services/werewolf.js`.

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