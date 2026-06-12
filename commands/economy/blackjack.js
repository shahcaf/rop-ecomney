const { 
  SlashCommandBuilder, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ComponentType 
} = require("discord.js");
const UserModel = require("../../database/userModel");
const economyConfig = require("../../config/economy");

// Card Deck Generation Helper
function createDeck() {
  const suits = ["♠", "♥", "♦", "♣"];
  const ranks = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
  const deck = [];

  for (const suit of suits) {
    for (const rank of ranks) {
      let value = parseInt(rank, 10);
      if (["J", "Q", "K"].includes(rank)) value = 10;
      if (rank === "A") value = 11; // Hand value calculation handles soft/hard aces

      deck.push({ rank, suit, value, string: `\`[ ${rank}${suit} ]\`` });
    }
  }
  return deck;
}

// Draw a random card and remove it from the deck
function drawCard(deck) {
  const index = Math.floor(Math.random() * deck.length);
  return deck.splice(index, 1)[0];
}

// Calculate total value of a hand, resolving Aces dynamically
function calculateHand(hand) {
  let total = hand.reduce((sum, card) => sum + card.value, 0);
  let aces = hand.filter(card => card.rank === "A").length;

  while (total > 21 && aces > 0) {
    total -= 10; // Convert Soft Ace (11) to Hard Ace (1)
    aces -= 1;
  }
  return total;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("blackjack")
    .setDescription("Play a hand of Blackjack against the dealer!")
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

    // 3. Deduct bet upfront
    await UserModel.removeCoins(userId, bet, "wallet");

    // Initialize deck and hands
    const deck = createDeck();
    const playerHand = [drawCard(deck), drawCard(deck)];
    const dealerHand = [drawCard(deck), drawCard(deck)];

    let playerScore = calculateHand(playerHand);
    let dealerScore = calculateHand(dealerHand);

    // Embed build utility
    const buildGameEmbed = (hideDealer = true, description = "Choose to Hit or Stand.") => {
      const dHandStr = hideDealer 
        ? `${dealerHand[0].string} \`[ 🂠 ? ]\`` 
        : dealerHand.map(c => c.string).join(" ");
      
      const dScoreStr = hideDealer ? `${dealerHand[0].value}` : `${dealerScore}`;

      const pHandStr = playerHand.map(c => c.string).join(" ");

      return new EmbedBuilder()
        .setColor(economyConfig.colors.gamble)
        .setTitle("🃏 Blackjack Table")
        .setDescription(`**${interaction.user.username}** bet **${bet.toLocaleString()}** ${emoji}!\n\n${description}`)
        .addFields(
          { name: `💼 Dealer Hand (Value: ${dScoreStr})`, value: dHandStr, inline: true },
          { name: `👤 Your Hand (Value: ${playerScore})`, value: pHandStr, inline: true }
        )
        .setFooter({ text: "Buttons expire after 30 seconds of inactivity." })
        .setTimestamp();
    };

    // Action Row containing interactive components
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("hit")
        .setLabel("Hit")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId("stand")
        .setLabel("Stand")
        .setStyle(ButtonStyle.Danger)
    );

    // Case 1: Player gets Natural Blackjack (21 on deal)
    if (playerScore === 21) {
      let winMsg = "";
      let embedColor = economyConfig.colors.success;

      if (dealerScore === 21) {
        // Double blackjack is a Push
        await UserModel.addCoins(userId, bet, "wallet"); // Refund bet
        winMsg = `🤝 **Push!** Both you and the dealer hit Blackjack. Your bet was refunded.`;
        embedColor = economyConfig.colors.info;
      } else {
        const mult = economyConfig.games.blackjack.blackjackMultiplier;
        const payout = Math.floor(bet * mult);
        await UserModel.addCoins(userId, payout, "wallet");
        winMsg = `🃏 **Blackjack!** You got a natural 21 and won **${payout.toLocaleString()}** ${emoji}! (Payout: **${mult}x**)`;
      }

      const endEmbed = buildGameEmbed(false, winMsg).setColor(embedColor);
      return interaction.reply({ embeds: [endEmbed] });
    }

    // Standard start message
    const gameEmbed = buildGameEmbed(true);
    const message = await interaction.reply({ 
      embeds: [gameEmbed], 
      components: [row], 
      fetchReply: true 
    });

    // Setup Collector to capture button actions
    const collector = message.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 30000 // 30 seconds timeout
    });

    let gameCompleted = false;

    collector.on("collect", async i => {
      // Security Filter: Check clicker matches player
      if (i.user.id !== interaction.user.id) {
        return i.reply({ 
          content: "❌ Only the player who started this blackjack game can click these buttons.", 
          flags: 64 
        });
      }

      await i.deferUpdate(); // Acknowledge button interaction

      if (i.customId === "hit") {
        playerHand.push(drawCard(deck));
        playerScore = calculateHand(playerHand);

        if (playerScore > 21) {
          // Player busted! Game ends immediately.
          gameCompleted = true;
          collector.stop("bust");
        } else if (playerScore === 21) {
          // Forces stand automatically if user hits 21
          gameCompleted = true;
          collector.stop("stand");
        } else {
          // Continue game, refresh embed
          const nextEmbed = buildGameEmbed(true);
          await interaction.editReply({ embeds: [nextEmbed] });
          collector.resetTimer(); // Restart timeout clock
        }
      } else if (i.customId === "stand") {
        gameCompleted = true;
        collector.stop("stand");
      }
    });

    collector.on("end", async (collected, reason) => {
      // Deactivate button rows
      const disabledRow = new ActionRowBuilder().addComponents(
        row.components.map(btn => ButtonBuilder.from(btn).setDisabled(true))
      );

      let finalMsg = "";
      let finalColor = economyConfig.colors.error;

      if (reason === "bust") {
        finalMsg = `💀 **BUST!** You exceeded 21 and lost your bet of **${bet.toLocaleString()}** ${emoji}.`;
        
        const finalEmbed = buildGameEmbed(false, finalMsg).setColor(finalColor);
        await interaction.editReply({ embeds: [finalEmbed], components: [disabledRow] });
        return;
      }

      if (reason === "stand") {
        // Dealer plays: Dealer hits until score reaches 17 or higher
        while (dealerScore < 17) {
          dealerHand.push(drawCard(deck));
          dealerScore = calculateHand(dealerHand);
        }

        if (dealerScore > 21) {
          // Dealer busted, player wins!
          const payout = bet * economyConfig.games.blackjack.payoutMultiplier;
          await UserModel.addCoins(userId, payout, "wallet");
          
          finalMsg = `🎉 **YOU WIN!** The dealer busted with **${dealerScore}**!\n` +
                      `You won **${payout.toLocaleString()}** ${emoji}!`;
          finalColor = economyConfig.colors.success;
        } else if (playerScore > dealerScore) {
          // Player score is higher, player wins!
          const payout = bet * economyConfig.games.blackjack.payoutMultiplier;
          await UserModel.addCoins(userId, payout, "wallet");
          
          finalMsg = `🎉 **YOU WIN!** Your **${playerScore}** beats the dealer's **${dealerScore}**!\n` +
                      `You won **${payout.toLocaleString()}** ${emoji}!`;
          finalColor = economyConfig.colors.success;
        } else if (playerScore < dealerScore) {
          // Dealer score is higher, dealer wins!
          finalMsg = `💀 **YOU LOST!** The dealer's **${dealerScore}** beats your **${playerScore}**!\n` +
                      `You lost your bet of **${bet.toLocaleString()}** ${emoji}.`;
        } else {
          // Push (tie)
          await UserModel.addCoins(userId, bet, "wallet"); // Refund
          finalMsg = `🤝 **Push!** Both you and the dealer got **${playerScore}**. Your bet was refunded.`;
          finalColor = economyConfig.colors.info;
        }

        const finalEmbed = buildGameEmbed(false, finalMsg).setColor(finalColor);
        await interaction.editReply({ embeds: [finalEmbed], components: [disabledRow] });
        return;
      }

      // Handle collector timeouts (inactivity)
      if (!gameCompleted) {
        finalMsg = `⏳ **Game Timed Out!** You didn't react in time. Your bet of **${bet.toLocaleString()}** ${emoji} was lost.`;
        
        const finalEmbed = buildGameEmbed(true, finalMsg).setColor(economyConfig.colors.error);
        await interaction.editReply({ embeds: [finalEmbed], components: [disabledRow] });
      }
    });
  }
};
