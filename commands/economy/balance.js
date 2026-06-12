const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const UserModel = require("../../database/userModel");
const economyConfig = require("../../config/economy");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("balance")
    .setDescription("Display your wallet, bank, and total net worth.")
    .addUserOption(option => 
      option.setName("user")
        .setDescription("Select a user to inspect (optional)")
        .setRequired(false)
    ),
  cooldown: 3, // Anti-spam cooldown (seconds)
  async execute(interaction) {
    const target = interaction.options.getUser("user") || interaction.user;

    // Check if target is a bot
    if (target.bot) {
      const botEmbed = new EmbedBuilder()
        .setColor(economyConfig.colors.error)
        .setDescription("❌ Bots do not have economy profiles.");
      return interaction.reply({ embeds: [botEmbed], flags: 64 });
    }

    // Retrieve database profile (creates automatically if missing)
    const userProfile = await UserModel.get(target.id);
    const wallet = userProfile.wallet;
    const bank = userProfile.bank;
    const total = wallet + bank;
    const emoji = economyConfig.currencyEmoji;

    // Generate a beautiful asset division visual meter (modern progress bar)
    let progressBar = "";
    if (total === 0) {
      progressBar = "`[ ░░░░░░░░░░ ]` *No assets accumulated yet.*";
    } else {
      const walletWeight = Math.round((wallet / total) * 10);
      const bankWeight = 10 - walletWeight;
      
      const walletBar = "🟩".repeat(walletWeight);
      const bankBar = "🟦".repeat(bankWeight);
      
      const walletPct = Math.round((wallet / total) * 100);
      const bankPct = Math.round((bank / total) * 100);
      progressBar = `\`[\` ${walletBar}${bankBar} \`]\` \n**Wallet**: \`${walletPct}%\` • **Bank**: \`${bankPct}%\``;
    }

    const balanceEmbed = new EmbedBuilder()
      .setColor(economyConfig.colors.info)
      .setTitle(`💵 Balance Profile: ${target.username}`)
      .setThumbnail(target.displayAvatarURL({ forceStatic: true, size: 256 }))
      .addFields(
        { 
          name: "💼 Wallet Balance", 
          value: `**${wallet.toLocaleString()}** ${emoji}`, 
          inline: true 
        },
        { 
          name: "🏦 Bank Vault", 
          value: `**${bank.toLocaleString()}** ${emoji}`, 
          inline: true 
        },
        { 
          name: "📊 Asset Division", 
          value: progressBar, 
          inline: false 
        },
        { 
          name: "📈 Net Worth", 
          value: `**${total.toLocaleString()}** ${emoji}`, 
          inline: false 
        }
      )
      .setFooter({ text: `Requested by ${interaction.user.username}` })
      .setTimestamp();

    await interaction.reply({ embeds: [balanceEmbed] });
  }
};
