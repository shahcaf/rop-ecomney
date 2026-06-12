const { REST, Routes, Client, GatewayIntentBits } = require("discord.js");
require("dotenv").config();

if (!process.env.DISCORD_TOKEN || !process.env.CLIENT_ID) {
  console.error("Missing token or client ID");
  process.exit(1);
}

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', async () => {
  try {
    console.log("Clearing global commands...");
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: [] });
    console.log("Global commands cleared.");

    console.log("Clearing guild commands...");
    const guilds = client.guilds.cache.map(guild => guild.id);
    for (const guildId of guilds) {
      console.log(`Clearing commands for guild ${guildId}...`);
      await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, guildId), { body: [] });
    }
    console.log("Guild commands cleared.");

    console.log("All commands wiped! You can now run deploy-commands.js to register them freshly.");
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
});

client.login(process.env.DISCORD_TOKEN);
