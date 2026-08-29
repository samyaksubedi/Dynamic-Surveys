import nodemailer from "nodemailer";
import { envVariables } from "./env.config.js";

export const mailTransporter = nodemailer.createTransport({
  host: envVariables.SMTP_HOST,
  port: envVariables.SMTP_PORT,
  secure: envVariables.SMTP_SECURE,
  auth:
    envVariables.SMTP_USER && envVariables.SMTP_PASSWORD
      ? { user: envVariables.SMTP_USER, pass: envVariables.SMTP_PASSWORD }
      : undefined,
});
