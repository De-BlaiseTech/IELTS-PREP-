import React, { useRef, useState } from "react";
import { Mic, Square, Sparkles } from "lucide-react";
import Timer from "../components/Timer";
import { useApp } from "../context/AppContext";

function blobToBase64(blob){
 return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result).split(',')[1]||'');r.onerror=reject;r.readAsDataURL(blob);});
}

export default function Speaking(){
 const {speaking}=useApp();
 const [part,setPart]=useState(0); const [recording,setRecording]=useState(false); const [status,setStatus]=useState(""); const [evaluating,setEvaluating]=useState(false); const [result,setResult]=useState(null);
 const mediaRef=useRef(null); const chunks=useRef([]); const item=speaking[part];
 async function start(){
  try{const stream=await navigator.mediaDevices.getUserMedia({audio:true});const rec=new MediaRecorder(stream,{mimeType:'audio/webm'});chunks.current=[];rec.ondataavailable=e=>{if(e.data.size)chunks.current.push(e.data)};rec.onstop=async()=>{stream.getTracks().forEach(t=>t.stop());const blob=new Blob(chunks.current,{type:'audio/webm'});if(blob.size>4000000){setStatus('Recording is too large. Please keep it under 4 MB.');return}setEvaluating(true);setStatus('Transcribing and evaluating your response…');try{const audioBase64=await blobToBase64(blob);const response=await fetch('/api/speaking/evaluate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({part:item.part,prompt:item.cueCard||item.questions?.join(' '),audioBase64,mimeType:'audio/webm'})});const data=await response.json();if(!response.ok)throw new Error(data.message||'Evaluation failed.');setResult(data);setStatus('AI evaluation completed.');}catch(e){setStatus(e.message||'Unable to evaluate this recording.')}finally{setEvaluating(false)}};mediaRef.current=rec;rec.start();setRecording(true);setStatus('Recording…');}
  catch(e){setStatus('Microphone permission is required for recording.')}
 }
 function stop(){mediaRef.current?.stop();setRecording(false)}
 if(!item)return <div className="page-heading"><h1>Speaking</h1><p>No speaking content is published yet.</p></div>;
 return <div><div className="page-heading"><p className="eyebrow">SPEAKING PRACTICE</p><h1>{item.title}</h1><p>Record your answer and receive an AI practice estimate based on the IELTS Speaking assessment framework.</p></div>
 <div className="part-tabs">{speaking.map((s,i)=><button className={i===part?"active":""} onClick={()=>{setPart(i);setStatus('');setResult(null)}} key={s.id}>Part {s.part}</button>)}</div>
 <div className="speaking-card">{item.cueCard?<><span className="tag">CUE CARD</span><h2>{item.cueCard}</h2><div className="speaking-timers"><div><small>Preparation</small><Timer seconds={60}/></div><div><small>Speaking</small><Timer seconds={120}/></div></div></>:<div className="speaking-questions">{item.questions.map((q,i)=><div className="speak-q" key={q}><b>{i+1}</b><span>{q}</span></div>)}</div>}
 <div className="record-row">{recording?<button className="record-btn stop" onClick={stop}><Square size={18}/> Stop recording</button>:<button className="record-btn" onClick={start} disabled={evaluating}><Mic size={18}/> {evaluating?'Evaluating…':'Start recording'}</button>}<span>{status}</span></div>
 {result&&<div className="ai-result"><div className="ai-result-head"><Sparkles size={18}/><b>AI Speaking Practice Report</b><strong>Estimated Band {result.overallBand}</strong></div><p className="muted">This is an AI practice estimate, not an official IELTS result. Pronunciation confidence: {result.pronunciationConfidence}.</p><div className="score-grid">{[['Fluency & Coherence',result.fluencyCoherence],['Lexical Resource',result.lexicalResource],['Grammar',result.grammar],['Pronunciation',result.pronunciation]].map(([name,v])=><div className="score-card" key={name}><b>{name}</b><strong>{v.band}</strong><p>{v.feedback}</p></div>)}</div><h3>Strengths</h3><ul>{result.strengths.map((x,i)=><li key={i}>{x}</li>)}</ul><h3>Improve next</h3><ul>{result.improvements.map((x,i)=><li key={i}>{x}</li>)}</ul></div>}
 </div></div>
}
