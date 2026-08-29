import type { AccessTokenPayload } from "../modules/auth/auth.types.js";

declare global {
  namespace Express {
    interface Request {
      user: AccessTokenPayload;
      respondentSession?: { id: string };
    }
  }
}

export {};
