import type { RequestHandler } from "express";
import type { Redis } from "ioredis";
import { envVariables } from "../configs/env.config.js";
import { redisConnection } from "../configs/redis.config.js";
import { ApiError } from "../utils/api-output.util.js";

type RedisRateLimitClient = Pick<Redis, "eval">;
const script = `
local current = redis.call('INCR', KEYS[1])
if current == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end
return current
`;

export const createSubmissionRateLimiter =
  (
    redis: RedisRateLimitClient = redisConnection,
    windowSeconds = envVariables.SUBMISSION_RATE_LIMIT_WINDOW_SECONDS,
    maximum = envVariables.SUBMISSION_RATE_LIMIT_MAX,
  ): RequestHandler =>
  async (req, res, next) => {
    try {
      const ip = req.ip ?? "unknown";
      const bucket = Math.floor(Date.now() / (windowSeconds * 1000));
      const key = `rate-limit:survey-submit:${ip}:${bucket}`;
      const count = Number(await redis.eval(script, 1, key, windowSeconds));
      res.setHeader("RateLimit-Limit", maximum);
      res.setHeader("RateLimit-Remaining", Math.max(0, maximum - count));
      if (count > maximum)
        throw new ApiError(
          429,
          "Too many submission attempts. Please try again later.",
        );
      next();
    } catch (error) {
      next(error);
    }
  };
