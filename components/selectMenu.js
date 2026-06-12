const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

/**
 * Creates a Select Menu (dropdown) for the /cmd command.
 * @param {Object} params
 * @param {Array<{label:string,value:string,description?:string,emoji?:string}>} params.options - Menu options.
 * @param {string} [params.customId='cmd_select'] - Custom ID for the select menu.
 * @param {string} [params.placeholder='Choose a command category...'] - Placeholder text.
 * @returns {ActionRowBuilder} Discord ActionRow containing the menu.
 */
function createSelectMenu({ options = [], customId = 'cmd_select', placeholder = 'Choose a command category...' } = {}) {
  const menu = new StringSelectMenuBuilder()
    .setCustomId(customId)
    .setPlaceholder(placeholder)
    .addOptions(
      options.map(opt => ({
        label: opt.label,
        value: opt.value,
        description: opt.description ?? '',
        emoji: opt.emoji ?? undefined
      }))
    );
  return new ActionRowBuilder().addComponents(menu);
}

module.exports = { createSelectMenu };
