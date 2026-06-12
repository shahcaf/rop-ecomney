const { SlashCommandBuilder } = require('discord.js');
const { embedBuilder } = require('../../utils/embedBuilder');
const economyConfig = require('../../config/economy');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('interest')
    .setDescription('Collect interest on your bank balance (hourly).'),
  cooldown: 3600, // 1 hour cooldown
  category: 'Finance',
  async execute(interaction) {
    const userId = interaction.user.id;
    // Placeholder logic – real implementation will compute interest and add to bank.
    const embed = embedBuilder({
      title: '💰 Interest Collected',
      description: 'You have collected your hourly interest! (Feature coming soon)',
      color: economyConfig.colors.success,
    });
    await interaction.reply({ embeds: [embed], flags: 64 });
  },
};
