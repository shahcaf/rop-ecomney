const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const UserModel = require("../../database/userModel");
const economyConfig = require("../../config/economy");

module.exports = {
  adminOnly: true,
  data: new SlashCommandBuilder()
    .setName("setbalance")
    .setDescription("Admin: Set a user's wallet or bank balance to an exact amount.")
    .addUserOption(option =>
      option.setName("user")
        .setDescription("The target user")
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName("amount")
        .setDescription("The exact balance to set")
        .setRequired(true)
        .setMinValue(0)
    )
    .addStringOption(option =>
      option.setName("account")
        .setDescription("Which account to set (default: wallet)")
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

    if (target.bot) {
      const err = new EmbedBuilder().setColor(economyConfig.colors.error)
        .setDescription("❌ Bots do not have economy profiles.");
      return interaction.reply({ embeds: [err], flags: 64 });
    }

    await UserModel.update(target.id, { [account]: amount });
    const updated = await UserModel.get(target.id);

    const embed = new EmbedBuilder()
      .setColor(economyConfig.colors.admin)
      .setTitle("👑 Admin Action: Balance Set")
      .setDescription(`Set **${target.username}**'s **${account}** to **${amount.toLocaleString()}** ${emoji}.`)
      .addFields(
        { name: "👤 Target", value: target.toString(), inline: true },
        { name: "🏦 New Balances", value: `Wallet: **${updated.wallet.toLocaleString()}** ${emoji}\nBank: **${updated.bank.toLocaleString()}** ${emoji}`, inline: true }
      )
      .setFooter({ text: `Admin: ${interaction.user.username}` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
