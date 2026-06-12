const { ActivityType } = require("discord.js");

module.exports = {
  name: "clientReady",
  once: true,
  execute(client) {
    console.log(`[Ready] Logged in successfully as ${client.user.tag}!`);
    
    // Set a custom activity status
    client.user.setActivity("the economy | /balance", { 
      type: ActivityType.Watching 
    });
  }
};
