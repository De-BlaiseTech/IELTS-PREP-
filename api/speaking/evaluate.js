import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '../../lib/server/firebase-admin.js';
import { requireSession } from '../../lib/server/session.js';

const MAX_AUDIO_BYTES = 4_000_000;
const EVAL_MODEL = process.env.XAI_EVAL_MODEL || 'grok-4.5';

function json(res, status, body) { return res.status(status).json(body); }
function clampBand(value) { const n=Number(value); return Number.isFinite(n) ? Math.max(0,Math.min(9,Math.round(n*2)/2)) : 0; }
function extractJson(text) { const raw=String(text||'').trim(); try{return JSON.parse(raw)}catch{} const m=raw.match(/\{[\s\S]*\}/); if(!m) throw new Error('AI evaluator returned invalid JSON.'); return JSON.parse(m[0]); }

async function transcribeAudio(base64,mimeType){
  const key=process.env.XAI_API_KEY; if(!key) throw new Error('XAI_API_KEY is not configured.');
  const buffer=Buffer.from(base64,'base64');
  const form=new FormData();
  form.append('file',new Blob([buffer],{type:mimeType||'audio/webm'}),'speaking-response.webm');
  form.append('language','en');
  form.append('format','true');
  const r=await fetch('https://api.x.ai/v1/stt',{method:'POST',headers:{Authorization:`Bearer ${key}`},body:form});
  const d=await r.json().catch(()=>({})); if(!r.ok) throw new Error(d?.error?.message||'Speech transcription failed.');
  return {text:String(d.text||'').trim(),duration:Number(d.duration)||0,words:Array.isArray(d.words)?d.words:[]};
}

async function evaluateTranscript({prompt,part,transcript,duration,words}){
  const key=process.env.XAI_API_KEY; if(!key) throw new Error('XAI_API_KEY is not configured.');
  const model=process.env.XAI_EVAL_MODEL||'grok-4.5';
  const system=`You are an IELTS Speaking practice evaluator. This is an educational estimate, NOT an official IELTS score. Evaluate against four IELTS Speaking criteria: Fluency and Coherence, Lexical Resource, Grammatical Range and Accuracy, and Pronunciation. Use the public IELTS assessment framework as reference, but do not reproduce copyrighted band-descriptor text. Consider relevance, development, organisation, vocabulary range/precision, grammar variety/accuracy and intelligibility. For pronunciation, use only the transcript and the supplied timing metadata as supporting evidence; never claim acoustic phoneme accuracy that is unavailable. Return ONLY valid JSON: {"fluencyCoherence":{"band":0,"feedback":"","evidence":[]},"lexicalResource":{"band":0,"feedback":"","evidence":[]},"grammar":{"band":0,"feedback":"","evidence":[]},"pronunciation":{"band":0,"feedback":"","evidence":[]},"overallBand":0,"strengths":[],"improvements":[],"pronunciationConfidence":"medium","disclaimer":""}. Bands must be whole or half bands from 0 to 9.`;
  const input=`Speaking Part: ${part}\nPrompt: ${prompt}\nResponse duration seconds: ${duration}\nWord timing sample: ${JSON.stringify(words.slice(0,300))}\nCandidate transcript:\n${transcript}`;
  const r=await fetch('https://api.x.ai/v1/responses',{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({model,input:[{role:'system',content:[{type:'input_text',text:system}]},{role:'user',content:[{type:'input_text',text:input}]}],reasoning:{effort:'none'}})});
  const d=await r.json().catch(()=>({})); if(!r.ok) throw new Error(d?.error?.message||'AI evaluation failed.');
  return extractJson(d.output_text||d.output?.map(x=>x?.content?.map(c=>c?.text||'').join('')).join(''));
}

export default async function handler(req,res){
  const user=await requireSession(req,res); if(!user) return;
  if(req.method!=='POST') return json(res,405,{message:'Method not allowed.'});
  try{
    const body=req.body||{}; const prompt=String(body.prompt||'').trim(); const part=Number(body.part||1); const mimeType=String(body.mimeType||'audio/webm'); const audioBase64=String(body.audioBase64||'').trim(); let transcript=String(body.transcript||'').trim(); let duration=Number(body.duration)||0; let words=Array.isArray(body.words)?body.words:[];
    if(!prompt) return json(res,400,{message:'Speaking prompt is required.'});
    if(![1,2,3].includes(part)) return json(res,400,{message:'Speaking part must be 1, 2 or 3.'});
    if(!audioBase64&&!transcript) return json(res,400,{message:'Provide an audio recording or transcript.'});
    if(audioBase64){const bytes=Math.floor(audioBase64.length*3/4); if(bytes>MAX_AUDIO_BYTES) return json(res,413,{message:'Recording is too large. Keep it under 4 MB.'}); const stt=await transcribeAudio(audioBase64,mimeType); transcript=stt.text; duration=stt.duration; words=stt.words;}
    if(!transcript) return json(res,422,{message:'No speech could be transcribed.'});
    const e=await evaluateTranscript({prompt,part,transcript,duration,words});
    const result={fluencyCoherence:{band:clampBand(e.fluencyCoherence?.band),feedback:String(e.fluencyCoherence?.feedback||''),evidence:e.fluencyCoherence?.evidence||[]},lexicalResource:{band:clampBand(e.lexicalResource?.band),feedback:String(e.lexicalResource?.feedback||''),evidence:e.lexicalResource?.evidence||[]},grammar:{band:clampBand(e.grammar?.band),feedback:String(e.grammar?.feedback||''),evidence:e.grammar?.evidence||[]},pronunciation:{band:clampBand(e.pronunciation?.band),feedback:String(e.pronunciation?.feedback||''),evidence:e.pronunciation?.evidence||[]},overallBand:clampBand(e.overallBand),strengths:Array.isArray(e.strengths)?e.strengths.slice(0,8):[],improvements:Array.isArray(e.improvements)?e.improvements.slice(0,8):[],pronunciationConfidence:String(e.pronunciationConfidence||'low'),disclaimer:String(e.disclaimer||'AI estimate for practice only; not an official IELTS result.')};
    const ref=await adminDb.collection('speaking_evaluations').add({uid:user.uid,part,prompt,transcript,duration,wordCount:words.length,words:words.slice(0,1000),result,model:process.env.XAI_EVAL_MODEL||'grok-4.5',source:audioBase64?'batch':'realtime',createdAt:FieldValue.serverTimestamp()});
    return json(res,200,{id:ref.id,transcript,duration,wordCount:words.length,...result});
  }catch(error){console.error('speaking evaluation error',error);return json(res,500,{message:error.message||'Unable to evaluate speaking response.'});}
}
