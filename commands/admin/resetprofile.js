const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const UserModel = require("../../database/userModel");
const economyConfig = require("../../config/economy");

module.exports = {
  adminOnly: true,
  data: new SlashCommandBuilder()
    .setName("resetprofile")
    .setDescription("Admin: Completely reset a user's economy profile (balances and inventory).")
    .addUserOption(option =>
      option.setName("user")
        .setDescription("The user whose profile you want to wipe")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    const target = interaction.options.getUser("user");
    const emoji = economyConfig.currencyEmoji;

    // Check if target is a bot
    if (target.bot) {
      const errorEmbed = new EmbedBuilder()
        .setColor(economyConfig.colors.error)
        .setDescription("❌ Bots do not have economy profiles to reset.");
      return interaction.reply({ embeds: [errorEmbed], flags: 64 });
    }

    // Reset profile in SQLite database
    await UserModel.reset(target.id);

    const adminEmbed = new EmbedBuilder()
      .setColor(economyConfig.colors.admin)
      .setTitle("👑 Admin Action: Profile Wiped")
      .setDescription(`Successfully reset the economy profile of **${target.username}**.\n\nAll wallet coins, bank vault savings, daily/work cooldowns, and items in their inventory have been deleted.`)
      .addFields(
        { name: "👤 Target User", value: `${target.toString()}`, inline: true },
        { name: "🏦 New Balances", value: `Wallet: **0** ${emoji}\nBank: **0** ${emoji}`, inline: true }
      )
      .setFooter({ text: `Action performed by Administrator: ${interaction.user.username}` })
      .setTimestamp();

    await interaction.reply({ embeds: [adminEmbed] });
  }
};
