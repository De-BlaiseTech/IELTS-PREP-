import { adminDb } from "../_lib/firebase-admin.js";
import { normalizeEmail, hashSecret, randomToken } from "../_lib/security.js";
import { sendResetEmail } from "../_lib/email.js";

export default async function handler(req,res){
  if(req.method!=="POST") return res.status(405).json({message:"Method not allowed."});
  const email=normalizeEmail(req.body?.email);
  const generic={message:"If an account exists for that email, password-reset instructions have been sent."};
  if(!email) return res.status(200).json(generic);

  const snap=await adminDb.collection("users").where("email","==",email).limit(1).get();
  if(snap.empty) return res.status(200).json(generic);

  const doc=snap.docs[0], data=doc.data(), token=randomToken(32);
  await doc.ref.update({
    resetTokenHash:hashSecret(token),
    resetExpiresAt:new Date(Date.now()+30*60*1000)
  });
  try { await sendResetEmail({email,name:data.name,token}); } catch(e) { console.error(e); }
  return res.status(200).json(generic);
}
