const { EmbedBuilder, Collection, PermissionFlagsBits } = require('discord.js');
const economyConfig = require('../config/economy');
const { embedBuilder } = require('../utils/embedBuilder');

// Collection to track command cooldowns
const cooldowns = new Collection();

module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    // ---- Dropdown menu handling for /cmd ----
    if (interaction.isStringSelectMenu() && interaction.customId === 'cmd_menu') {
      const category = interaction.values[0];
      const commandsCollection = interaction.client.commands;

      // Import helpers from the cmd command file
      const { buildCategoryEmbed, buildAllEmbed, CATEGORIES, categoriseCommand } = require('../commands/economy/cmd');
      const { createSelectMenu } = require('../components/selectMenu');

      // Build the appropriate embed
      const embed = category === 'all'
        ? buildAllEmbed(commandsCollection)
        : buildCategoryEmbed(category, commandsCollection);

      // Rebuild dropdown so the user can keep browsing (persistent menu)
      const counts = {};
      for (const key of Object.keys(CATEGORIES)) counts[key] = 0;
      commandsCollection.forEach(cmd => { counts[categoriseCommand(cmd)]++; });
      const totalCommands = commandsCollection.size;

      const options = [
        { label: "📦 All Commands", description: `View all ${totalCommands} commands`, value: "all", emoji: "📦" },
        ...Object.entries(CATEGORIES).map(([key, cat]) => ({
          label: cat.label,
          description: `${counts[key]} commands`,
          value: key,
          emoji: cat.emoji
        }))
      ];

      const selectMenu = createSelectMenu({
        customId: 'cmd_menu',
        placeholder: '🔍 Choose another category…',
        options
      });

      await interaction.update({ embeds: [embed], components: [selectMenu] });
      return;
    }

    // ---- Slash command handling ----
    if (!interaction.isChatInputCommand()) return;

    const { client, commandName, user, member } = interaction;
    const command = client.commands.get(commandName);

    if (!command) {
      console.error(`Command ${commandName} was not found in client commands collection.`);
      return;
    }

    // Admin permission check
    if (command.adminOnly) {
      if (!member || !member.permissions.has(PermissionFlagsBits.Administrator)) {
        const errorEmbed = embedBuilder({
          title: '❌ Permission Denied',
          description: 'You need **Administrator** permissions to use this admin command.',
          color: economyConfig.colors.error
        });
        return interaction.reply({ embeds: [errorEmbed], flags: 64 });
      }
    }

    // Cooldown handling
    if (command.cooldown) {
      if (!cooldowns.has(command.name)) cooldowns.set(command.name, new Collection());
      const now = Date.now();
      const timestamps = cooldowns.get(command.name);
      const cooldownAmount = command.cooldown * 1000;

      if (timestamps.has(user.id)) {
        const expirationTime = timestamps.get(user.id) + cooldownAmount;
        if (now < expirationTime) {
          const timeLeft = (expirationTime - now) / 1000;
          const cooldownEmbed = embedBuilder({
            title: '⏳ Take a Breath',
            description: `Please wait **${timeLeft.toFixed(1)}** more second(s) before running \`/${command.name}\`.`,
            color: economyConfig.colors.error
          });
          return interaction.reply({ embeds: [cooldownEmbed], flags: 64 });
        }
      }
      timestamps.set(user.id, now);
      setTimeout(() => timestamps.delete(user.id), cooldownAmount);
    }

    // Execute command
    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(`[Execution Error] Command: /${commandName} | User: ${user.tag} (${user.id})`);
      console.error(error);
      const failEmbed = embedBuilder({
        title: '⚠️ Command Execution Failed',
        description: 'An error occurred while running this command. Please try again later.',
        color: economyConfig.colors.error
      });
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ embeds: [failEmbed], flags: 64 });
      } else {
        await interaction.reply({ embeds: [failEmbed], flags: 64 });
      }
    }
  }
};
