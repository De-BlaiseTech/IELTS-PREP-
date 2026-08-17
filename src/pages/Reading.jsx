import React, { useState } from "react";
import Timer from "../components/Timer";
import QuestionCard from "../components/QuestionCard";
import { useApp } from "../context/AppContext";
import { estimateBand } from "../data/demo";

export default function Reading(){
 const {questions,saveLocalAttempt}=useApp(); const qs=questions.filter(q=>q.skill==="reading"); const [answers,setAnswers]=useState({}); const [submitted,setSubmitted]=useState(false);
 function submit(){setSubmitted(true);const correct=qs.filter(q=>answers[q.id]===q.answer).length;saveLocalAttempt({type:"skill",skill:"reading",correct,total:qs.length,overall:estimateBand("reading",correct,qs.length)});}
 return <div><div className="exam-top"><div><span className="tag">READING PRACTICE</span><h1>Reading Passage 1</h1><p>Read the passage and answer the questions. This demo contains original sample content.</p></div><Timer seconds={20*60}/></div>
 <div className="reading-workspace"><article className="passage-panel"><h2>Shared urban gardens</h2><p>Urban gardens can improve access to fresh food while giving residents shared spaces for learning and community activities. Their success often depends on reliable water, local volunteers and clear management arrangements.</p><p>Some projects begin on unused plots and develop gradually as residents contribute ideas, tools and time. The most sustainable schemes tend to combine practical planning with community participation.</p></article><main className="questions-panel">{qs.map(q=><QuestionCard key={q.id} question={q} value={answers[q.id]} onChange={v=>setAnswers(a=>({...a,[q.id]:v}))}/>)}<button className="primary-btn" onClick={submit}>Submit reading practice</button>{submitted&&<div className="success-box">Practice submitted. Your estimated band is now included in your progress history.</div>}</main></div>
 </div>
}
