import type { RequestHandler } from "express";
import { ApiError, ApiResponse } from "../../utils/api-output.util.js";
import { refreshCookieOptions } from "./auth.cookies.js";
import type { EmailInput, SignInInput, SignUpInput } from "./auth.schema.js";
import { authService } from "./auth.service.js";

export const signUp: RequestHandler = async (req, res, next) => {
  try {
    const user = await authService.signUp(req.body as SignUpInput);
    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          { user },
          "User registered successfully. Please verify your email.",
        ),
      );
  } catch (error) {
    next(error);
  }
};

export const resendVerification: RequestHandler = async (req, res, next) => {
  try {
    await authService.resendVerification(req.body as EmailInput);
    res.json(
      new ApiResponse(200, null, "Verification email queued successfully"),
    );
  } catch (error) {
    next(error);
  }
};

export const verify: RequestHandler = async (req, res, next) => {
  try {
    const token = req.params.token;
    await authService.verify(
      Array.isArray(token) ? (token[0] ?? "") : (token ?? ""),
    );
    res.json(new ApiResponse(200, null, "User verified successfully"));
  } catch (error) {
    next(error);
  }
};

export const signIn: RequestHandler = async (req, res, next) => {
  try {
    const result = await authService.signIn({
      ...(req.body as SignInInput),
      ipAddress: req.ip ?? "unknown",
      userAgent: req.get("user-agent") ?? "unknown",
    });
    res.cookie(
      "refreshToken",
      result.refreshToken,
      refreshCookieOptions(result.refreshTokenExpires),
    );
    res.json(
      new ApiResponse(
        200,
        { accessToken: result.accessToken, user: result.user },
        "User logged in successfully",
      ),
    );
  } catch (error) {
    next(error);
  }
};

export const refresh: RequestHandler = async (req, res, next) => {
  try {
    const cookies = req.cookies as Record<string, unknown> | undefined;
    const token =
      typeof cookies?.refreshToken === "string"
        ? cookies.refreshToken
        : undefined;
    if (!token) throw new ApiError(401, "Refresh token is missing");
    const accessToken = await authService.refresh(token);
    res.json(
      new ApiResponse(
        200,
        { accessToken },
        "Access token generated successfully",
      ),
    );
  } catch (error) {
    next(error);
  }
};

export const logout: RequestHandler = async (req, res, next) => {
  try {
    await authService.logout(req.user.sessionId);
    res.clearCookie("refreshToken", refreshCookieOptions());
    res.json(new ApiResponse(200, null, "User logged out successfully"));
  } catch (error) {
    next(error);
  }
};

export const logoutAll: RequestHandler = async (req, res, next) => {
  try {
    const result = await authService.logoutAll(req.user.id);
    res.clearCookie("refreshToken", refreshCookieOptions());
    res.json(
      new ApiResponse(
        200,
        { revokedSessions: result.count },
        "User logged out from all devices",
      ),
    );
  } catch (error) {
    next(error);
  }
};

export const getMe: RequestHandler = async (req, res, next) => {
  try {
    const user = await authService.getMe(req.user.id);
    if (!user) throw new ApiError(404, "User not found");
    res.json(new ApiResponse(200, { user }, "User fetched successfully"));
  } catch (error) {
    next(error);
  }
};

export const listSessions: RequestHandler = async (req, res, next) => {
  try {
    const sessions = (await authService.listSessions(req.user.id)).map(
      (session) => ({
        ...session,
        isCurrent: session.id === req.user.sessionId,
      }),
    );
    res.json(
      new ApiResponse(200, { sessions }, "Sessions fetched successfully"),
    );
  } catch (error) {
    next(error);
  }
};
