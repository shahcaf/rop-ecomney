const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const economyConfig = require("../../config/economy");
const { createSelectMenu } = require("../../components/selectMenu");

// Category definitions used by both /cmd and the dropdown handler
const CATEGORIES = {
  finance: {
    label: "💰 Finance & Economy",
    emoji: "💰",
    color: 0x05FF9B,
    icon: "🏦",
    description: "Manage your wallet, bank, earnings, and payments.",
    commands: ["balance", "daily", "work", "deposit", "withdraw", "pay", "leaderboard", "interest", "loan", "repay", "taxes", "salary", "prestige", "profile", "rob", "beg"]
  },
  casino: {
    label: "🎰 Casino & Games",
    emoji: "🎰",
    color: 0x9D4EDD,
    icon: "🎲",
    description: "Try your luck at slots, blackjack, and more.",
    commands: ["slots", "coinflip", "blackjack", "roulette", "lottery", "crash"]
  },
  shopping: {
    label: "🛒 Shop & Items",
    emoji: "🛒",
    color: 0xFF9F1C,
    icon: "🏪",
    description: "Browse the shop, buy items, and manage your inventory.",
    commands: ["shop", "buy", "inventory", "sell", "use", "gift"]
  },
  fun: {
    label: "🎉 Fun & Interaction",
    emoji: "🎉",
    color: 0xFF0054,
    icon: "🎮",
    description: "Jokes, memes, interactions, and fun games.",
    commands: ["joke", "8ball", "meme", "hug", "kiss", "weather", "fact", "quote", "dice"]
  },
  admin: {
    label: "⚙️ Admin Tools",
    emoji: "⚙️",
    color: 0xFFD700,
    icon: "🔧",
    description: "Server management and moderation commands.",
    commands: [] // Detected via adminOnly flag
  },
  info: {
    label: "ℹ️ Info & Utility",
    emoji: "ℹ️",
    color: 0x00F5D4,
    icon: "📋",
    description: "Bot information, stats, and utility commands.",
    commands: ["ping", "cmd", "help", "info", "serverinfo", "userstats", "changelog", "donate"]
  }
};

/**
 * Categorise a command into one of the CATEGORIES keys.
 * Admin commands are detected by the adminOnly flag.
 */
function categoriseCommand(command) {
  if (command.adminOnly) return "admin";
  const name = command.data.name;
  for (const [key, cat] of Object.entries(CATEGORIES)) {
    if (cat.commands.includes(name)) return key;
  }
  return "info"; // fallback
}

/**
 * Build the category embed for a given category key.
 */
function buildCategoryEmbed(categoryKey, commandsCollection) {
  const cat = CATEGORIES[categoryKey];
  const commands = [];

  commandsCollection.forEach(cmd => {
    if (categoriseCommand(cmd) === categoryKey) {
      const cooldown = cmd.cooldown ? ` ⏱️ ${cmd.cooldown}s` : "";
      commands.push(`> ${cat.icon} \`/${cmd.data.name}\`${cooldown}\n> *${cmd.data.description || "No description."}*`);
    }
  });

  const embed = new EmbedBuilder()
    .setColor(cat.color)
    .setTitle(`${cat.emoji}  ${cat.label}`)
    .setDescription(
      `${cat.description}\n\n` +
      `**${commands.length}** command${commands.length !== 1 ? "s" : ""} available\n` +
      `${"━".repeat(28)}\n\n` +
      (commands.length > 0 ? commands.join("\n\n") : "*No commands in this category yet.*")
    )
    .setFooter({ text: `ROP ECONOMY • ${cat.label}`, iconURL: null })
    .setTimestamp();

  return embed;
}

/**
 * Build the "All Commands" overview embed.
 */
function buildAllEmbed(commandsCollection) {
  const embed = new EmbedBuilder()
    .setColor(economyConfig.colors.info)
    .setTitle("📦  All Commands Overview")
    .setDescription("Here's every command grouped by category.\nUse the dropdown below to explore a specific category.\n" + `${"━".repeat(28)}`)
    .setFooter({ text: "ROP ECONOMY • Command Directory" })
    .setTimestamp();

  for (const [key, cat] of Object.entries(CATEGORIES)) {
    const cmds = [];
    commandsCollection.forEach(cmd => {
      if (categoriseCommand(cmd) === key) {
        cmds.push(`\`/${cmd.data.name}\``);
      }
    });
    if (cmds.length > 0) {
      embed.addFields({
        name: `${cat.emoji} ${cat.label}  (${cmds.length})`,
        value: cmds.join("  •  ").substring(0, 1024)
      });
    }
  }

  return embed;
}

// Export helpers so interactionCreate can use them
module.exports = {
  CATEGORIES,
  categoriseCommand,
  buildCategoryEmbed,
  buildAllEmbed,
  data: new SlashCommandBuilder()
    .setName("cmd")
    .setDescription("Browse all bot commands with an interactive menu."),
  cooldown: 3,
  async execute(interaction) {
    const commandsCollection = interaction.client.commands;

    // Count commands per category for the dropdown descriptions
    const counts = {};
    for (const key of Object.keys(CATEGORIES)) counts[key] = 0;
    commandsCollection.forEach(cmd => { counts[categoriseCommand(cmd)]++; });

    const totalCommands = commandsCollection.size;

    // Build intro embed
    const introEmbed = new EmbedBuilder()
      .setColor(economyConfig.colors.info)
      .setTitle("📚  ROP ECONOMY — Command Directory")
      .setDescription(
        `Welcome! This bot has **${totalCommands}** commands across **${Object.keys(CATEGORIES).length}** categories.\n\n` +
        `Use the **dropdown menu** below to browse commands by category.\n` +
        `${"━".repeat(28)}\n\n` +
        Object.entries(CATEGORIES).map(([key, cat]) =>
          `${cat.emoji}  **${cat.label}**  —  \`${counts[key]}\` commands`
        ).join("\n")
      )
      .setFooter({ text: "ROP ECONOMY • Select a category below" })
      .setTimestamp();

    // Build dropdown options with live command counts
    const options = [
      { label: "📦 All Commands", description: `View all ${totalCommands} commands at a glance`, value: "all", emoji: "📦" },
      ...Object.entries(CATEGORIES).map(([key, cat]) => ({
        label: cat.label,
        description: `${counts[key]} command${counts[key] !== 1 ? "s" : ""} — ${cat.description.substring(0, 50)}`,
        value: key,
        emoji: cat.emoji
      }))
    ];

    const selectMenu = createSelectMenu({
      customId: "cmd_menu",
      placeholder: "🔍 Choose a category to explore…",
      options
    });

    await interaction.reply({ embeds: [introEmbed], components: [selectMenu] });
  }
};
