import { emailQueue } from "./email.queue.js";

export type EmailJob = {
  emailType: "verification";
  to: string;
  name: string;
  token: string;
};

export const enqueueEmail = (data: EmailJob) =>
  emailQueue.add(data.emailType, data, {
    attempts: 3,
    backoff: { type: "exponential", delay: 4000 },
    removeOnComplete: 100,
    removeOnFail: 100,
  });
