const fs = require('fs');
const path = require('path');

/**
 * Quét toàn bộ src/commands/** và nạp vào client.commands (Collection).
 * Mỗi file command phải export { data (SlashCommandBuilder), execute(interaction) }.
 */
function loadCommands(client) {
  const commandsPath = path.join(__dirname, '..', 'commands');
  const folders = fs.readdirSync(commandsPath).filter(f =>
    fs.statSync(path.join(commandsPath, f)).isDirectory()
  );

  const commandsJSON = [];

  for (const folder of folders) {
    const folderPath = path.join(commandsPath, folder);
    const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.js'));

    for (const file of files) {
      const filePath = path.join(folderPath, file);
      delete require.cache[require.resolve(filePath)];
      const command = require(filePath);

      if (!command?.data || !command?.execute) {
        console.log(`⚠️  Bỏ qua ${folder}/${file}: thiếu "data" hoặc "execute"`);
        continue;
      }

      client.commands.set(command.data.name, command);
      commandsJSON.push(command.data.toJSON());
    }
  }

  console.log(`✅ Đã nạp ${client.commands.size} slash command (${folders.join(', ')})`);
  return commandsJSON;
}

module.exports = loadCommands;
