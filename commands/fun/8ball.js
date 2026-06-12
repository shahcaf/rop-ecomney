const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

const answers = [
  "It is certain.",
  "It is decidedly so.",
  "Without a doubt.",
  "Yes - definitely.",
  "You may rely on it.",
  "As I see it, yes.",
  "Most likely.",
  "Outlook good.",
  "Yes.",
  "Signs point to yes.",
  "Reply hazy, try again.",
  "Ask again later.",
  "Better not tell you now.",
  "Cannot predict now.",
  "Concentrate and ask again.",
  "Don't count on it.",
  "My reply is no.",
  "My sources say no.",
  "Outlook not so good.",
  "Very doubtful."
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName("8ball")
    .setDescription("Ask the magic 8-ball a question!")
    .addStringOption(option => 
      option.setName("question")
        .setDescription("The question you want to ask")
        .setRequired(true)
    ),
  cooldown: 5,
  async execute(interaction) {
    const question = interaction.options.getString("question");
    const answer = answers[Math.floor(Math.random() * answers.length)];

    const embed = new EmbedBuilder()
      .setColor(0x000000) // Black for 8-ball
      .setTitle("🎱 Magic 8-Ball")
      .addFields(
        { name: "❓ Question", value: question },
        { name: "🔮 Answer", value: answer }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
