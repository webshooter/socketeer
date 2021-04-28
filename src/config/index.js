import dotenv from "dotenv";

// Set the NODE_ENV to "development" by default
process.env.NODE_ENV = process.env.NODE_ENV || "development";

const envFound = dotenv.config();
if (envFound.error) {
  // This error should crash whole process

  throw new Error("⚠️  Couldn't find .env file  ⚠️");
}

const toBool = (str) => str?.toLowerCase() === "true";

export default {
  apiVersion: "1.0.0",

  nodeEnv: process.env.NODE_ENV,

  port: parseInt(process.env.PORT, 10),

  autoJoinGames: toBool(process.env.AUTO_JOIN_GAMES),

  testLogging: toBool(process.env.TEST_LOGGING),
};
