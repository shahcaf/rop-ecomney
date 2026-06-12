const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const UserModel = require("../../database/userModel");
const economyConfig = require("../../config/economy");

module.exports = {
  adminOnly: true,
  data: new SlashCommandBuilder()
    .setName("removecoins")
    .setDescription("Admin: Deduct virtual coins from a user's account.")
    .addUserOption(option =>
      option.setName("user")
        .setDescription("The user whose coins will be deducted")
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName("amount")
        .setDescription("The amount of coins to remove")
        .setRequired(true)
        .setMinValue(1)
    )
    .addStringOption(option =>
      option.setName("account")
        .setDescription("Remove from wallet or bank (default: wallet)")
        .setRequired(false)
        .addChoices(
          { name: "Wallet", value: "wallet" },
          { name: "Bank Vault", value: "bank" }
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    const target = interaction.options.getUser("user");
    const amount = interaction.options.getInteger("amount");
    const account = interaction.options.getString("account") || "wallet";
    const emoji = economyConfig.currencyEmoji;

    // Check if target is a bot
    if (target.bot) {
      const errorEmbed = new EmbedBuilder()
        .setColor(economyConfig.colors.error)
        .setDescription("❌ Bots do not have economy profiles.");
      return interaction.reply({ embeds: [errorEmbed], flags: 64 });
    }

    const targetProfile = await UserModel.get(target.id);

    // Prevent deduction leading to negative balances
    if (targetProfile[account] < amount) {
      const errorEmbed = new EmbedBuilder()
        .setColor(economyConfig.colors.error)
        .setDescription(`❌ Deduction cancelled. **${target.username}** only has **${targetProfile[account].toLocaleString()}** ${emoji} in their **${account}** account (requested: **${amount.toLocaleString()}** ${emoji}).`);
      return interaction.reply({ embeds: [errorEmbed], flags: 64 });
    }

    // Process Deduction
    await UserModel.removeCoins(target.id, amount, account);
    const updatedProfile = await UserModel.get(target.id);

    const adminEmbed = new EmbedBuilder()
      .setColor(economyConfig.colors.admin)
      .setTitle("👑 Admin Action: Coins Deducted")
      .setDescription(`Successfully deducted **${amount.toLocaleString()}** ${emoji} from **${target.username}**'s **${account}** account.`)
      .addFields(
        { name: "👤 Target User", value: `${target.toString()}`, inline: true },
        { name: "🏦 Updated Profile", value: `Wallet: **${updatedProfile.wallet.toLocaleString()}** ${emoji}\nBank: **${updatedProfile.bank.toLocaleString()}** ${emoji}`, inline: true }
      )
      .setFooter({ text: `Action performed by Administrator: ${interaction.user.username}` })
      .setTimestamp();

    await interaction.reply({ embeds: [adminEmbed] });
  }
};
