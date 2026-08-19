import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "../lib/server/firebase-admin.js";
import { questionBankTests, questionBankQuestions, writingTasks, speakingPrompts, questionBankVersion } from "../content/question-bank.js";

function authorized(req){
  const header=String(req.headers["x-seed-secret"]||"");
  const query=String(req.query?.secret||"");
  return !!process.env.SEED_SECRET && (header===process.env.SEED_SECRET || query===process.env.SEED_SECRET);
}
async function upsert(collection,items){
  for(let i=0;i<items.length;i+=400){
    const batch=adminDb.batch();
    for(const item of items.slice(i,i+400)){
      const {id,...data}=item;
      batch.set(adminDb.collection(collection).doc(id),{...data,published:data.published!==false,questionBankVersion,updatedAt:FieldValue.serverTimestamp()},{merge:true});
    }
    await batch.commit();
  }
}
export default async function handler(req,res){
  if(req.method!=="POST") return res.status(405).json({message:"Method not allowed."});
  if(!authorized(req)) return res.status(401).json({message:"Invalid seed secret."});
  try{
    await upsert("tests",questionBankTests);
    await upsert("questions",questionBankQuestions);
    await upsert("writing_tasks",writingTasks);
    await upsert("speaking_prompts",speakingPrompts);
    return res.status(200).json({ok:true,version:questionBankVersion,counts:{tests:questionBankTests.length,questions:questionBankQuestions.length,writingTasks:writingTasks.length,speakingPrompts:speakingPrompts.length}});
  }catch(error){console.error("admin seed error",error);return res.status(500).json({message:"Production content seeding failed."});}
}
