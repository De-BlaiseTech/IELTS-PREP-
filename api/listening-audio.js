import { adminDb } from "../lib/server/firebase-admin.js";
import { requireSession } from "../lib/server/session.js";
import { questionBankTests } from "../content/question-bank.js";

const MAX_TEXT = 15000;

export default async function handler(req,res){
  const user=await requireSession(req,res); if(!user) return;
  if(req.method!=="GET") return res.status(405).json({message:"Method not allowed."});
  const testId=String(req.query?.testId||"");
  const section=Math.max(1,Math.min(4,Number(req.query?.section)||1));
  if(!testId) return res.status(400).json({message:"testId is required."});
  const key=process.env.XAI_API_KEY;
  if(!key) return res.status(500).json({message:"XAI_API_KEY is not configured."});

  try{
    let test=null;
    try{
      const snap=await adminDb.collection("tests").doc(testId).get();
      if(snap.exists) test={id:snap.id,...snap.data()};
    }catch{}
    if(!test) test=questionBankTests.find(t=>t.id===testId);
    const script=test?.listeningScripts?.[section-1];
    if(!script) return res.status(404).json({message:"Listening script not found for this section."});
    const text=String(script).slice(0,MAX_TEXT);
    const voice=String(test?.audioVoice||process.env.XAI_LISTENING_VOICE||"eve");
    const r=await fetch("https://api.x.ai/v1/tts",{
      method:"POST",
      headers:{Authorization:`Bearer ${key}`,"Content-Type":"application/json"},
      body:JSON.stringify({text,voice_id:voice,language:"en",output_format:{codec:"mp3",sample_rate:24000,bit_rate:128000}})
    });
    if(!r.ok){
      const msg=await r.text().catch(()=>"");
      return res.status(r.status).json({message:msg||"xAI could not generate the listening audio."});
    }
    const audio=Buffer.from(await r.arrayBuffer());
    res.setHeader("Content-Type","audio/mpeg");
    res.setHeader("Content-Length",String(audio.length));
    res.setHeader("Cache-Control","private, max-age=3600");
    return res.status(200).send(audio);
  }catch(error){
    console.error("listening audio error",error);
    return res.status(500).json({message:"Unable to generate listening audio."});
  }
}
