const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("dice")
    .setDescription("Roll a 6-sided die!"),
  cooldown: 3,
  async execute(interaction) {
    const result = Math.floor(Math.random() * 6) + 1;

    const embed = new EmbedBuilder()
      .setColor(0x9D4EDD) // Casino color
      .setTitle("🎲 Dice Roll")
      .setDescription(`You rolled a **${result}**!`)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
