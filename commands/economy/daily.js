const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const UserModel = require("../../database/userModel");
const economyConfig = require("../../config/economy");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("daily")
    .setDescription("Claim your daily coins reward!"),
  async execute(interaction) {
    const userId = interaction.user.id;
    const userProfile = await UserModel.get(userId);
    const now = Date.now();
    
    const lastDaily = userProfile.lastDaily;
    const cooldown = economyConfig.dailyCooldown;
    const nextDaily = lastDaily + cooldown;

    // Check if cooldown has expired
    if (now < nextDaily) {
      const epochSeconds = Math.floor(nextDaily / 1000);
      const cooldownEmbed = new EmbedBuilder()
        .setColor(economyConfig.colors.error)
        .setTitle("⏳ Daily Cooldown Active")
        .setDescription(`You have already claimed your daily reward!\n\nYou can claim it again **<t:${epochSeconds}:R>** (at <t:${epochSeconds}:f>).`)
        .setTimestamp();

      return interaction.reply({ embeds: [cooldownEmbed], flags: 64 });
    }

    // Reward the user
    const reward = economyConfig.dailyReward;
    const emoji = economyConfig.currencyEmoji;

    // Add reward to user wallet
    await UserModel.addCoins(userId, reward, "wallet");
    
    // Update lastDaily timestamp
    await UserModel.update(userId, { lastDaily: now });

    const newProfile = await UserModel.get(userId);

    const claimEmbed = new EmbedBuilder()
      .setColor(economyConfig.colors.success)
      .setTitle("🎉 Daily Reward Claimed!")
      .setDescription(`You successfully claimed your daily reward of **${reward}** ${emoji}!`)
      .addFields(
        { name: "💼 Wallet Balance", value: `${newProfile.wallet.toLocaleString()} ${emoji}`, inline: true },
        { name: "🏦 Bank Vault", value: `${newProfile.bank.toLocaleString()} ${emoji}`, inline: true }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [claimEmbed] });
  }
};
