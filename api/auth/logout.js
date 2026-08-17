import { adminDb } from "../_lib/firebase-admin.js";
import { clearSessionCookie, getCookie, hashSecret } from "../_lib/security.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({message:"Method not allowed."});
  const token = getCookie(req,"ielts_session");
  if (token) await adminDb.collection("sessions").doc(hashSecret(token)).delete().catch(()=>{});
  clearSessionCookie(res);
  return res.status(200).json({message:"Signed out."});
}
