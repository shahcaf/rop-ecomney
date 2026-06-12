const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const UserModel = require("../../database/userModel");
const economyConfig = require("../../config/economy");

module.exports = {
  adminOnly: true,
  data: new SlashCommandBuilder()
    .setName("ecostats")
    .setDescription("Admin: View global economy statistics.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    const totalUsers = await UserModel.getTotalUsers();
    const totals = await UserModel.getTotalCoinsInCirculation();
    const emoji = economyConfig.currencyEmoji;

    const embed = new EmbedBuilder()
      .setColor(economyConfig.colors.admin)
      .setTitle("👑 Admin Action: Global Economy Stats")
      .addFields(
        { name: "👥 Total Users", value: `**${totalUsers.toLocaleString()}**`, inline: true },
        { name: "💰 Total Wallet", value: `**${totals.totalWallet.toLocaleString()}** ${emoji}`, inline: true },
        { name: "🏦 Total Bank", value: `**${totals.totalBank.toLocaleString()}** ${emoji}`, inline: true },
        { name: "💸 Total Circulation", value: `**${(totals.totalWallet + totals.totalBank).toLocaleString()}** ${emoji}`, inline: false }
      )
      .setFooter({ text: `Requested by ${interaction.user.username}` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
