const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const UserModel = require("../../database/userModel");
const economyConfig = require("../../config/economy");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("work")
    .setDescription("Perform a shift of work to earn coins!"),
  async execute(interaction) {
    const userId = interaction.user.id;
    const userProfile = await UserModel.get(userId);
    const now = Date.now();

    const lastWork = userProfile.lastWork;
    const cooldown = economyConfig.workCooldown;
    const nextWork = lastWork + cooldown;

    // Check if the user is on cooldown
    if (now < nextWork) {
      const epochSeconds = Math.floor(nextWork / 1000);
      const cooldownEmbed = new EmbedBuilder()
        .setColor(economyConfig.colors.error)
        .setTitle("⏳ Work Shift Cooldown")
        .setDescription(`You are too tired to work right now!\n\nYou can start another shift **<t:${epochSeconds}:R>** (at <t:${epochSeconds}:f>).`)
        .setTimestamp();

      return interaction.reply({ embeds: [cooldownEmbed], flags: 64 });
    }

    // Select random job and generate reward amount
    const jobs = economyConfig.workJobs;
    const selectedJob = jobs[Math.floor(Math.random() * jobs.length)];
    
    const minReward = economyConfig.workMinReward;
    const maxReward = economyConfig.workMaxReward;
    const reward = Math.floor(Math.random() * (maxReward - minReward + 1)) + minReward;
    const emoji = economyConfig.currencyEmoji;

    // Apply earnings to database and update lastWork time
    await UserModel.addCoins(userId, reward, "wallet");
    await UserModel.update(userId, { lastWork: now });

    const updatedProfile = await UserModel.get(userId);

    // Format the job message
    const finalMsg = selectedJob.msg
      .replace("{amount}", reward.toLocaleString())
      .replace("{emoji}", emoji);

    const workEmbed = new EmbedBuilder()
      .setColor(economyConfig.colors.success)
      .setTitle("💼 Shift Completed!")
      .setDescription(finalMsg)
      .addFields(
        { name: "💼 Wallet Balance", value: `${updatedProfile.wallet.toLocaleString()} ${emoji}`, inline: true },
        { name: "🏦 Bank Vault", value: `${updatedProfile.bank.toLocaleString()} ${emoji}`, inline: true }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [workEmbed] });
  }
};
