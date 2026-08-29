import { Worker } from "bullmq";
import { redisConnection } from "../../configs/redis.config.js";
import { logger } from "../../configs/logger.config.js";
import { sendVerificationEmail } from "../../modules/auth/auth.email.js";
import type { EmailJob } from "./email.producer.js";
import { EMAIL_QUEUE_KEY } from "./email.queue.js";

const worker = new Worker<EmailJob>(
  EMAIL_QUEUE_KEY,
  async (job) => sendVerificationEmail(job.data),
  { connection: redisConnection },
);

worker.on("completed", (job) =>
  logger.info("Email job completed", { jobId: job.id }),
);
worker.on("failed", (job, error) =>
  logger.error("Email job failed", { jobId: job?.id, error: error.message }),
);
worker.on("error", (error) =>
  logger.error("Email worker Redis error", { error: error.message }),
);

const shutdown = async () => {
  await worker.close();
  process.exit(0);
};
process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
