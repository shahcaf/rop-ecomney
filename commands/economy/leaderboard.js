const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const UserModel = require("../../database/userModel");
const economyConfig = require("../../config/economy");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("View the top 10 richest users on the server."),
  cooldown: 5,
  async execute(interaction) {
    const topUsers = await UserModel.getTopUsers(10);
    const emoji = economyConfig.currencyEmoji;

    const leaderboardEmbed = new EmbedBuilder()
      .setColor(economyConfig.colors.info)
      .setTitle("🏆 Server Economy Leaderboard")
      .setDescription("The wealthiest members of the community, ranked by net worth (wallet + bank):\n\n" +
                      "━━━━━━━━━━━━━━━━━━━━━━━")
      .setTimestamp();

    if (topUsers.length === 0) {
      leaderboardEmbed.setDescription("No economy profiles have been created yet!");
      return interaction.reply({ embeds: [leaderboardEmbed] });
    }

    // Map database user data to formatted lines
    const leaderboardLines = topUsers.map((user, index) => {
      const rank = index + 1;
      let rankBadge = "";
      
      // Top 3 positions get nice medal badges
      if (rank === 1) rankBadge = "🥇 ";
      else if (rank === 2) rankBadge = "🥈 ";
      else if (rank === 3) rankBadge = "🥉 ";
      else rankBadge = `\`#${rank}\` `;

      const userMention = `<@${user.userId}>`;
      const netWorth = (user.wallet + user.bank).toLocaleString();
      const breakdown = `\`[ Wallet: ${user.wallet.toLocaleString()} | Bank: ${user.bank.toLocaleString()} ]\``;

      return `${rankBadge}**${userMention}**\n` +
             `💰 **Net Assets**: **${netWorth}** ${emoji}\n` +
             `↳ ${breakdown}\n` +
             `━━━━━━━━━━━━━━━━━━━━━━━`;
    });

    leaderboardEmbed.setDescription("The wealthiest members of the community, ranked by net worth (wallet + bank):\n\n" +
                                    "━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
                                    leaderboardLines.join("\n\n"));

    await interaction.reply({ embeds: [leaderboardEmbed] });
  }
};
