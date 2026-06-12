const { Client, Collection, GatewayIntentBits } = require("discord.js");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

// Verify Discord Token exists
if (!process.env.DISCORD_TOKEN) {
  console.error("Error: DISCORD_TOKEN is missing in the .env file!");
  process.exit(1);
}

// Instantiate Discord Bot client with minimal Intents
// GatewayIntentBits.Guilds is required for slash command registrations and handling
const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// Collection to hold command list
client.commands = new Collection();

// Load Commands from subfolders
const commandsPath = path.join(__dirname, "commands");
if (fs.existsSync(commandsPath)) {
  const commandFolders = fs.readdirSync(commandsPath);
  
  for (const folder of commandFolders) {
    const folderPath = path.join(commandsPath, folder);
    if (!fs.statSync(folderPath).isDirectory()) continue;
    
    const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith(".js"));
    
    for (const file of commandFiles) {
      const filePath = path.join(folderPath, file);
      const command = require(filePath);
      
      if ("data" in command && "execute" in command) {
        client.commands.set(command.data.name, command);
      } else {
        console.warn(`[WARNING] The command at ${filePath} is missing "data" or "execute".`);
      }
    }
  }
} else {
  console.error(`Error: Commands folder not found at ${commandsPath}`);
}

// Load Event Handlers from events folder
const eventsPath = path.join(__dirname, "events");
if (fs.existsSync(eventsPath)) {
  const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith(".js"));
  
  for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    
    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args));
    } else {
      client.on(event.name, (...args) => event.execute(...args));
    }
    console.log(`[Event Registered] Listener initialized for: "${event.name}"`);
  }
} else {
  console.error(`Error: Events folder not found at ${eventsPath}`);
}

const connectDB = require("./database/db");

// Handle unhandled promise rejections to avoid bot crashing
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

// Connect to MongoDB and then start the Discord bot client
(async () => {
  await connectDB();

  client.login(process.env.DISCORD_TOKEN).catch(err => {
    console.error("Failed to connect to Discord Gateway. Check if your token is valid!");
    console.error(err);
  });
})();
