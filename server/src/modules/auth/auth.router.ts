import { Router } from "express";
import { authenticateUser } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  getMe,
  listSessions,
  logout,
  logoutAll,
  refresh,
  resendVerification,
  signIn,
  signUp,
  verify,
} from "./auth.controller.js";
import {
  emailSchema,
  signInSchema,
  signUpSchema,
  verifyUserSchema,
} from "./auth.schema.js";

export const authRouter = Router();
authRouter.post("/sign-up", validate({ schema: signUpSchema }), signUp);
authRouter.post(
  "/resend-verification",
  validate({ schema: emailSchema }),
  resendVerification,
);
authRouter.get(
  "/verify/:token",
  validate({ schema: verifyUserSchema, source: "params" }),
  verify,
);
authRouter.post("/sign-in", validate({ schema: signInSchema }), signIn);
authRouter.post("/refresh", refresh);
authRouter.post("/logout", authenticateUser, logout);
authRouter.post("/logout-all", authenticateUser, logoutAll);
authRouter.get("/me", authenticateUser, getMe);
authRouter.get("/sessions", authenticateUser, listSessions);
