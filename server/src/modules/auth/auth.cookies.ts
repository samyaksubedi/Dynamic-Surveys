import type { CookieOptions } from "express";
import { envVariables } from "../../configs/env.config.js";

const baseCookieOptions = (): CookieOptions => {
  const options: CookieOptions = {
    httpOnly: true,
    secure: envVariables.NODE_ENV === "production",
    sameSite: envVariables.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
  };
  if (envVariables.COOKIE_DOMAIN) options.domain = envVariables.COOKIE_DOMAIN;
  return options;
};

export const refreshCookieOptions = (expires?: Date): CookieOptions => ({
  ...baseCookieOptions(),
  ...(expires ? { expires } : {}),
});

export const respondentCookieOptions = (expires: Date): CookieOptions => ({
  ...baseCookieOptions(),
  expires,
});
