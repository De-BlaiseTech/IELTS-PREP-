import { adminDb } from "../_lib/firebase-admin.js";
import { normalizeEmail, verifyPassword, randomToken, hashSecret, setSessionCookie } from "../_lib/security.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({message:"Method not allowed."});

  const email = normalizeEmail(req.body?.email);
  const password = String(req.body?.password || "");

  const snap = await adminDb.collection("users").where("email","==",email).limit(1).get();
  if (snap.empty) return res.status(401).json({message:"Invalid email or password."});

  const doc = snap.docs[0], user = doc.data();
  if (user.emailVerified !== true) return res.status(403).json({message:"Please verify your email before signing in."});
  if (!verifyPassword(password,user.passwordHash)) return res.status(401).json({message:"Invalid email or password."});

  const sessionToken = randomToken(32);
  await adminDb.collection("sessions").doc(hashSecret(sessionToken)).set({
    uid:doc.id,
    createdAt:new Date(),
    expiresAt:new Date(Date.now()+7*24*60*60*1000)
  });

  setSessionCookie(res, sessionToken, 7*24*60*60);
  return res.status(200).json({
    verified:true,
    user:{id:doc.id,name:user.name,email:user.email,role:user.role}
  });
}
