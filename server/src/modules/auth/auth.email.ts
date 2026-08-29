import { envVariables } from "../../configs/env.config.js";
import { sendEmail } from "../../utils/email.util.js";

export const sendVerificationEmail = ({
  to,
  name,
  token,
}: {
  to: string;
  name: string;
  token: string;
}) => {
  const url = `${envVariables.CLIENT_URL}/auth/verify/${token}`;
  return sendEmail({
    to,
    subject: "Verify your Dynamic Surveys account",
    text: `Hi ${name}, verify your account: ${url}`,
    html: `<p>Hi ${name},</p><p><a href="${url}">Verify your Dynamic Surveys account</a>.</p>`,
  });
};
