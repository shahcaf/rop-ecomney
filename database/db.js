const { PrismaClient } = require('@prisma/client');
require("dotenv").config();

const prisma = new PrismaClient();

/**
 * Establish a connection to the CockroachDB cluster using the URL supplied in .env
 */
const connectDB = async () => {
  try {
    const url = process.env.DATABASE_URL;
    if (!url || url.trim() === "") {
      throw new Error("DATABASE_URL is missing or empty in your .env file!");
    }

    // Test the connection
    await prisma.$connect();
    console.log("[Database] Connected to CockroachDB database successfully.");
  } catch (error) {
    console.error("[Database Connection Error]");
    console.error(error);
    process.exit(1);
  }
};

module.exports = { connectDB, prisma };
