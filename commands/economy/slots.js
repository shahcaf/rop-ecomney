const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const UserModel = require("../../database/userModel");
const economyConfig = require("../../config/economy");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("slots")
    .setDescription("Play the slot machine to win big multipliers!")
    .addIntegerOption(option =>
      option.setName("bet")
        .setDescription("Amount of coins to bet")
        .setRequired(true)
        .setMinValue(economyConfig.games.minBet)
    ),
  cooldown: 5,
  async execute(interaction) {
    const userId = interaction.user.id;
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

    // 3. Deduct bet upfront to ensure database integrity
    await UserModel.removeCoins(userId, bet, "wallet");

    const slotConfig = economyConfig.games.slots;
    const items = slotConfig.emojis;

    // Pick 3 final emojis
    const reel1 = items[Math.floor(Math.random() * items.length)];
    const reel2 = items[Math.floor(Math.random() * items.length)];
    const reel3 = items[Math.floor(Math.random() * items.length)];

    // Send initial spinning embed
    const spinEmbed = new EmbedBuilder()
      .setColor(economyConfig.colors.gamble)
      .setTitle("🎰 Slot Machine")
      .setDescription(`**${interaction.user.username}** placed a bet of **${bet.toLocaleString()}** ${emoji}!\n\n` + 
                      `━━━━🎰 Slot Reels 🎰━━━━\n` +
                      `|  🔄  |  🔄  |  🔄  |\n` +
                      `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
                      `*Spinning the wheels...*`)
      .setTimestamp();

    const message = await interaction.reply({ embeds: [spinEmbed], fetchReply: true });

    // Utility sleep helper
    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    // Spin animation step 1
    await sleep(500);
    spinEmbed.setDescription(`**${interaction.user.username}** placed a bet of **${bet.toLocaleString()}** ${emoji}!\n\n` + 
                             `━━━━🎰 Slot Reels 🎰━━━━\n` +
                             `|  ${reel1}  |  🔄  |  🔄  |\n` +
                             `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
                             `*Reels are slowing down...*`);
    await interaction.editReply({ embeds: [spinEmbed] });

    // Spin animation step 2
    await sleep(500);
    spinEmbed.setDescription(`**${interaction.user.username}** placed a bet of **${bet.toLocaleString()}** ${emoji}!\n\n` + 
                             `━━━━🎰 Slot Reels 🎰━━━━\n` +
                             `|  ${reel1}  |  ${reel2}  |  🔄  |\n` +
                             `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
                             `*Last reel spinning...*`);
    await interaction.editReply({ embeds: [spinEmbed] });

    // Spin animation step 3 (Final result)
    await sleep(500);

    // Calculate payouts
    let winType = "lose";
    let payout = 0;

    if (reel1 === reel2 && reel2 === reel3) {
      winType = "jackpot"; // 3 matching
      payout = bet * slotConfig.winThreeMultiplier;
    } else if (reel1 === reel2 || reel2 === reel3 || reel1 === reel3) {
      winType = "win"; // 2 matching
      payout = Math.floor(bet * slotConfig.winTwoMultiplier);
    }

    let resultMsg = "";
    let embedColor = economyConfig.colors.error;

    if (winType === "jackpot") {
      await UserModel.addCoins(userId, payout, "wallet");
      resultMsg = `🎉 **JACKPOT!** You matched 3 symbols and won **${payout.toLocaleString()}** ${emoji}! (Payout: **${slotConfig.winThreeMultiplier}x**)`;
      embedColor = economyConfig.colors.success;
    } else if (winType === "win") {
      await UserModel.addCoins(userId, payout, "wallet");
      resultMsg = `✨ **WIN!** You matched 2 symbols and won **${payout.toLocaleString()}** ${emoji}! (Payout: **${slotConfig.winTwoMultiplier}x**)`;
      embedColor = economyConfig.colors.success;
    } else {
      resultMsg = `💀 **LOSE!** Better luck next time! You lost **${bet.toLocaleString()}** ${emoji}.`;
    }

    const updatedProfile = await UserModel.get(userId);

    const finalEmbed = new EmbedBuilder()
      .setColor(embedColor)
      .setTitle("🎰 Slot Machine Results")
      .setDescription(`**${interaction.user.username}** bet **${bet.toLocaleString()}** ${emoji}!\n\n` +
                      `━━━━🎰 Slot Reels 🎰━━━━\n` +
                      `|  ${reel1}  |  ${reel2}  |  ${reel3}  |\n` +
                      `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
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
