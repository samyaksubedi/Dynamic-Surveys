import { createServer } from "node:http";
import { app } from "./app.js";
import { envVariables } from "./configs/env.config.js";
import { connectRedis, disconnectRedis } from "./configs/redis.config.js";
import { logger } from "./configs/logger.config.js";
import { connectPostgres, disconnectPostgres } from "./db/db.client.js";

const start = async () => {
  await connectPostgres();
  const redisResult = await connectRedis();
  if (redisResult !== "PONG")
    throw new Error(`Unexpected Redis PING response: ${String(redisResult)}`);

  const server = createServer(app);
  server.listen(envVariables.PORT, () => {
    logger.info("Server started", {
      port: envVariables.PORT,
      url: envVariables.SERVER_URL,
    });
  });

  const shutdown = (signal: string) => {
    logger.info("Graceful shutdown started", { signal });
    server.close(() => {
      void Promise.all([disconnectPostgres(), disconnectRedis()]).finally(() =>
        process.exit(0),
      );
    });
  };
  process.once("SIGINT", () => shutdown("SIGINT"));
  process.once("SIGTERM", () => shutdown("SIGTERM"));
};

start().catch((error: unknown) => {
  logger.error("Server startup failed", {
    error: error instanceof Error ? error.message : String(error),
  });
  process.exit(1);
});
