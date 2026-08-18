import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '../_lib/firebase-admin.js';
import { requireSession } from '../_lib/session.js';

const MAX_AUDIO_BYTES = 4_000_000;
const EVAL_MODEL = process.env.OPENAI_EVAL_MODEL || 'gpt-5.6';

function json(res, status, body) { return res.status(status).json(body); }
function clampBand(value) { const n=Number(value); return Number.isFinite(n) ? Math.max(0,Math.min(9,Math.round(n*2)/2)) : 0; }
function extractJson(text) { const raw=String(text||'').trim(); try{return JSON.parse(raw)}catch{} const m=raw.match(/\{[\s\S]*\}/); if(!m) throw new Error('AI evaluator returned invalid JSON.'); return JSON.parse(m[0]); }

async function transcribeAudio(base64,mimeType){
  const key=process.env.OPENAI_API_KEY; if(!key) throw new Error('OPENAI_API_KEY is not configured.');
  const buffer=Buffer.from(base64,'base64');
  const form=new FormData();
  form.append('file',new Blob([buffer],{type:mimeType||'audio/webm'}),'speaking-response.webm');
  form.append('model',process.env.OPENAI_TRANSCRIBE_MODEL||'gpt-4o-mini-transcribe');
  form.append('response_format','json');
  const r=await fetch('https://api.openai.com/v1/audio/transcriptions',{method:'POST',headers:{Authorization:`Bearer ${key}`},body:form});
  const d=await r.json().catch(()=>({})); if(!r.ok) throw new Error(d?.error?.message||'Speech transcription failed.');
  return String(d.text||'').trim();
}

async function evaluateTranscript({prompt,part,transcript}){
  const key=process.env.OPENAI_API_KEY; if(!key) throw new Error('OPENAI_API_KEY is not configured.');
  const system=`You are an IELTS Speaking practice evaluator. This is an educational estimate, NOT an official IELTS score. Evaluate against four IELTS Speaking criteria: Fluency and Coherence, Lexical Resource, Grammatical Range and Accuracy, and Pronunciation. Use the public IELTS assessment framework as reference, but do not reproduce copyrighted band-descriptor text. Consider relevance, development, organisation, vocabulary range/precision, grammar variety/accuracy and intelligibility. Pronunciation confidence is limited because this endpoint receives a transcript after transcription. Return ONLY valid JSON: {"fluencyCoherence":{"band":0,"feedback":"","evidence":[]},"lexicalResource":{"band":0,"feedback":"","evidence":[]},"grammar":{"band":0,"feedback":"","evidence":[]},"pronunciation":{"band":0,"feedback":"","evidence":[]},"overallBand":0,"strengths":[],"improvements":[],"pronunciationConfidence":"low","disclaimer":""}. Bands must be whole or half bands from 0 to 9.`;
  const input=`Speaking Part: ${part}\nPrompt: ${prompt}\nCandidate transcript:\n${transcript}`;
  const r=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({model:EVAL_MODEL,input:[{role:'system',content:[{type:'input_text',text:system}]},{role:'user',content:[{type:'input_text',text:input}]}]})});
  const d=await r.json().catch(()=>({})); if(!r.ok) throw new Error(d?.error?.message||'AI evaluation failed.');
  return extractJson(d.output_text||d.output?.map(x=>x?.content?.map(c=>c?.text||'').join('')).join(''));
}

export default async function handler(req,res){
  const user=await requireSession(req,res); if(!user) return;
  if(req.method!=='POST') return json(res,405,{message:'Method not allowed.'});
  try{
    const body=req.body||{}; const prompt=String(body.prompt||'').trim(); const part=Number(body.part||1); const mimeType=String(body.mimeType||'audio/webm'); const audioBase64=String(body.audioBase64||'').trim(); let transcript=String(body.transcript||'').trim();
    if(!prompt) return json(res,400,{message:'Speaking prompt is required.'});
    if(![1,2,3].includes(part)) return json(res,400,{message:'Speaking part must be 1, 2 or 3.'});
    if(!audioBase64&&!transcript) return json(res,400,{message:'Provide an audio recording or transcript.'});
    if(audioBase64){const bytes=Math.floor(audioBase64.length*3/4); if(bytes>MAX_AUDIO_BYTES) return json(res,413,{message:'Recording is too large. Keep it under 4 MB.'}); transcript=await transcribeAudio(audioBase64,mimeType);}
    if(!transcript) return json(res,422,{message:'No speech could be transcribed.'});
    const e=await evaluateTranscript({prompt,part,transcript});
    const result={fluencyCoherence:{band:clampBand(e.fluencyCoherence?.band),feedback:String(e.fluencyCoherence?.feedback||''),evidence:e.fluencyCoherence?.evidence||[]},lexicalResource:{band:clampBand(e.lexicalResource?.band),feedback:String(e.lexicalResource?.feedback||''),evidence:e.lexicalResource?.evidence||[]},grammar:{band:clampBand(e.grammar?.band),feedback:String(e.grammar?.feedback||''),evidence:e.grammar?.evidence||[]},pronunciation:{band:clampBand(e.pronunciation?.band),feedback:String(e.pronunciation?.feedback||''),evidence:e.pronunciation?.evidence||[]},overallBand:clampBand(e.overallBand),strengths:Array.isArray(e.strengths)?e.strengths.slice(0,8):[],improvements:Array.isArray(e.improvements)?e.improvements.slice(0,8):[],pronunciationConfidence:String(e.pronunciationConfidence||'low'),disclaimer:String(e.disclaimer||'AI estimate for practice only; not an official IELTS result.')};
    const ref=await adminDb.collection('speaking_evaluations').add({uid:user.uid,part,prompt,transcript,result,model:EVAL_MODEL,createdAt:FieldValue.serverTimestamp()});
    return json(res,200,{id:ref.id,transcript,...result});
  }catch(error){console.error('speaking evaluation error',error);return json(res,500,{message:error.message||'Unable to evaluate speaking response.'});}
}
