const { SlashCommandBuilder } = require('discord.js');
const { confirmTransfer } = require('../../services/transferUi');
const gzw = require('../../config/gzw');

const tradable = gzw.shop.filter((i) => i.tradable);

module.exports = {
  group: 'GZW CORE',
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('gift')
    .setDescription('Tặng vật phẩm trang trí cho thành viên khác')
    .addUserOption((o) => o.setName('user').setDescription('Người nhận').setRequired(true))
    .addStringOption((o) => o.setName('vat-pham').setDescription('Vật phẩm').setRequired(true)
      .addChoices(...tradable.map((i) => ({ name: `${i.name} (${i.price} coin)`, value: i.id }))))
    .addStringOption((o) => o.setName('nguon').setDescription('Lấy từ đâu').setRequired(true)
      .addChoices({ name: 'Từ kho đồ của tôi', value: 'inventory' }, { name: 'Mua từ shop để tặng', value: 'shop' }))
    .addStringOption((o) => o.setName('loi-nhan').setDescription('Lời nhắn (tuỳ chọn)').setMaxLength(100)),

  async execute(interaction) {
    return confirmTransfer(interaction, {
      toUser: interaction.options.getUser('user'),
      kind: 'item',
      itemId: interaction.options.getString('vat-pham'),
      mode: interaction.options.getString('nguon'),
      context: 'gift',
      note: interaction.options.getString('loi-nhan')
    });
  }
};
