import { adminDb } from "../_lib/firebase-admin.js";
import { FieldValue } from "firebase-admin/firestore";
import { hashSecret } from "../_lib/security.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({message:"Method not allowed."});

  const token = String(req.body?.token || "");
  if (!token) return res.status(400).json({message:"Verification token is required."});

  const snap = await adminDb.collection("pendingRegistrations")
    .where("verificationTokenHash","==",hashSecret(token)).limit(1).get();

  if (snap.empty) return res.status(400).json({message:"This verification link is invalid or has expired."});

  const doc = snap.docs[0], data = doc.data();
  const expires = data.verificationExpiresAt?.toDate?.()?.getTime?.() || 0;
  if (expires < Date.now()) {
    await doc.ref.delete();
    return res.status(400).json({message:"This verification link has expired. Request a new one."});
  }

  const existing = await adminDb.collection("users").where("email","==",data.email).limit(1).get();
  if (!existing.empty) {
    await doc.ref.delete();
    return res.status(409).json({message:"This account has already been verified."});
  }

  const userRef = adminDb.collection("users").doc();
  await userRef.set({
    name:data.name,
    email:data.email,
    passwordHash:data.passwordHash,
    emailVerified:true,
    role:"student",
    createdAt:FieldValue.serverTimestamp(),
    updatedAt:FieldValue.serverTimestamp()
  });
  await doc.ref.delete();

  return res.status(200).json({message:"Email verified successfully.", userId:userRef.id});
}
