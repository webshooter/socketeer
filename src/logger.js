import bunyan from "bunyan";
import config from "./config";

const logger = bunyan.createLogger({ name: "socketeer" });

const level = config.nodeEnv === "test" && !config.testLogging
  ? bunyan.FATAL + 1
  : bunyan.INFO;

logger.level(level);

export default logger;
