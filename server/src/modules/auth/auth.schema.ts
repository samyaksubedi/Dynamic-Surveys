import { z } from "zod";

export const signUpSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.email().trim().toLowerCase().max(254),
  password: z.string().min(8).max(128),
});

export const signInSchema = z.object({
  email: z.email().trim().toLowerCase().max(254),
  password: z.string().min(8).max(128),
});

export const emailSchema = z.object({
  email: z.email().trim().toLowerCase().max(254),
});

export const verifyUserSchema = z.object({
  token: z.string().min(40).max(100),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type EmailInput = z.infer<typeof emailSchema>;
