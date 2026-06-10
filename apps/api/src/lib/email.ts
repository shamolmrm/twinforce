import nodemailer from "nodemailer";
import { logger } from "./logger.ts";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT ?? "587"),
  secure: process.env.SMTP_PORT === "465",
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

export async function sendEmail(opts: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}): Promise<void> {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM ?? "noreply@twinforce.ai",
      to: Array.isArray(opts.to) ? opts.to.join(", ") : opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
    });
  } catch (err) {
    logger.error({ err }, "Email send failed");
    throw err;
  }
}

export function inviteEmailHtml(inviterName: string, orgName: string, inviteUrl: string): string {
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h1 style="color:#6366f1">TwinForce</h1>
      <p><strong>${inviterName}</strong> has invited you to join <strong>${orgName}</strong> on TwinForce.</p>
      <a href="${inviteUrl}" style="display:inline-block;background:#6366f1;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;margin:16px 0">Accept Invitation</a>
      <p style="color:#888;font-size:12px">This link expires in 48 hours.</p>
    </div>
  `;
}

export function passwordResetHtml(resetUrl: string): string {
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h1 style="color:#6366f1">TwinForce</h1>
      <p>You requested a password reset. Click below to set a new password:</p>
      <a href="${resetUrl}" style="display:inline-block;background:#6366f1;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;margin:16px 0">Reset Password</a>
      <p style="color:#888;font-size:12px">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
    </div>
  `;
}
