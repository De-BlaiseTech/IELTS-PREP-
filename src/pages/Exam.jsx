import React, { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Timer from "../components/Timer";
import { useApp } from "../context/AppContext";
import { calculateOverall, estimateBand } from "../data/demo";
import QuestionCard from "../components/QuestionCard";

export default function Exam(){
 const {testId}=useParams(); const {tests,questions,saveLocalAttempt}=useApp(); const test=tests.find(t=>t.id===testId); const navigate=useNavigate();
 const [stage,setStage]=useState(0); const [answers,setAnswers]=useState({}); const [done,setDone]=useState(false); const [result,setResult]=useState(null);
 const stages=["Listening","Reading","Writing"];
 const qs=questions.filter(q=>q.skill===stages[stage].toLowerCase());
 function finish(){const score={listening:estimateBand("listening",answers.correctListening||0,10),reading:estimateBand("reading",answers.correctReading||0,10)};const overall=calculateOverall(score);const r={...score,overall};setResult(r);setDone(true);saveLocalAttempt({type:"mock",testId,overall,skills:score});}
 if(!test)return <div className="empty">Test not found.</div>;
 if(done)return <div><div className="result-hero"><span className="eyebrow">MOCK TEST COMPLETE</span><h1>Estimated overall band</h1><strong>{result.overall || "—"}</strong><p>This is a practice estimate, not an official IELTS result.</p></div><div className="result-grid">{["listening","reading"].map(s=><div className="result-card" key={s}><span>{s}</span><strong>{result[s]||"—"}</strong></div>)}</div><button className="primary-btn" onClick={()=>navigate("/progress")}>View progress</button></div>;
 return <div><div className="exam-top"><div><span className="tag">{test.type}</span><h1>{stages[stage]}</h1><p>Full mock test • Section {stage+1}</p></div><Timer seconds={stage===2?60*60:30*60}/></div>
 <div className="stepper">{stages.map((s,i)=><div className={i===stage?"step active":i<stage?"step complete":"step"} key={s}><span>{i+1}</span>{s}</div>)}</div>
 {stage<2?<div className="exam-layout"><main>{qs.map(q=><QuestionCard key={q.id} question={q} value={answers[q.id]} onChange={v=>setAnswers(a=>({...a,[q.id]:v}))}/>) }<button className="primary-btn" onClick={()=>{if(stage<2)setStage(stage+1);else finish()}}>{stage===2?"Finish mock":"Continue to next section"}</button></main><aside className="exam-sidebar"><h3>Exam sections</h3>{stages.map((s,i)=><div className={i===stage?"side-stage active":"side-stage"} key={s}>{i+1}. {s}</div>)}</aside></div>:<div className="writing-prompt"><h2>Writing section</h2><p>For this foundation build, use the dedicated Writing module for Task 1 and Task 2. The production version can embed both tasks directly here.</p><button className="primary-btn" onClick={finish}>Finish mock test</button></div>}
 </div>
}
