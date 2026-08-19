import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { adminDb } from '../lib/server/firebase-admin.js';
import { requireSession } from '../lib/server/session.js';
import { questionBankTests } from '../content/question-bank.js';

const MAX_TEXT = 15000;

function getB2Client(){
  const endpoint=process.env.B2_S3_ENDPOINT || 'https://s3.eu-central-003.backblazeb2.com';
  if(!process.env.B2_KEY_ID || !process.env.B2_APPLICATION_KEY) return null;
  return new S3Client({
    region: process.env.B2_REGION || 'eu-central-003',
    endpoint,
    credentials:{accessKeyId:process.env.B2_KEY_ID,secretAccessKey:process.env.B2_APPLICATION_KEY}
  });
}

export default async function handler(req,res){
  const user=await requireSession(req,res); if(!user) return;
  if(req.method!=="GET") return res.status(405).json({message:"Method not allowed."});
  const testId=String(req.query?.testId||"");
  const section=Math.max(1,Math.min(4,Number(req.query?.section)||1));
  if(!testId) return res.status(400).json({message:"testId is required."});

  try{
    let test=null;
    const snap=await adminDb.collection('tests').doc(testId).get();
    if(snap.exists) test={id:snap.id,...snap.data()};
    if(!test) test=questionBankTests.find(t=>t.id===testId);
    if(!test) return res.status(404).json({message:'Listening test not found.'});

    // Permanent production audio: Backblaze B2 first.
    const storagePath=Array.isArray(test.audioStoragePaths) ? test.audioStoragePaths[section-1] : null;
    const bucketName=process.env.B2_BUCKET_NAME;
    const b2=getB2Client();
    if(storagePath && bucketName && b2){
      try{
        const url=await getSignedUrl(b2,new GetObjectCommand({Bucket:bucketName,Key:storagePath}),{expiresIn:3600});
        return res.redirect(302,url);
      }catch(error){ console.error('B2 audio lookup error',error); }
    }

    // Safe fallback for tests whose permanent MP3 has not been uploaded yet.
    const key=process.env.XAI_API_KEY;
    if(!key) return res.status(503).json({message:'Listening audio has not been uploaded yet, and XAI_API_KEY is not configured for fallback generation.'});
    const script=test?.listeningScripts?.[section-1];
    if(!script) return res.status(404).json({message:'Listening script not found for this section.'});
    const r=await fetch('https://api.x.ai/v1/tts',{
      method:'POST',
      headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},
      body:JSON.stringify({
        text:String(script).slice(0,MAX_TEXT),
        voice_id:String(test?.audioVoice||process.env.XAI_LISTENING_VOICE||'eve'),
        language:'en',
        output_format:{codec:'mp3',sample_rate:24000,bit_rate:128000}
      })
    });
    if(!r.ok){const msg=await r.text().catch(()=>"");return res.status(r.status).json({message:msg||'xAI could not generate the listening audio.'});}
    const audio=Buffer.from(await r.arrayBuffer());
    res.setHeader('Content-Type','audio/mpeg');
    res.setHeader('Content-Length',String(audio.length));
    res.setHeader('Cache-Control','private, max-age=3600');
    return res.status(200).send(audio);
  }catch(error){
    console.error('listening audio error',error);
    return res.status(500).json({message:'Unable to load listening audio.'});
  }
}
