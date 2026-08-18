const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

async function sendEmail({ to, name, subject, html }) {
  const apiKey = process.env.BREVO_API_KEY;
  const from = process.env.BREVO_FROM_EMAIL;
  if (!apiKey) throw new Error("BREVO_API_KEY is not configured.");
  if (!from) throw new Error("BREVO_FROM_EMAIL is not configured.");

  const response = await fetch(BREVO_API_URL, {
    method: "POST",
    headers: {
      "accept": "application/json",
      "api-key": apiKey,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      sender: { email: from, name: "IELTS Prep CBT" },
      to: [{ email: String(to), name: String(name || "") }],
      subject,
      htmlContent: html
    })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = data?.message || data?.code || `Brevo request failed (${response.status}).`;
    throw new Error(detail);
  }
  return data;
}

export async function sendVerificationEmail({ email, name, token }) {
  const base = process.env.APP_BASE_URL;
  if (!base) throw new Error("APP_BASE_URL is not configured.");
  const url = `${base.replace(/\/$/, "")}/verify-email?token=${encodeURIComponent(token)}`;

  return sendEmail({
    to: email,
    name,
    subject: "Verify your IELTS Prep CBT account",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#1f2937">
        <h2>Verify your IELTS Prep CBT account</h2>
        <p>Hello ${escapeHtml(name)},</p>
        <p>Thanks for registering. Click the button below to verify your email address.</p>
        <p><a href="${url}" style="display:inline-block;padding:12px 20px;background:#111827;color:#fff;text-decoration:none;border-radius:8px">Verify email</a></p>
        <p>This verification link expires in 30 minutes and can only be used once.</p>
        <p>If you did not create this account, you can ignore this email.</p>
      </div>`
  });
}

export async function sendResetEmail({ email, name, token }) {
  const base = process.env.APP_BASE_URL;
  if (!base) throw new Error("APP_BASE_URL is not configured.");
  const url = `${base.replace(/\/$/, "")}/reset-password?token=${encodeURIComponent(token)}`;

  return sendEmail({
    to: email,
    name,
    subject: "Reset your IELTS Prep CBT password",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#1f2937">
        <h2>Password reset</h2>
        <p>Hello ${escapeHtml(name)},</p>
        <p>We received a request to reset your IELTS Prep CBT password.</p>
        <p><a href="${url}" style="display:inline-block;padding:12px 20px;background:#111827;color:#fff;text-decoration:none;border-radius:8px">Reset password</a></p>
        <p>This link expires in 30 minutes and can only be used once.</p>
        <p>If you did not request this, you can ignore this email.</p>
      </div>`
  });
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[c]));
}
