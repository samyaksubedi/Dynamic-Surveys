import jwt from "jsonwebtoken";
import { envVariables } from "../../configs/env.config.js";
import { generateOpaqueToken, hashToken } from "../../utils/crypto.util.js";
import type { AccessTokenPayload } from "./auth.types.js";

export const generateEmailVerificationToken = () => {
  const token = generateOpaqueToken(32);
  return {
    token,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  };
};

export const generateAccessToken = (payload: AccessTokenPayload) =>
  jwt.sign(payload, envVariables.ACCESS_TOKEN_SECRET, { expiresIn: "15m" });

export const generateRefreshToken = () => {
  const token = generateOpaqueToken(64);
  return {
    token,
    tokenHash: hashToken(token),
    expiresAt: new Date(
      Date.now() + envVariables.REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000,
    ),
  };
};
