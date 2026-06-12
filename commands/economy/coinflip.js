const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const UserModel = require("../../database/userModel");
const economyConfig = require("../../config/economy");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("coinflip")
    .setDescription("Flip a coin to double your bet!")
    .addStringOption(option =>
      option.setName("choice")
        .setDescription("Heads or Tails?")
        .setRequired(true)
        .addChoices(
          { name: "Heads", value: "heads" },
          { name: "Tails", value: "tails" }
        )
    )
    .addIntegerOption(option =>
      option.setName("bet")
        .setDescription("Amount of coins to bet")
        .setRequired(true)
        .setMinValue(economyConfig.games.minBet)
    ),
  cooldown: 4,
  async execute(interaction) {
    const userId = interaction.user.id;
    const choice = interaction.options.getString("choice");
    const bet = interaction.options.getInteger("bet");
    const emoji = economyConfig.currencyEmoji;

    const userProfile = await UserModel.get(userId);

    // 1. Verify bet is not more than user's wallet
    if (userProfile.wallet < bet) {
      const poorEmbed = new EmbedBuilder()
        .setColor(economyConfig.colors.error)
        .setDescription(`❌ You do not have enough coins in your wallet. You only have **${userProfile.wallet.toLocaleString()}** ${emoji} on-hand.`);
      return interaction.reply({ embeds: [poorEmbed], flags: 64 });
    }

    // 2. Prevent bet from exceeding game boundaries
    const maxBet = economyConfig.games.maxBet;
    if (bet > maxBet) {
      const limitEmbed = new EmbedBuilder()
        .setColor(economyConfig.colors.error)
        .setDescription(`❌ The maximum bet size allowed is **${maxBet.toLocaleString()}** ${emoji}.`);
      return interaction.reply({ embeds: [limitEmbed], flags: 64 });
    }

    // 3. Deduct bet upfront
    await UserModel.removeCoins(userId, bet, "wallet");

    // Send initial flipping embed
    const flipEmbed = new EmbedBuilder()
      .setColor(economyConfig.colors.gamble)
      .setTitle("🪙 Coinflip")
      .setDescription(`**${interaction.user.username}** bet **${bet.toLocaleString()}** ${emoji} on **${choice.toUpperCase()}**!\n\n` +
                      `🪙 🔄 *The coin is spinning in the air...*`)
      .setTimestamp();

    await interaction.reply({ embeds: [flipEmbed] });

    // Sleep helper
    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    // Flip animation (1.2s delay)
    await sleep(1200);

    // Decide winner (50/50)
    const result = Math.random() < 0.5 ? "heads" : "tails";
    const userWon = choice === result;

    let resultMsg = "";
    let embedColor = economyConfig.colors.error;

    if (userWon) {
      const multiplier = economyConfig.games.coinflip.payoutMultiplier;
      const payout = Math.floor(bet * multiplier);
      await UserModel.addCoins(userId, payout, "wallet");

      resultMsg = `🎉 **YOU WON!** The coin landed on **${result.toUpperCase()}**!\n` +
                  `You won **${payout.toLocaleString()}** ${emoji}! (Doubled your bet!)`;
      embedColor = economyConfig.colors.success;
    } else {
      resultMsg = `💀 **YOU LOST!** The coin landed on **${result.toUpperCase()}**!\n` +
                  `You lost your bet of **${bet.toLocaleString()}** ${emoji}.`;
    }

    const updatedProfile = await UserModel.get(userId);

    const finalEmbed = new EmbedBuilder()
      .setColor(embedColor)
      .setTitle("🪙 Coinflip Result")
      .setDescription(`**${interaction.user.username}** bet **${bet.toLocaleString()}** ${emoji} on **${choice.toUpperCase()}**!\n\n` +
                      `${resultMsg}`)
      .addFields({
        name: "💼 Updated Wallet Balance",
        value: `**${updatedProfile.wallet.toLocaleString()}** ${emoji}`
      })
      .setFooter({ text: "Gamble responsibly!" })
      .setTimestamp();

    await interaction.editReply({ embeds: [finalEmbed] });
  }
};
