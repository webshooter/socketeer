import bunyan from "bunyan";

const logger = bunyan.createLogger({ name: "game-server" });

const level = process.env.NODE_ENV === "test"
  ? bunyan.FATAL + 1
  : bunyan.INFO;

logger.level(level);

export default logger;
