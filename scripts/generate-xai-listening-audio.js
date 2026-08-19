import fs from 'fs';
import path from 'path';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getApps, initializeApp, cert } from 'firebase-admin/app';

const API_KEY=process.env.XAI_API_KEY;
const VOICE=process.env.XAI_LISTENING_VOICE||'eve';
const OUT=path.resolve(process.env.AUDIO_OUTPUT_DIR||'./generated-listening-audio');
const UPLOAD=process.env.UPLOAD_TO_B2==='true';
const BANK=JSON.parse(fs.readFileSync(path.resolve('content/listening-audio-bank.json'),'utf8'));
if(!API_KEY) throw new Error('XAI_API_KEY is required. Never commit it.');
if(UPLOAD && !process.env.B2_KEY_ID) throw new Error('B2_KEY_ID is required when UPLOAD_TO_B2=true.');
if(UPLOAD && !process.env.B2_APPLICATION_KEY) throw new Error('B2_APPLICATION_KEY is required when UPLOAD_TO_B2=true.');
if(UPLOAD && !process.env.B2_BUCKET_NAME) throw new Error('B2_BUCKET_NAME is required when UPLOAD_TO_B2=true.');

let s3,db;
if(UPLOAD){
  s3=new S3Client({
    region:process.env.B2_REGION||'eu-central-003',
    endpoint:process.env.B2_S3_ENDPOINT||'https://s3.eu-central-003.backblazeb2.com',
    credentials:{accessKeyId:process.env.B2_KEY_ID,secretAccessKey:process.env.B2_APPLICATION_KEY}
  });
  if(process.env.FIREBASE_SERVICE_ACCOUNT_JSON){
    const sa=JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    const app=getApps().length?getApps()[0]:initializeApp({credential:cert(sa)});
    db=getFirestore(app);
  } else {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is required so Firestore can be updated with B2 audio paths.');
  }
}
fs.mkdirSync(OUT,{recursive:true});

async function tts(text){
  const r=await fetch('https://api.x.ai/v1/tts',{method:'POST',headers:{Authorization:`Bearer ${API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({text,voice_id:VOICE,language:'en',output_format:{codec:'mp3',sample_rate:24000,bit_rate:128000}})});
  if(!r.ok) throw new Error(`xAI TTS ${r.status}: ${(await r.text()).slice(0,500)}`);
  return Buffer.from(await r.arrayBuffer());
}

async function main(){
 let done=0,skipped=0,failed=0;
 for(const test of BANK){
  const audioPaths=[];
  for(const sec of test.sections){
    const outDir=path.join(OUT,test.testId); fs.mkdirSync(outDir,{recursive:true});
    const out=path.join(outDir,`section-${sec.section}.mp3`);
    try{
      if(!fs.existsSync(out)||fs.statSync(out).size<1000){fs.writeFileSync(out,await tts(sec.script));done++;console.log(`OK ${test.testId} section ${sec.section}`)}else{skipped++;console.log(`SKIP ${test.testId} section ${sec.section}`)}
      if(UPLOAD){
        const key=sec.storagePath;
        await s3.send(new PutObjectCommand({Bucket:process.env.B2_BUCKET_NAME,Key:key,Body:fs.readFileSync(out),ContentType:'audio/mpeg',CacheControl:'public,max-age=31536000,immutable'}));
        audioPaths.push(key);
      }
    }catch(e){failed++;console.error(`FAIL ${test.testId} section ${sec.section}: ${e.message}`)}
  }
  if(UPLOAD && audioPaths.length===4){await db.collection('tests').doc(test.testId).set({audioStoragePaths:audioPaths,audioStorageProvider:'backblaze-b2',audioBucket:process.env.B2_BUCKET_NAME,audioVoice:VOICE,audioReady:true,audioUpdatedAt:FieldValue.serverTimestamp()},{merge:true});}
 }
 console.log(`Finished: generated=${done}, skipped=${skipped}, failed=${failed}`);
 if(failed) process.exitCode=2;
}
main().catch(e=>{console.error(e);process.exit(1)});
