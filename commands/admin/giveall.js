const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const UserModel = require("../../database/userModel");
const economyConfig = require("../../config/economy");

module.exports = {
  adminOnly: true,
  data: new SlashCommandBuilder()
    .setName("giveall")
    .setDescription("Admin: Give coins to every member in the server.")
    .addIntegerOption(option =>
      option.setName("amount")
        .setDescription("Amount of coins to give each member")
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(1000000)
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
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    await interaction.deferReply();

    const amount = interaction.options.getInteger("amount");
    const account = interaction.options.getString("account") || "wallet";
    const emoji = economyConfig.currencyEmoji;

    // Fetch all non-bot members
    const members = await interaction.guild.members.fetch();
    const humans = members.filter(m => !m.user.bot);
    let count = 0;

    for (const [, member] of humans) {
      try {
        await UserModel.addCoins(member.user.id, amount, account);
        count++;
      } catch {
        // Skip if error
      }
    }

    const embed = new EmbedBuilder()
      .setColor(economyConfig.colors.admin)
      .setTitle("👑 Admin Action: Mass Distribution")
      .setDescription(`Successfully gave **${amount.toLocaleString()}** ${emoji} to **${count}** member${count !== 1 ? "s" : ""}'s **${account}**.`)
      .addFields(
        { name: "💸 Total Distributed", value: `**${(amount * count).toLocaleString()}** ${emoji}`, inline: true },
        { name: "👥 Recipients", value: `**${count}** members`, inline: true }
      )
      .setFooter({ text: `Admin: ${interaction.user.username}` })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  }
};
