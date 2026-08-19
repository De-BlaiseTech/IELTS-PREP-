import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "../lib/server/firebase-admin.js";
import {
  normalizeEmail, hashPassword, verifyPassword, hashSecret, randomToken,
  setSessionCookie, clearSessionCookie
} from "../lib/server/security.js";
import { sendVerificationEmail, sendResetEmail } from "../lib/server/email.js";
import { rateLimit } from "../lib/server/rate-limit.js";

function json(res,status,body){ return res.status(status).json(body); }

async function register(req,res){
  if (!(await rateLimit(req,res,{key:"register",limit:5}))) return;
  const name=String(req.body?.name||"").trim();
  const email=normalizeEmail(req.body?.email);
  const password=String(req.body?.password||"");
  if(name.length<2||!email.includes("@")||password.length<8) return json(res,400,{message:"Please provide a valid name, email and password of at least 8 characters."});
  const users=await adminDb.collection("users").where("email","==",email).limit(1).get();
  if(!users.empty) return json(res,409,{message:"An account with that email already exists. If it is unverified, use the resend verification option."});
  const pending=await adminDb.collection("pendingRegistrations").where("email","==",email).get();
  const batch=adminDb.batch(); pending.docs.forEach(d=>batch.delete(d.ref));
  const token=randomToken(32); const ref=adminDb.collection("pendingRegistrations").doc();
  batch.set(ref,{name,email,passwordHash:hashPassword(password),verificationTokenHash:hashSecret(token),verificationExpiresAt:new Date(Date.now()+30*60*1000),createdAt:FieldValue.serverTimestamp(),verificationSentAt:new Date()});
  await batch.commit();
  try{await sendVerificationEmail({email,name,token});}
  catch(err){await ref.delete().catch(()=>{}); console.error(err); return json(res,500,{message:"We could not send the verification email. Please try again."});}
  return json(res,201,{message:"Verification email sent."});
}
async function login(req,res){
  if (!(await rateLimit(req,res,{key:"login",limit:10}))) return;
  const email=normalizeEmail(req.body?.email), password=String(req.body?.password||"");
  const snap=await adminDb.collection("users").where("email","==",email).limit(1).get();
  if(snap.empty) return json(res,401,{message:"Invalid email or password."});
  const doc=snap.docs[0], user=doc.data();
  if(user.emailVerified!==true) return json(res,403,{message:"Please verify your email before signing in."});
  if(!verifyPassword(password,user.passwordHash)) return json(res,401,{message:"Invalid email or password."});
  const sessionToken=randomToken(32);
  await adminDb.collection("sessions").doc(hashSecret(sessionToken)).set({uid:doc.id,createdAt:new Date(),expiresAt:new Date(Date.now()+30*60*1000)});
  setSessionCookie(res,sessionToken,30*60);
  return json(res,200,{verified:true,user:{id:doc.id,name:user.name,email:user.email,role:user.role}});
}
async function logout(req,res){
  const token=String((req.headers.cookie||"").split(";").find(x=>x.trim().startsWith("ielts_session="))||"").split("=")[1];
  if(token) await adminDb.collection("sessions").doc(hashSecret(decodeURIComponent(token))).delete().catch(()=>{});
  clearSessionCookie(res); return json(res,200,{message:"Signed out."});
}
async function resendVerification(req,res){
  if (!(await rateLimit(req,res,{key:"resend-verification",limit:5}))) return;
  const email=normalizeEmail(req.body?.email);
  const snap=await adminDb.collection("pendingRegistrations").where("email","==",email).limit(1).get();
  if(snap.empty) return json(res,200,{message:"If an account is awaiting verification, a new verification link has been sent."});
  const doc=snap.docs[0], data=doc.data();
  if(data.verificationExpiresAt?.toDate && data.verificationExpiresAt.toDate().getTime()<=Date.now()) return json(res,400,{message:"Your verification request has expired. Please register again."});
  const token=randomToken(32);
  await doc.ref.update({verificationTokenHash:hashSecret(token),verificationExpiresAt:new Date(Date.now()+30*60*1000),verificationSentAt:new Date()});
  try{await sendVerificationEmail({email:data.email,name:data.name,token});}
  catch(err){console.error(err);return json(res,500,{message:"We could not send the verification email. Please try again."});}
  return json(res,200,{message:"Verification email sent."});
}
async function verifyEmail(req,res){
  const token=String(req.body?.token||""); if(!token) return json(res,400,{message:"Verification token is required."});
  const snap=await adminDb.collection("pendingRegistrations").where("verificationTokenHash","==",hashSecret(token)).limit(1).get();
  if(snap.empty) return json(res,400,{message:"This verification link is invalid or has expired."});
  const doc=snap.docs[0], data=doc.data();
  const expires=data.verificationExpiresAt?.toDate ? data.verificationExpiresAt.toDate() : new Date(data.verificationExpiresAt);
  if(!expires || expires.getTime()<=Date.now()){await doc.ref.delete().catch(()=>{});return json(res,400,{message:"This verification link is invalid or has expired."});}
  const ref=adminDb.collection("users").doc();
  await ref.set({name:data.name,email:data.email,passwordHash:data.passwordHash,emailVerified:true,role:"student",createdAt:FieldValue.serverTimestamp()});
  await doc.ref.delete();
  return json(res,200,{message:"Email verified successfully."});
}
async function forgotPassword(req,res){
  if (!(await rateLimit(req,res,{key:"forgot-password",limit:5}))) return;
  const email=normalizeEmail(req.body?.email);
  const snap=await adminDb.collection("users").where("email","==",email).limit(1).get();
  if(snap.empty) return json(res,200,{message:"If an account exists for that email, password-reset instructions have been sent."});
  const doc=snap.docs[0], data=doc.data(), token=randomToken(32);
  await adminDb.collection("passwordResets").doc(hashSecret(token)).set({uid:doc.id,email:data.email,tokenHash:hashSecret(token),expiresAt:new Date(Date.now()+30*60*1000),createdAt:new Date()});
  try{await sendResetEmail({email:data.email,name:data.name,token});}
  catch(err){console.error(err);return json(res,500,{message:"We could not send the password-reset email. Please try again."});}
  return json(res,200,{message:"If an account exists for that email, password-reset instructions have been sent."});
}
async function resetPassword(req,res){
  if (!(await rateLimit(req,res,{key:"reset-password",limit:5}))) return;
  const token=String(req.body?.token||""), password=String(req.body?.password||"");
  if(!token||password.length<8) return json(res,400,{message:"A valid reset token and password of at least 8 characters are required."});
  const ref=adminDb.collection("passwordResets").doc(hashSecret(token)), snap=await ref.get();
  if(!snap.exists) return json(res,400,{message:"This password-reset link is invalid or has expired."});
  const data=snap.data(), expires=data.expiresAt?.toDate ? data.expiresAt.toDate() : new Date(data.expiresAt);
  if(!expires||expires.getTime()<=Date.now()){await ref.delete().catch(()=>{});return json(res,400,{message:"This password-reset link is invalid or has expired."});}
  await adminDb.collection("users").doc(data.uid).update({passwordHash:hashPassword(password)});
  await ref.delete(); return json(res,200,{message:"Password reset successfully."});
}

const actions={register,login,logout,resendVerification,verifyEmail,forgotPassword,resetPassword};
export default async function handler(req,res){
  if(req.method!=="POST") return json(res,405,{message:"Method not allowed."});
  const action=String(req.body?.action||req.query?.action||"").trim();
  if(!actions[action]) return json(res,404,{message:"Unknown authentication action."});
  try{return await actions[action](req,res);}catch(error){console.error("auth api error",error);return json(res,500,{message:"Authentication request failed."});}
}
