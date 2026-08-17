import React, { useState } from "react";
import { Link } from "react-router-dom";
import Timer from "../components/Timer";
import QuestionCard from "../components/QuestionCard";
import { useApp } from "../context/AppContext";
import { estimateBand } from "../data/demo";

export default function Listening(){
 const {questions,saveLocalAttempt}=useApp(); const qs=questions.filter(q=>q.skill==="listening"); const [answers,setAnswers]=useState({}); const [submitted,setSubmitted]=useState(false);
 function submit(){setSubmitted(true);const correct=qs.filter(q=>answers[q.id]&&q.acceptedAnswers?.map(x=>x.toLowerCase()).includes(String(answers[q.id]).trim().toLowerCase()) || answers[q.id]===q.answer).length;saveLocalAttempt({type:"skill",skill:"listening",correct,total:qs.length,overall:estimateBand("listening",correct,qs.length)});}
 return <div><div className="exam-top"><div><span className="tag">LISTENING PRACTICE</span><h1>Listening Section 1</h1><p>Demo practice set. Replace the audio source with your own licensed content later.</p></div><Timer seconds={15*60}/></div>
 <div className="audio-panel"><div className="audio-circle">▶</div><div><strong>Demo audio placeholder</strong><p>Place the production audio URL in the test record and render it with an HTML audio player.</p></div></div>
 <div className="exam-layout"><main>{qs.map(q=><QuestionCard key={q.id} question={q} value={answers[q.id]} onChange={v=>setAnswers(a=>({...a,[q.id]:v}))}/>)}
 <button className="primary-btn" onClick={submit}>Submit listening practice</button>{submitted&&<div className="success-box">Practice submitted. Your result has been recorded locally.</div>}</main><aside className="exam-sidebar"><h3>Questions</h3>{qs.map(q=><span className={answers[q.id]?"answered":""} key={q.id}>{q.number}</span>)}<Link to="/practice" className="secondary-btn full">Exit practice</Link></aside></div>
 </div>
}
