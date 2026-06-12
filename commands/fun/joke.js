const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const economyConfig = require("../../config/economy");

const jokes = [
  "Why don't scientists trust atoms? Because they make up everything!",
  "What do you call a fake noodle? An impasta.",
  "Why did the scarecrow win an award? Because he was outstanding in his field!",
  "Why don't skeletons fight each other? They don't have the guts.",
  "What do you call cheese that isn't yours? Nacho cheese.",
  "I'm reading a book on anti-gravity. I can't put it down!",
  "Did you hear about the mathematician who's afraid of negative numbers? He'll stop at nothing to avoid them.",
  "Why do programmers prefer dark mode? Because light attracts bugs.",
  "How many programmers does it take to change a light bulb? None, that's a hardware problem."
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName("joke")
    .setDescription("Get a random funny joke!"),
  cooldown: 5,
  async execute(interaction) {
    const randomJoke = jokes[Math.floor(Math.random() * jokes.length)];

    const embed = new EmbedBuilder()
      .setColor(0xFF0054) // Fun pink/red
      .setTitle("😂 Random Joke")
      .setDescription(`*${randomJoke}*`)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
