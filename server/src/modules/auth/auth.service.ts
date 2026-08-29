import { envVariables } from "../../configs/env.config.js";
import { enqueueEmail } from "../../jobs/email/email.producer.js";
import { ApiError } from "../../utils/api-output.util.js";
import { hashToken } from "../../utils/crypto.util.js";
import { comparePassword, hashPassword } from "./auth.crypto.js";
import type { EmailInput, SignInInput, SignUpInput } from "./auth.schema.js";
import {
  generateAccessToken,
  generateEmailVerificationToken,
  generateRefreshToken,
} from "./auth.tokens.js";
import { userRepository } from "./user.repository.js";
import { userSessionRepository } from "./user-session.repository.js";

const signUp = async (data: SignUpInput) => {
  if (await userRepository.findAuthByEmail(data.email)) {
    throw new ApiError(409, "User already exists with this email");
  }
  const verification = generateEmailVerificationToken();
  const user = await userRepository.create({
    name: data.name,
    email: data.email,
    passwordHash: await hashPassword(data.password),
    emailVerificationTokenHash: verification.tokenHash,
    emailVerificationTokenExpires: verification.expiresAt,
  });
  if (envVariables.EMAIL_DELIVERY_ENABLED) {
    await enqueueEmail({
      emailType: "verification",
      to: user.email,
      name: user.name,
      token: verification.token,
    });
  }
  return user;
};

const resendVerification = async (data: EmailInput) => {
  const user = await userRepository.findAuthByEmail(data.email);
  if (!user) throw new ApiError(404, "User not found with this email");
  if (user.isVerified) throw new ApiError(409, "User is already verified");
  const verification = generateEmailVerificationToken();
  await userRepository.update(user.id, {
    emailVerificationTokenHash: verification.tokenHash,
    emailVerificationTokenExpires: verification.expiresAt,
  });
  if (envVariables.EMAIL_DELIVERY_ENABLED) {
    await enqueueEmail({
      emailType: "verification",
      to: user.email,
      name: user.name,
      token: verification.token,
    });
  }
};

const verify = async (token: string) => {
  const user = await userRepository.findByVerificationTokenHash(
    hashToken(token),
  );
  if (!user) throw new ApiError(400, "Verification link invalid");
  if (
    !user.emailVerificationTokenExpires ||
    user.emailVerificationTokenExpires < new Date()
  ) {
    throw new ApiError(400, "Verification link expired");
  }
  await userRepository.update(user.id, {
    isVerified: true,
    emailVerificationTokenHash: null,
    emailVerificationTokenExpires: null,
  });
};

const signIn = async (
  data: SignInInput & { ipAddress: string; userAgent: string },
) => {
  const user = await userRepository.findAuthByEmail(data.email);
  if (!user || !(await comparePassword(data.password, user.passwordHash))) {
    throw new ApiError(401, "Invalid credentials");
  }
  if (!user.isVerified)
    throw new ApiError(401, "Please verify your email first");

  const refresh = generateRefreshToken();
  const session = await userSessionRepository.create({
    userId: user.id,
    refreshTokenHash: refresh.tokenHash,
    refreshTokenExpires: refresh.expiresAt,
    ipAddress: data.ipAddress,
    deviceInfo: { userAgent: data.userAgent },
  });
  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      isVerified: user.isVerified,
    },
    accessToken: generateAccessToken({
      id: user.id,
      email: user.email,
      sessionId: session.id,
    }),
    refreshToken: refresh.token,
    refreshTokenExpires: refresh.expiresAt,
  };
};

const refresh = async (refreshToken: string) => {
  const session = await userSessionRepository.findByRefreshTokenHash(
    hashToken(refreshToken),
  );
  if (!session || session.refreshTokenExpires <= new Date()) {
    throw new ApiError(
      401,
      "Invalid or expired refresh token. Please login again.",
    );
  }
  const user = await userRepository.findAuthByEmail(
    (await userRepository.findPublicById(session.userId))?.email ?? "",
  );
  if (!user) throw new ApiError(401, "User not found");
  await userSessionRepository.touch(session.id);
  return generateAccessToken({
    id: user.id,
    email: user.email,
    sessionId: session.id,
  });
};

export const authService = {
  signUp,
  resendVerification,
  verify,
  signIn,
  refresh,
  getMe: (userId: string) => userRepository.findPublicById(userId),
  logout: (sessionId: string) => userSessionRepository.delete(sessionId),
  logoutAll: (userId: string) => userSessionRepository.deleteAll(userId),
  listSessions: (userId: string) => userSessionRepository.list(userId),
};
