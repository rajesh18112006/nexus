import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { logger } from '../config/logger';

let transporterPromise: Promise<nodemailer.Transporter> | null = null;

async function getTransporter(): Promise<nodemailer.Transporter> {
  if (transporterPromise) return transporterPromise;

  transporterPromise = (async () => {
    // If explicit SMTP credentials are provided, use them
    if (env.SMTP_USER && env.SMTP_PASS) {
      return nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_PORT === 465,
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        },
      });
    }

    // Otherwise, create an auto-provisioned Ethereal test account for dev testing
    try {
      const testAccount = await nodemailer.createTestAccount();
      logger.info({ user: testAccount.user }, 'Provisioned Ethereal SMTP test account for email verification');
      return nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    } catch (err) {
      logger.warn({ err }, 'Could not create Ethereal account, falling back to local mock transport');
      return nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: false,
      });
    }
  })();

  return transporterPromise;
}

export const EmailService = {
  /**
   * Dispatches a 6-digit verification code to the registered email address.
   */
  async sendVerificationEmail(
    toEmail: string,
    firstName: string,
    code: string
  ): Promise<{ success: boolean; previewUrl?: string }> {
    try {
      const transporter = await getTransporter();

      const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Verify your NEXUS account</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0E0F12; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #FFFFFF;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0E0F12; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 520px; background-color: #16181D; border: 1px solid #272A34; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
          <!-- Brand Header -->
          <tr>
            <td style="background-color: #121318; padding: 24px 32px; border-bottom: 1px solid #272A34;">
              <table role="presentation" width="100%">
                <tr>
                  <td>
                    <div style="display: inline-block; width: 32px; height: 32px; background-color: #E05C28; border-radius: 6px; text-align: center; line-height: 32px; vertical-align: middle; color: #FFFFFF; font-weight: bold; font-size: 18px;">⚡</div>
                    <span style="font-size: 20px; font-weight: 700; letter-spacing: -0.5px; margin-left: 10px; color: #FFFFFF; vertical-align: middle;">NEXUS</span>
                    <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #8F94A6; margin-left: 8px; vertical-align: middle;">Intelligence</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 36px 32px;">
              <h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 600; color: #FFFFFF; letter-spacing: -0.3px;">
                Verify your email address
              </h1>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #A5AAB8;">
                Hello <strong>${firstName}</strong>,<br />
                Welcome to NEXUS. To activate your organization workspace and access the inventory command center, please enter the following 6-digit confirmation code:
              </p>

              <!-- 6-Digit OTP Box -->
              <div style="margin: 28px 0; padding: 20px; background-color: #0E0F12; border: 1px dashed #E05C28; border-radius: 8px; text-align: center;">
                <span style="font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #E05C28;">
                  ${code}
                </span>
                <p style="margin: 8px 0 0 0; font-size: 11px; color: #7B8092; text-transform: uppercase; letter-spacing: 1px;">
                  Expires in 15 minutes · One-time verification
                </p>
              </div>

              <p style="margin: 0 0 24px 0; font-size: 13px; line-height: 1.5; color: #8F94A6;">
                If you did not initiate this request or create an organization on NEXUS, please ignore this email. Your email address remains secure.
              </p>

              <div style="padding-top: 20px; border-top: 1px solid #272A34; font-size: 12px; color: #636879;">
                Security Alert: NEXUS will never ask you to disclose your verification code over the phone or via messaging apps.
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #121318; padding: 18px 32px; border-top: 1px solid #272A34; text-align: center; font-size: 11px; color: #636879;">
              © ${new Date().getFullYear()} NEXUS Operations & Logistics Intelligence Platform. All rights reserved.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `;

      const info = await transporter.sendMail({
        from: env.EMAIL_FROM,
        to: toEmail,
        subject: `NEXUS — ${code} is your email verification code`,
        text: `Hello ${firstName}, your NEXUS verification code is ${code}. It expires in 15 minutes.`,
        html: htmlContent,
      });

      const previewUrl = nodemailer.getTestMessageUrl(info) || undefined;
      logger.info({ to: toEmail, messageId: info.messageId, code, previewUrl }, 'Verification email dispatched');

      return { success: true, previewUrl };
    } catch (err) {
      logger.error({ err, to: toEmail }, 'Failed to dispatch verification email');
      return { success: false };
    }
  },
};
