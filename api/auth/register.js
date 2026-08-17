import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "../_lib/firebase-admin.js";
import { normalizeEmail, hashPassword, hashSecret, randomToken } from "../_lib/security.js";
import { sendVerificationEmail } from "../_lib/email.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({message:"Method not allowed."});

  const name = String(req.body?.name || "").trim();
  const email = normalizeEmail(req.body?.email);
  const password = String(req.body?.password || "");

  if (name.length < 2 || !email.includes("@") || password.length < 8) {
    return res.status(400).json({message:"Please provide a valid name, email and password of at least 8 characters."});
  }

  const users = await adminDb.collection("users").where("email", "==", email).limit(1).get();
  if (!users.empty) return res.status(409).json({message:"An account with that email already exists. If it is unverified, use the resend verification option."});

  // Replace any previous pending registration for this email.
  const pending = await adminDb.collection("pendingRegistrations").where("email","==",email).get();
  const batch = adminDb.batch();
  pending.docs.forEach(d => batch.delete(d.ref));

  const token = randomToken(32);
  const ref = adminDb.collection("pendingRegistrations").doc();
  batch.set(ref, {
    name,
    email,
    passwordHash: hashPassword(password),
    verificationTokenHash: hashSecret(token),
    verificationExpiresAt: new Date(Date.now() + 30 * 60 * 1000),
    createdAt: FieldValue.serverTimestamp()
  });
  await batch.commit();

  try {
    await sendVerificationEmail({email, name, token});
  } catch (err) {
    await ref.delete();
    console.error(err);
    return res.status(500).json({message:"We could not send the verification email. Please try again."});
  }

  return res.status(201).json({message:"Verification email sent."});
}
