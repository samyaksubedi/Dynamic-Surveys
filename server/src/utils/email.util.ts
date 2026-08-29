import { envVariables } from "../configs/env.config.js";
import { mailTransporter } from "../configs/mail.config.js";

export const sendEmail = (data: {
  to: string;
  subject: string;
  text: string;
  html: string;
}) => mailTransporter.sendMail({ from: envVariables.EMAIL_FROM, ...data });
