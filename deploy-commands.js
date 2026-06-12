const { REST, Routes } = require("discord.js");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

// Ensure environment variables are loaded
if (!process.env.DISCORD_TOKEN || !process.env.CLIENT_ID) {
  console.error("Error: Missing DISCORD_TOKEN or CLIENT_ID in your .env file!");
  process.exit(1);
}

const commands = [];

// Recursively traverse commands directories
const commandsPath = path.join(__dirname, "commands");
if (!fs.existsSync(commandsPath)) {
  console.error(`Error: Commands folder not found at ${commandsPath}`);
  process.exit(1);
}

const commandFolders = fs.readdirSync(commandsPath);

for (const folder of commandFolders) {
  const folderPath = path.join(commandsPath, folder);
  // Check if it is a directory
  if (!fs.statSync(folderPath).isDirectory()) continue;

  const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith(".js"));
  
  for (const file of commandFiles) {
    const filePath = path.join(folderPath, file);
    const command = require(filePath);
    
    if ("data" in command && "execute" in command) {
      commands.push(command.data.toJSON());
      console.log(`[Loaded Command] /${command.data.name} (from /commands/${folder}/${file})`);
    } else {
      console.warn(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
  }
}

// Instantiate Discord REST API client
const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

// Deploy slash commands
(async () => {
  try {
    console.log(`\nStarted refreshing ${commands.length} application (/) commands...`);

    if (process.env.GUILD_ID && process.env.GUILD_ID.trim() !== "") {
      // Local Guild deployment (Instant update - recommended for development/testing)
      console.log(`Targeting Guild ID: ${process.env.GUILD_ID}`);
      const data = await rest.put(
        Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
        { body: commands }
      );
      console.log(`Successfully reloaded ${data.length} application (/) commands for development guild.`);
    } else {
      // Global deployment (Takes up to 1 hour to propagate across Discord)
      console.log("No GUILD_ID found. Deploying commands GLOBALLY.");
      const data = await rest.put(
        Routes.applicationCommands(process.env.CLIENT_ID),
        { body: commands }
      );
      console.log(`Successfully reloaded ${data.length} application (/) commands globally.`);
    }
  } catch (error) {
    console.error("Error encountered during slash command deployment:");
    console.error(error);
  }
})();
