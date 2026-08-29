import { Queue } from "bullmq";
import { redisConnection } from "../../configs/redis.config.js";

export const EMAIL_QUEUE_KEY = "dynamic-surveys-email";
export const emailQueue = new Queue(EMAIL_QUEUE_KEY, {
  connection: redisConnection,
});
