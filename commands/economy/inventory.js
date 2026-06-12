const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const shopConfig = require("../../config/shop");
const InventoryModel = require("../../database/inventoryModel");
const economyConfig = require("../../config/economy");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("inventory")
    .setDescription("View your inventory or inspect another user's inventory.")
    .addUserOption(option =>
      option.setName("user")
        .setDescription("Select a user to inspect (optional)")
        .setRequired(false)
    ),
  cooldown: 3,
  async execute(interaction) {
    const target = interaction.options.getUser("user") || interaction.user;

    // Check if target is a bot
    if (target.bot) {
      const botEmbed = new EmbedBuilder()
        .setColor(economyConfig.colors.error)
        .setDescription("❌ Bots do not have inventories.");
      return interaction.reply({ embeds: [botEmbed], flags: 64 });
    }

    const inventoryItems = await InventoryModel.getUserInventory(target.id);

    const invEmbed = new EmbedBuilder()
      .setColor(economyConfig.colors.info)
      .setTitle(`🎒 Backpack Inventory: ${target.username}`)
      .setThumbnail(target.displayAvatarURL({ forceStatic: true, size: 256 }))
      .setTimestamp();

    if (inventoryItems.length === 0) {
      invEmbed.setDescription(
        target.id === interaction.user.id 
          ? "❌ *Your backpack is currently empty! Explore the `/shop` and use `/buy` to get items.*" 
          : `❌ *${target.username}'s backpack is currently empty.*`
      );
    } else {
      let descriptionStr = "━━━━━━━━━━━━━━━━━━━━━━━\n\n";
      
      inventoryItems.forEach(invItem => {
        // Resolve item info from the shop configuration
        const itemInfo = shopConfig.find(item => item.id === invItem.itemId);
        const displayName = itemInfo ? itemInfo.name : `📦 Unknown Item (\`${invItem.itemId}\`)`;
        const displayDesc = itemInfo ? itemInfo.description : "*This item is no longer in the shop.*";
        
        descriptionStr += `**${displayName}**\n` +
                          `• **Quantity Owned**: \`${invItem.quantity}\`\n` +
                          `• **Item Code ID**: \`${invItem.itemId}\`\n` +
                          `• *${displayDesc}*\n\n` +
                          `━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
      });
      
      invEmbed.setDescription(descriptionStr);
    }

    await interaction.reply({ embeds: [invEmbed] });
  }
};
