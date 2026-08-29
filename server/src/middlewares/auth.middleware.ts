import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { envVariables } from "../configs/env.config.js";
import { prisma } from "../db/db.client.js";
import type { AccessTokenPayload } from "../modules/auth/auth.types.js";
import { ApiError } from "../utils/api-output.util.js";

export const authenticateUser: RequestHandler = async (req, _res, next) => {
  try {
    const authorization = req.headers.authorization;
    if (!authorization?.startsWith("Bearer "))
      throw new ApiError(401, "No token provided");

    let payload: AccessTokenPayload;
    try {
      payload = jwt.verify(
        authorization.slice("Bearer ".length),
        envVariables.ACCESS_TOKEN_SECRET,
      ) as AccessTokenPayload;
    } catch (error) {
      throw new ApiError(
        401,
        error instanceof jwt.TokenExpiredError
          ? "Token expired"
          : "Invalid token",
      );
    }

    const session = await prisma.userSession.findFirst({
      where: {
        id: payload.sessionId,
        userId: payload.id,
        refreshTokenExpires: { gt: new Date() },
      },
      select: { id: true },
    });
    if (!session) throw new ApiError(401, "Session expired or revoked");

    req.user = payload;
    next();
  } catch (error) {
    next(error);
  }
};
