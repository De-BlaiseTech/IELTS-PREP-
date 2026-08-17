import React, { useEffect, useRef, useState } from "react";
import { Mic, Square } from "lucide-react";
import Timer from "../components/Timer";
import { useApp } from "../context/AppContext";
import { saveSpeakingSubmission } from "../services/data";

export default function Speaking(){
 const {speaking,user}=useApp(); const [part,setPart]=useState(0); const [recording,setRecording]=useState(false); const [status,setStatus]=useState(""); const mediaRef=useRef(null); const chunks=useRef([]);
 const item=speaking[part];
 async function start(){try{const stream=await navigator.mediaDevices.getUserMedia({audio:true});const rec=new MediaRecorder(stream);chunks.current=[];rec.ondataavailable=e=>chunks.current.push(e.data);rec.onstop=async()=>{stream.getTracks().forEach(t=>t.stop());const blob=new Blob(chunks.current,{type:"audio/webm"});await saveSpeakingSubmission({userId:user?.uid||"demo-user",part:item.part,fileSize:blob.size,createdAt:new Date().toISOString(),status:"recorded"});setStatus("Recording saved locally for this session.");};mediaRef.current=rec;rec.start();setRecording(true);setStatus("Recording…");}catch(e){setStatus("Microphone permission is required for recording.");}}
 function stop(){mediaRef.current?.stop();setRecording(false);}
 return <div><div className="page-heading"><p className="eyebrow">SPEAKING PRACTICE</p><h1>{item.title}</h1><p>Practise naturally. The practice recording feature stores only a submission record in demo mode.</p></div>
 <div className="part-tabs">{speaking.map((s,i)=><button className={i===part?"active":""} onClick={()=>{setPart(i);setStatus("")}} key={s.id}>Part {s.part}</button>)}</div>
 <div className="speaking-card">{item.cueCard?<><span className="tag">CUE CARD</span><h2>{item.cueCard}</h2><div className="speaking-timers"><div><small>Preparation</small><Timer seconds={60}/></div><div><small>Speaking</small><Timer seconds={120}/></div></div></>:<div className="speaking-questions">{item.questions.map((q,i)=><div className="speak-q" key={q}><b>{i+1}</b><span>{q}</span></div>)}</div>}
 <div className="record-row">{recording?<button className="record-btn stop" onClick={stop}><Square size={18}/> Stop recording</button>:<button className="record-btn" onClick={start}><Mic size={18}/> Start recording</button>}<span>{status}</span></div></div>
 </div>
}
