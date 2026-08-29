import "dotenv/config";
import { z } from "zod";

const booleanString = z
  .enum(["true", "false"])
  .default("false")
  .transform((value) => value === "true");

const envSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    PORT: z.coerce.number().int().min(1).max(65535).default(3000),
    SERVER_URL: z.url().default("http://localhost:3000"),
    CLIENT_URL: z.url().default("http://localhost:5173"),
    DATABASE_URL: z.string().min(1),
    REDIS_URL: z.string().min(1),
    ACCESS_TOKEN_SECRET: z.string().min(32),
    REFRESH_TOKEN_DAYS: z.coerce.number().int().min(1).max(365).default(30),
    RESPONDENT_SESSION_DAYS: z.coerce
      .number()
      .int()
      .min(1)
      .max(365)
      .default(90),
    COOKIE_DOMAIN: z.string().optional(),
    TRUST_PROXY: z.string().default("loopback"),
    SUBMISSION_RATE_LIMIT_WINDOW_SECONDS: z.coerce
      .number()
      .int()
      .min(1)
      .default(60),
    SUBMISSION_RATE_LIMIT_MAX: z.coerce.number().int().min(1).default(10),
    EMAIL_DELIVERY_ENABLED: booleanString,
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.coerce.number().int().min(1).max(65535).default(587),
    SMTP_SECURE: booleanString,
    SMTP_USER: z.string().optional(),
    SMTP_PASSWORD: z.string().optional(),
    EMAIL_FROM: z.string().default("Dynamic Surveys <no-reply@example.com>"),
  })
  .superRefine((env, context) => {
    if (env.EMAIL_DELIVERY_ENABLED) {
      for (const key of ["SMTP_HOST", "SMTP_USER", "SMTP_PASSWORD"] as const) {
        if (!env[key]) {
          context.addIssue({
            code: "custom",
            path: [key],
            message: `${key} is required when email delivery is enabled`,
          });
        }
      }
    }
  });

export const envVariables = envSchema.parse(process.env);
