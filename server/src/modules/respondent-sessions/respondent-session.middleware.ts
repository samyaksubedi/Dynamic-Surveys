import type { RequestHandler } from "express";
import { envVariables } from "../../configs/env.config.js";
import { prisma } from "../../db/db.client.js";
import { respondentCookieOptions } from "../auth/auth.cookies.js";
import { generateOpaqueToken, hashToken } from "../../utils/crypto.util.js";

export const RESPONDENT_COOKIE_NAME = "respondentSession";

export const ensureRespondentSession: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const cookies = req.cookies as Record<string, unknown> | undefined;
    const cookieValue = cookies?.[RESPONDENT_COOKIE_NAME];
    const token = typeof cookieValue === "string" ? cookieValue : undefined;
    const existing = token
      ? await prisma.respondentSession.findFirst({
          where: { tokenHash: hashToken(token), expiresAt: { gt: new Date() } },
          select: { id: true },
        })
      : null;
    if (existing) {
      req.respondentSession = existing;
      next();
      return;
    }

    const newToken = generateOpaqueToken();
    const expiresAt = new Date(
      Date.now() + envVariables.RESPONDENT_SESSION_DAYS * 24 * 60 * 60 * 1000,
    );
    const session = await prisma.respondentSession.create({
      data: { tokenHash: hashToken(newToken), expiresAt },
      select: { id: true },
    });
    res.cookie(
      RESPONDENT_COOKIE_NAME,
      newToken,
      respondentCookieOptions(expiresAt),
    );
    req.respondentSession = session;
    next();
  } catch (error) {
    next(error);
  }
};
