const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const UserModel = require("../../database/userModel");
const economyConfig = require("../../config/economy");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("withdraw")
    .setDescription("Withdraw coins from your bank vault into your wallet.")
    .addStringOption(option =>
      option.setName("amount")
        .setDescription("Amount of coins to withdraw (e.g. 100, all)")
        .setRequired(true)
    ),
  cooldown: 2,
  async execute(interaction) {
    const userId = interaction.user.id;
    const userProfile = await UserModel.get(userId);
    const amountInput = interaction.options.getString("amount").trim().toLowerCase();

    let withdrawAmount = 0;
    const emoji = economyConfig.currencyEmoji;

    if (amountInput === "all") {
      withdrawAmount = userProfile.bank;
    } else {
      // Try to parse the input as an integer
      withdrawAmount = parseInt(amountInput, 10);

      // Validate parsed number
      if (Number.isNaN(withdrawAmount) || withdrawAmount <= 0) {
        const errorEmbed = new EmbedBuilder()
          .setColor(economyConfig.colors.error)
          .setDescription("❌ Please enter a valid positive number or `all` to withdraw.");
        return interaction.reply({ embeds: [errorEmbed], flags: 64 });
      }
    }

    // Check if the user has any coins in the bank
    if (withdrawAmount === 0) {
      const emptyEmbed = new EmbedBuilder()
        .setColor(economyConfig.colors.error)
        .setDescription("❌ You do not have any coins in your bank vault to withdraw.");
      return interaction.reply({ embeds: [emptyEmbed], flags: 64 });
    }

    // Check if the user is attempting to withdraw more than they have in bank
    if (withdrawAmount > userProfile.bank) {
      const insufficientEmbed = new EmbedBuilder()
        .setColor(economyConfig.colors.error)
        .setDescription(`❌ You do not have enough coins in your bank vault. You only have **${userProfile.bank.toLocaleString()}** ${emoji}.`);
      return interaction.reply({ embeds: [insufficientEmbed], flags: 64 });
    }

    // Perform the transfer
    await UserModel.removeCoins(userId, withdrawAmount, "bank");
    await UserModel.addCoins(userId, withdrawAmount, "wallet");

    const updatedProfile = await UserModel.get(userId);

    const successEmbed = new EmbedBuilder()
      .setColor(economyConfig.colors.success)
      .setTitle("💰 Coins Withdrawn")
      .setDescription(`Successfully withdrew **${withdrawAmount.toLocaleString()}** ${emoji} from your bank vault into your wallet!`)
      .addFields(
        { name: "💼 Wallet Balance", value: `${updatedProfile.wallet.toLocaleString()} ${emoji}`, inline: true },
        { name: "🏦 Bank Vault", value: `${updatedProfile.bank.toLocaleString()} ${emoji}`, inline: true }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [successEmbed] });
  }
};
