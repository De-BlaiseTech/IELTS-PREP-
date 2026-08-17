import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendVerificationEmail({ email, name, token }) {
  const base = process.env.APP_BASE_URL;
  if (!base) throw new Error("APP_BASE_URL is not configured.");
  const url = `${base.replace(/\/$/, "")}/verify-email.html?token=${encodeURIComponent(token)}`;

  return resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL,
    to: email,
    subject: "Verify your IELTS Prep CBT account",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:620px;margin:auto">
        <h2>Verify your IELTS Prep CBT account</h2>
        <p>Hello ${escapeHtml(name)},</p>
        <p>Click the button below to verify your email address.</p>
        <p><a href="${url}" style="display:inline-block;padding:12px 20px;background:#111827;color:#fff;text-decoration:none;border-radius:8px">Verify email</a></p>
        <p>This link expires soon and can only be used once.</p>
      </div>`
  });
}

export async function sendResetEmail({ email, name, token }) {
  const base = process.env.APP_BASE_URL;
  if (!base) throw new Error("APP_BASE_URL is not configured.");
  const url = `${base.replace(/\/$/, "")}/reset-password.html?token=${encodeURIComponent(token)}`;

  return resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL,
    to: email,
    subject: "Reset your IELTS Prep CBT password",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:620px;margin:auto">
        <h2>Password reset</h2>
        <p>Hello ${escapeHtml(name)},</p>
        <p>Use the button below to choose a new password.</p>
        <p><a href="${url}" style="display:inline-block;padding:12px 20px;background:#111827;color:#fff;text-decoration:none;border-radius:8px">Reset password</a></p>
        <p>If you did not request this, you can ignore this email.</p>
      </div>`
  });
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[c]));
}
