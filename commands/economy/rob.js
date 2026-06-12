const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const UserModel = require("../../database/userModel");
const economyConfig = require("../../config/economy");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("rob")
    .setDescription("Attempt to steal coins from another user's wallet!")
    .addUserOption(option => 
      option.setName("target")
        .setDescription("The user you want to rob")
        .setRequired(true)
    ),
  cooldown: 600, // 10 minutes
  async execute(interaction) {
    const target = interaction.options.getUser("target");
    const attackerId = interaction.user.id;
    const emoji = economyConfig.currencyEmoji;

    if (target.id === attackerId) {
      return interaction.reply({ content: "You can't rob yourself!", ephemeral: true });
    }
    if (target.bot) {
      return interaction.reply({ content: "You can't rob a bot!", ephemeral: true });
    }

    const attackerData = await UserModel.get(attackerId);
    const targetData = await UserModel.get(target.id);

    if (attackerData.wallet < 200) {
      return interaction.reply({ content: `You need at least **200** ${emoji} in your wallet to attempt a robbery (in case you get caught and fined)!`, ephemeral: true });
    }

    if (targetData.wallet < 50) {
      return interaction.reply({ content: `**${target.username}** doesn't have enough coins in their wallet to be worth robbing.`, ephemeral: true });
    }

    // 40% chance of success
    const isSuccess = Math.random() < 0.4;

    if (isSuccess) {
      // Steal between 10% and 30% of their wallet
      const percent = (Math.floor(Math.random() * 20) + 10) / 100;
      const stolenAmount = Math.floor(targetData.wallet * percent);

      await UserModel.removeCoins(target.id, stolenAmount, "wallet");
      await UserModel.addCoins(attackerId, stolenAmount, "wallet");

      const embed = new EmbedBuilder()
        .setColor(economyConfig.colors.success)
        .setTitle("🥷 Robbery Successful!")
        .setDescription(`You successfully robbed **${target.username}** and got away with **${stolenAmount.toLocaleString()}** ${emoji}!`);
      
      return interaction.reply({ embeds: [embed] });
    } else {
      // Fail: get fined
      const fineAmount = Math.floor(Math.random() * 150) + 50; // Fine between 50 and 200
      await UserModel.removeCoins(attackerId, fineAmount, "wallet");

      const embed = new EmbedBuilder()
        .setColor(economyConfig.colors.error)
        .setTitle("🚨 Busted!")
        .setDescription(`You got caught trying to rob **${target.username}** and had to pay a fine of **${fineAmount.toLocaleString()}** ${emoji}!`);

      return interaction.reply({ embeds: [embed] });
    }
  }
};
