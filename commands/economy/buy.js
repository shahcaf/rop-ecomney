const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const shopConfig = require("../../config/shop");
const UserModel = require("../../database/userModel");
const InventoryModel = require("../../database/inventoryModel");
const economyConfig = require("../../config/economy");

// Generate dynamic choices for slash command from config/shop.js
// Note: Discord allows up to 25 choices maximum.
const choices = shopConfig.map(item => ({
  name: `${item.name.replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, "").trim()} (${item.price} coins)`,
  value: item.id
}));

module.exports = {
  data: new SlashCommandBuilder()
    .setName("buy")
    .setDescription("Buy an item from the economy shop.")
    .addStringOption(option =>
      option.setName("item")
        .setDescription("Select the item to purchase")
        .setRequired(true)
        .addChoices(...choices)
    ),
  cooldown: 3,
  async execute(interaction) {
    const userId = interaction.user.id;
    const itemId = interaction.options.getString("item");
    const emoji = economyConfig.currencyEmoji;

    // Find the item details from configuration
    const item = shopConfig.find(i => i.id === itemId);
    if (!item) {
      const missingEmbed = new EmbedBuilder()
        .setColor(economyConfig.colors.error)
        .setDescription("❌ That item does not exist in the shop configuration.");
      return interaction.reply({ embeds: [missingEmbed], flags: 64 });
    }

    const userProfile = await UserModel.get(userId);

    // Verify user can afford the item with their wallet balance
    if (userProfile.wallet < item.price) {
      const priceDiff = item.price - userProfile.wallet;
      
      const poorEmbed = new EmbedBuilder()
        .setColor(economyConfig.colors.error)
        .setTitle("❌ Insufficient Funds")
        .setDescription(`You need **${item.price.toLocaleString()}** ${emoji} in your wallet to buy this, but you only have **${userProfile.wallet.toLocaleString()}** ${emoji}.\n\n*Missing: **${priceDiff.toLocaleString()}** ${emoji}.* ${userProfile.bank >= priceDiff ? "*(You have enough in your bank! Use `/withdraw` first)*" : ""}`);
      
      return interaction.reply({ embeds: [poorEmbed], flags: 64 });
    }

    // Process Purchase
    // Deduct coins from wallet
    await UserModel.removeCoins(userId, item.price, "wallet");
    // Add item to inventory database
    await InventoryModel.addItem(userId, item.id, 1);

    const updatedProfile = await UserModel.get(userId);
    const newQty = await InventoryModel.getItemQuantity(userId, item.id);

    const buyEmbed = new EmbedBuilder()
      .setColor(economyConfig.colors.success)
      .setTitle("🛒 Item Purchased!")
      .setDescription(`You successfully purchased **${item.name}** for **${item.price.toLocaleString()}** ${emoji}!`)
      .addFields(
        { name: "🎒 Inventory Owned", value: `${newQty} unit(s)`, inline: true },
        { name: "💼 Remaining Wallet", value: `${updatedProfile.wallet.toLocaleString()} ${emoji}`, inline: true }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [buyEmbed] });
  }
};
