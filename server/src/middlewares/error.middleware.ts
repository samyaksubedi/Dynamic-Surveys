import type { ErrorRequestHandler, RequestHandler } from "express";
import { Prisma } from "../generated/prisma/client.js";
import { logger } from "../configs/logger.config.js";
import { ApiError } from "../utils/api-output.util.js";

export const notFoundMiddleware: RequestHandler = (req, _res, next) => {
  next(new ApiError(404, `Route ${req.method} ${req.originalUrl} not found`));
};

export const errorMiddleware: ErrorRequestHandler = (
  error,
  req,
  res,
  _next,
) => {
  if (error instanceof ApiError) {
    res.status(error.statusCode).json(error);
    return;
  }

  if (error instanceof SyntaxError && "body" in error) {
    res.status(400).json(new ApiError(400, "Malformed JSON request body"));
    return;
  }

  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    res
      .status(409)
      .json(new ApiError(409, "A record with these values already exists."));
    return;
  }

  logger.error("Unhandled request error", {
    method: req.method,
    route: req.originalUrl,
    error: error instanceof Error ? error.message : String(error),
  });
  res.status(500).json(new ApiError(500, "Internal Server Error"));
};
