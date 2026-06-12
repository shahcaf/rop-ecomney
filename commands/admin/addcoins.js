const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const UserModel = require("../../database/userModel");
const economyConfig = require("../../config/economy");

module.exports = {
  adminOnly: true, // Custom check enforced in events/interactionCreate.js
  data: new SlashCommandBuilder()
    .setName("addcoins")
    .setDescription("Admin: Grant virtual coins to a user's account.")
    .addUserOption(option =>
      option.setName("user")
        .setDescription("The user receiving the coins")
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName("amount")
        .setDescription("The amount of coins to add")
        .setRequired(true)
        .setMinValue(1)
    )
    .addStringOption(option =>
      option.setName("account")
        .setDescription("Add to wallet or bank (default: wallet)")
        .setRequired(false)
        .addChoices(
          { name: "Wallet", value: "wallet" },
          { name: "Bank Vault", value: "bank" }
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator), // Discord UI-side permission check
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

    // Process funding
    await UserModel.addCoins(target.id, amount, account);
    const updatedProfile = await UserModel.get(target.id);

    const adminEmbed = new EmbedBuilder()
      .setColor(economyConfig.colors.admin)
      .setTitle("👑 Admin Action: Coins Granted")
      .setDescription(`Successfully added **${amount.toLocaleString()}** ${emoji} to **${target.username}**'s **${account}** account.`)
      .addFields(
        { name: "👤 Recipient", value: `${target.toString()}`, inline: true },
        { name: "🏦 Updated Profile", value: `Wallet: **${updatedProfile.wallet.toLocaleString()}** ${emoji}\nBank: **${updatedProfile.bank.toLocaleString()}** ${emoji}`, inline: true }
      )
      .setFooter({ text: `Action performed by Administrator: ${interaction.user.username}` })
      .setTimestamp();

    await interaction.reply({ embeds: [adminEmbed] });
  }
};
