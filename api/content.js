import { adminDb } from "../lib/server/firebase-admin.js";
import { requireSession } from "../lib/server/session.js";
async function readCollection(name){const snap=await adminDb.collection(name).where("published","==",true).get();return snap.docs.map(d=>({id:d.id,...d.data()}));}
function clean(v){return v===undefined||v===null||v===""?undefined:v;}
export default async function handler(req,res){
 const user=await requireSession(req,res); if(!user) return;
 if(req.method!=="GET") return res.status(405).json({message:"Method not allowed."});
 try{
  const action=String(req.query?.action||"all");
  if(action==="questions"){
   let ref=adminDb.collection("questions");
   const filters=[["published","==",true],["skill","==",clean(req.query?.skill)?.toLowerCase()],["section","==",req.query?.section?Number(req.query.section):undefined],["testId","==",clean(req.query?.testId)],["type","==",clean(req.query?.type)],["difficulty","==",clean(req.query?.difficulty)]];
   for(const [field,op,value] of filters) if(value!==undefined) ref=ref.where(field,op,value);
   const max=Math.min(Math.max(Number(req.query?.limit)||100,1),200), snap=await ref.limit(max).get();
   return res.status(200).json({questions:snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(Number(a.number)||0)-(Number(b.number)||0))});
  }
  if(action==="tests"){
   const snap=await adminDb.collection("tests").where("published","==",true).get();
   return res.status(200).json({tests:snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>String(b.createdAt||"").localeCompare(String(a.createdAt||"")))});
  }
  const [tests,questions,writingTasks,speaking]=await Promise.all([readCollection("tests"),readCollection("questions"),readCollection("writing_tasks"),readCollection("speaking_prompts")]);
  return res.status(200).json({tests,questions,writingTasks,speaking});
 }catch(error){console.error("content api error",error);return res.status(500).json({message:"Unable to load IELTS content from Firestore."});}
}
