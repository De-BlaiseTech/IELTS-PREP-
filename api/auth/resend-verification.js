import { adminDb } from "../_lib/firebase-admin.js";
import { normalizeEmail, hashSecret, randomToken } from "../_lib/security.js";
import { sendVerificationEmail } from "../_lib/email.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({message:"Method not allowed."});

  const email = normalizeEmail(req.body?.email);
  if (!email) return res.status(400).json({message:"Enter a valid email address."});

  const generic = {message:"If that email has a pending registration, a new verification link has been sent."};

  const snap = await adminDb.collection("pendingRegistrations").where("email","==",email).limit(1).get();
  if (snap.empty) return res.status(200).json(generic);

  const doc = snap.docs[0];
  const data = doc.data();
  const lastSent = data.verificationSentAt?.toDate?.()?.getTime?.() || 0;
  if (Date.now() - lastSent < 60_000) return res.status(200).json(generic);

  const token = randomToken(32);
  await doc.ref.update({
    verificationTokenHash: hashSecret(token),
    verificationExpiresAt: new Date(Date.now() + 30 * 60 * 1000),
    verificationSentAt: new Date()
  });

  try {
    await sendVerificationEmail({email, name:data.name, token});
  } catch (err) {
    console.error(err);
  }

  return res.status(200).json(generic);
}
