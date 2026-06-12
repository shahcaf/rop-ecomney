const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const UserModel = require("../../database/userModel");
const economyConfig = require("../../config/economy");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("deposit")
    .setDescription("Deposit coins from your wallet into your bank.")
    .addStringOption(option =>
      option.setName("amount")
        .setDescription("Amount of coins to deposit (e.g. 100, all)")
        .setRequired(true)
    ),
  cooldown: 2,
  async execute(interaction) {
    const userId = interaction.user.id;
    const userProfile = await UserModel.get(userId);
    const amountInput = interaction.options.getString("amount").trim().toLowerCase();

    let depositAmount = 0;
    const emoji = economyConfig.currencyEmoji;

    if (amountInput === "all") {
      depositAmount = userProfile.wallet;
    } else {
      // Try to parse the input as an integer
      depositAmount = parseInt(amountInput, 10);

      // Validate parsed number
      if (Number.isNaN(depositAmount) || depositAmount <= 0) {
        const errorEmbed = new EmbedBuilder()
          .setColor(economyConfig.colors.error)
          .setDescription("❌ Please enter a valid positive number or `all` to deposit.");
        return interaction.reply({ embeds: [errorEmbed], flags: 64 });
      }
    }

    // Check if the user has any coins in their wallet
    if (depositAmount === 0) {
      const emptyEmbed = new EmbedBuilder()
        .setColor(economyConfig.colors.error)
        .setDescription("❌ You do not have any coins in your wallet to deposit.");
      return interaction.reply({ embeds: [emptyEmbed], flags: 64 });
    }

    // Check if the user is attempting to deposit more than they own
    if (depositAmount > userProfile.wallet) {
      const insufficientEmbed = new EmbedBuilder()
        .setColor(economyConfig.colors.error)
        .setDescription(`❌ You do not have enough coins in your wallet. You only have **${userProfile.wallet.toLocaleString()}** ${emoji}.`);
      return interaction.reply({ embeds: [insufficientEmbed], flags: 64 });
    }

    // Perform the transfer
    await UserModel.removeCoins(userId, depositAmount, "wallet");
    await UserModel.addCoins(userId, depositAmount, "bank");

    const updatedProfile = await UserModel.get(userId);

    const successEmbed = new EmbedBuilder()
      .setColor(economyConfig.colors.success)
      .setTitle("🏦 Coins Deposited")
      .setDescription(`Successfully deposited **${depositAmount.toLocaleString()}** ${emoji} into your bank account!`)
      .addFields(
        { name: "💼 Wallet Balance", value: `${updatedProfile.wallet.toLocaleString()} ${emoji}`, inline: true },
        { name: "🏦 Bank Vault", value: `${updatedProfile.bank.toLocaleString()} ${emoji}`, inline: true }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [successEmbed] });
  }
};
