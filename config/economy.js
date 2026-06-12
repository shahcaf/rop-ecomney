module.exports = {
  // Currency settings
  currencyName: "Coins",
  currencyEmoji: "🪙",

  // Daily command settings
  dailyReward: 250, // Amount of coins given
  dailyCooldown: 24 * 60 * 60 * 1000, // Cooldown in milliseconds (24 hours)

  // Work command settings
  workMinReward: 50, // Minimum coins earned
  workMaxReward: 150, // Maximum coins earned
  workCooldown: 1 * 60 * 60 * 1000, // Cooldown in milliseconds (1 hour)
  
  // Job options for the work command
  workJobs: [
    { job: "programmer", msg: "You worked as a programmer and fixed a critical bug! You earned {amount} {emoji}." },
    { job: "food_delivery", msg: "You delivered warm food to hungry customers! You earned {amount} {emoji}." },
    { job: "server_admin", msg: "You fixed a crashed guild server and updated the database! You earned {amount} {emoji}." },
    { job: "shop_cleaner", msg: "You cleaned the local general store until it was sparkling! You earned {amount} {emoji}." },
    { job: "designer", msg: "You designed a beautiful custom banner for a client! You earned {amount} {emoji}." },
    { job: "streamer", msg: "You streamed gameplay to your viewers and received donations! You earned {amount} {emoji}." }
  ],

  // Casino / Mini-games configuration
  games: {
    minBet: 10,
    maxBet: 100000,
    slots: {
      emojis: ["🍒", "🍋", "🍇", "🍊", "💎", "7️⃣"],
      winThreeMultiplier: 6, // 3 matching emojis payout
      winTwoMultiplier: 2.5,  // 2 matching emojis payout
    },
    coinflip: {
      payoutMultiplier: 2.0, // Win multiplier
    },
    blackjack: {
      payoutMultiplier: 2.0, // standard win
      blackjackMultiplier: 2.5, // natural blackjack win (2.5x bet)
    }
  },

  // Premium UI Design Palette
  colors: {
    success: 0x05FF9B, // Neon emerald green
    error: 0xFF355E, // Modern bright crimson rose
    info: 0x00F5D4, // Futuristic bright teal
    admin: 0xFFD700, // Gold
    gamble: 0x9D4EDD // Bright neon purple for casino games
  }
};
