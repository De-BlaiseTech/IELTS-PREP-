import { adminDb } from "../_lib/firebase-admin.js";
import { hashSecret, hashPassword } from "../_lib/security.js";

export default async function handler(req,res){
  if(req.method!=="POST") return res.status(405).json({message:"Method not allowed."});
  const token=String(req.body?.token||"");
  const password=String(req.body?.password||"");
  if(!token || password.length<8) return res.status(400).json({message:"Invalid token or password."});

  const snap=await adminDb.collection("users").where("resetTokenHash","==",hashSecret(token)).limit(1).get();
  if(snap.empty) return res.status(400).json({message:"This reset link is invalid or has expired."});

  const doc=snap.docs[0], data=doc.data();
  const expires=data.resetExpiresAt?.toDate?.()?.getTime?.() || 0;
  if(expires<Date.now()) return res.status(400).json({message:"This reset link has expired."});

  await doc.ref.update({
    passwordHash:hashPassword(password),
    resetTokenHash:null,
    resetExpiresAt:null,
    updatedAt:new Date()
  });

  // Revoke all existing sessions for this user.
  const sessions=await adminDb.collection("sessions").where("uid","==",doc.id).get();
  const batch=adminDb.batch();
  sessions.docs.forEach(s=>batch.delete(s.ref));
  await batch.commit();

  return res.status(200).json({message:"Password reset successfully."});
}
