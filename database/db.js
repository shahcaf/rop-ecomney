const mongoose = require("mongoose");
const dns = require("dns");
require("dotenv").config();

// Fix for Node.js 18+ DNS resolution issues on local environments when connecting to MongoDB Atlas SRV links
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder("ipv4first");
}

/**
 * Establish a connection to the MongoDB cluster using the URL supplied in .env
 */
const connectDB = async () => {
  try {
    const url = process.env.DATABASE_URL;
    if (!url || url.trim() === "") {
      throw new Error("DATABASE_URL is missing or empty in your .env file!");
    }

    // Set connection options (Mongoose 6+ has standard connection settings, but keeping it clean)
    await mongoose.connect(url);
    console.log("[Database] Connected to MongoDB database successfully.");
  } catch (error) {
    console.error("[Database Connection Error]");
    console.error(error);
    process.exit(1);
  }
};

module.exports = connectDB;
