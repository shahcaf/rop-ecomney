const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const UserModel = require("../../database/userModel");
const economyConfig = require("../../config/economy");

const successMessages = [
  "A rich stranger felt bad for you and gave you **{amount}** {emoji}.",
  "You found **{amount}** {emoji} on the ground while begging.",
  "Someone threw **{amount}** {emoji} at you. Ouch, but yay!",
  "A passing noble tossed you **{amount}** {emoji}."
];

const failMessages = [
  "No one gave you anything. Get a job!",
  "A stranger looked at you in disgust and walked away.",
  "You begged for hours but only got dust.",
  "Someone offered you a job instead of coins. You ran away."
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName("beg")
    .setDescription("Beg for some spare coins."),
  cooldown: 120, // 2 minutes
  async execute(interaction) {
    const userId = interaction.user.id;
    const emoji = economyConfig.currencyEmoji;

    // 60% chance of success
    const isSuccess = Math.random() < 0.6;

    if (isSuccess) {
      const amount = Math.floor(Math.random() * 50) + 10; // Between 10 and 60 coins
      await UserModel.addCoins(userId, amount, "wallet");

      const msg = successMessages[Math.floor(Math.random() * successMessages.length)]
        .replace("{amount}", amount)
        .replace("{emoji}", emoji);

      const embed = new EmbedBuilder()
        .setColor(economyConfig.colors.success)
        .setDescription(msg);

      return interaction.reply({ embeds: [embed] });
    } else {
      const msg = failMessages[Math.floor(Math.random() * failMessages.length)];
      
      const embed = new EmbedBuilder()
        .setColor(economyConfig.colors.error)
        .setDescription(msg);

      return interaction.reply({ embeds: [embed] });
    }
  }
};
