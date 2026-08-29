import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { errorMiddleware } from "../../src/middlewares/error.middleware.js";
import { createSubmissionRateLimiter } from "../../src/middlewares/submission-rate-limit.middleware.js";

describe("submission rate limiter", () => {
  it("returns 429 after the configured maximum using the Redis command path", async () => {
    let count = 0;
    const redis = { eval: () => Promise.resolve(++count) };
    const app = express();
    app.post(
      "/",
      createSubmissionRateLimiter(redis as never, 60, 2),
      (_req, res) => res.sendStatus(204),
    );
    app.use(errorMiddleware);
    expect((await request(app).post("/")).status).toBe(204);
    expect((await request(app).post("/")).status).toBe(204);
    const limited = await request(app).post("/");
    expect(limited.status).toBe(429);
    expect((limited.body as { message: string }).message).toMatch(/too many/i);
  });
});
