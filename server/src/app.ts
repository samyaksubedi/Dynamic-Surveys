import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { envVariables } from "./configs/env.config.js";
import {
  errorMiddleware,
  notFoundMiddleware,
} from "./middlewares/error.middleware.js";
import { authRouter } from "./modules/auth/auth.router.js";
import { publicSurveysRouter } from "./modules/responses/public.router.js";
import { surveysRouter } from "./modules/surveys/surveys.router.js";
import { ApiResponse } from "./utils/api-output.util.js";

export const createApp = () => {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", envVariables.TRUST_PROXY);
  app.use(helmet());
  app.use(cors({ origin: envVariables.CLIENT_URL, credentials: true }));
  app.use(express.json({ limit: "100kb" }));
  app.use(cookieParser());

  app.get("/health", (_req, res) => {
    res.json(new ApiResponse(200, { status: "healthy" }, "API is healthy"));
  });
  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/surveys", surveysRouter);
  app.use("/api/v1/public/surveys", publicSurveysRouter);
  app.use(notFoundMiddleware);
  app.use(errorMiddleware);
  return app;
};

export const app = createApp();
