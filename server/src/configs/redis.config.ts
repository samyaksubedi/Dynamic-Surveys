import { Redis } from "ioredis";
import { envVariables } from "./env.config.js";

export const redisConnection = new Redis(envVariables.REDIS_URL, {
  lazyConnect: true,
  maxRetriesPerRequest: null,
  enableReadyCheck: true,
});

export const connectRedis = async () => {
  if (redisConnection.status === "wait") await redisConnection.connect();
  return redisConnection.ping();
};

export const disconnectRedis = async () => {
  if (redisConnection.status !== "end") await redisConnection.quit();
};
