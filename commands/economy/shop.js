const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const shopConfig = require("../../config/shop");
const economyConfig = require("../../config/economy");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("shop")
    .setDescription("View all items available for purchase in the server shop."),
  cooldown: 3,
  async execute(interaction) {
    const emoji = economyConfig.currencyEmoji;

    const shopEmbed = new EmbedBuilder()
      .setColor(economyConfig.colors.info)
      .setTitle("🛒 Guild Economy Shop")
      .setDescription("Welcome to the general store! Browse our selection below and buy items using `/buy`.\n\n" +
                      "━━━━━━━━━━━━━━━━━━━━━━━")
      .setFooter({ text: "Use the item ID in the dropdown menu when running /buy" })
      .setTimestamp();

    if (shopConfig.length === 0) {
      shopEmbed.setDescription("❌ The shop is currently empty! Check back later.");
    } else {
      shopConfig.forEach(item => {
        shopEmbed.addFields({
          name: `${item.name}`,
          value: `🏷️ **Price**: \`${item.price.toLocaleString()}\` ${emoji}\n` +
                 `🆔 **Item ID**: \`${item.id}\`\n` +
                 `📖 *${item.description}*\n` +
                 `━━━━━━━━━━━━━━━━━━━━━━━`,
          inline: false
        });
      });
    }

    await interaction.reply({ embeds: [shopEmbed] });
  }
};
