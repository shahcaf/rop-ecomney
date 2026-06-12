const { EmbedBuilder } = require('discord.js');
const economyConfig = require('../config/economy');

/**
 * Returns a new EmbedBuilder pre‑styled with the bot's colour palette and branding.
 * @param {Object} options { title?, description?, color? }
 */
function embedBuilder({ title = null, description = null, color = economyConfig.colors.info } = {}) {
  const embed = new EmbedBuilder()
    .setColor(color)
    .setFooter({ text: economyConfig.brandTag || 'EconomyBot • Premium Economy', iconURL: null })
    .setTimestamp();
  if (title) embed.setTitle(title);
  if (description) embed.setDescription(description);
  return embed;
}

module.exports = { embedBuilder };
