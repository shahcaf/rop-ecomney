const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

const hugGifs = [
  "https://media.giphy.com/media/3M4NpbLCTxBqU/giphy.gif",
  "https://media.giphy.com/media/sUIZWMnfd4Mb6/giphy.gif",
  "https://media.giphy.com/media/lrr9VkEEeUPYc/giphy.gif",
  "https://media.giphy.com/media/od5H3PmEG5EVq/giphy.gif",
  "https://media.giphy.com/media/wnsgren9NtITS/giphy.gif"
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName("hug")
    .setDescription("Give another user a warm hug!")
    .addUserOption(option => 
      option.setName("user")
        .setDescription("The user you want to hug")
        .setRequired(true)
    ),
  cooldown: 5,
  async execute(interaction) {
    const target = interaction.options.getUser("user");
    const sender = interaction.user;

    if (target.id === sender.id) {
      return interaction.reply({ content: "You can't hug yourself... but I'll hug you! 🫂", ephemeral: true });
    }

    const randomGif = hugGifs[Math.floor(Math.random() * hugGifs.length)];

    const embed = new EmbedBuilder()
      .setColor(0xFF0054) // Fun pink/red
      .setDescription(`🫂 **${sender.username}** gives **${target.username}** a warm hug!`)
      .setImage(randomGif)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
