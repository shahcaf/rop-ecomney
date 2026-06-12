const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const UserModel = require("../../database/userModel");
const economyConfig = require("../../config/economy");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("pay")
    .setDescription("Transfer coins from your wallet to another user.")
    .addUserOption(option =>
      option.setName("user")
        .setDescription("The user you want to pay")
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName("amount")
        .setDescription("Amount of coins to pay (must be at least 1)")
        .setRequired(true)
        .setMinValue(1)
    ),
  cooldown: 3,
  async execute(interaction) {
    const senderId = interaction.user.id;
    const recipient = interaction.options.getUser("user");
    const payAmount = interaction.options.getInteger("amount");
    
    const emoji = economyConfig.currencyEmoji;

    // 1. Prevent paying bots
    if (recipient.bot) {
      const botEmbed = new EmbedBuilder()
        .setColor(economyConfig.colors.error)
        .setDescription("❌ You cannot transfer coins to bots.");
      return interaction.reply({ embeds: [botEmbed], flags: 64 });
    }

    // 2. Prevent paying yourself
    if (recipient.id === senderId) {
      const selfEmbed = new EmbedBuilder()
        .setColor(economyConfig.colors.error)
        .setDescription("❌ You cannot pay yourself.");
      return interaction.reply({ embeds: [selfEmbed], flags: 64 });
    }

    // 3. Double-check amount sanity (although setMinValue(1) handles this)
    if (payAmount <= 0 || Number.isNaN(payAmount)) {
      const amountEmbed = new EmbedBuilder()
        .setColor(economyConfig.colors.error)
        .setDescription("❌ Transfer amount must be a valid positive integer.");
      return interaction.reply({ embeds: [amountEmbed], flags: 64 });
    }

    const senderProfile = await UserModel.get(senderId);

    // 4. Prevent paying more than sender owns in wallet
    if (senderProfile.wallet < payAmount) {
      const insufficientEmbed = new EmbedBuilder()
        .setColor(economyConfig.colors.error)
        .setDescription(`❌ You do not have enough coins in your wallet. You only have **${senderProfile.wallet.toLocaleString()}** ${emoji}.`);
      return interaction.reply({ embeds: [insufficientEmbed], flags: 64 });
    }

    // Perform transaction
    await UserModel.removeCoins(senderId, payAmount, "wallet");
    await UserModel.addCoins(recipient.id, payAmount, "wallet");

    const updatedSender = await UserModel.get(senderId);

    const payEmbed = new EmbedBuilder()
      .setColor(economyConfig.colors.success)
      .setTitle("💸 Transfer Completed")
      .setDescription(`Successfully sent **${payAmount.toLocaleString()}** ${emoji} to **${recipient.username}**!`)
      .addFields(
        { name: "👤 Recipient", value: `${recipient.toString()}`, inline: true },
        { name: "💼 Your Wallet", value: `${updatedSender.wallet.toLocaleString()} ${emoji}`, inline: true }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [payEmbed] });
  }
};
