import React, { useMemo, useState } from "react";
import Timer from "../components/Timer";
import { useApp } from "../context/AppContext";
import { saveWritingSubmission } from "../services/data";

export default function Writing(){
 const {writingTasks,user}=useApp(); const [task,setTask]=useState(writingTasks[0]); const [text,setText]=useState(""); const [submitted,setSubmitted]=useState(false);
 const words=useMemo(()=>text.trim()?text.trim().split(/\s+/).length:0,[text]);
 async function submit(){await saveWritingSubmission({userId:user?.uid||"demo-user",taskId:task.id,text,wordCount:words,createdAt:new Date().toISOString(),status:"submitted"});setSubmitted(true);}
 return <div><div className="page-heading"><p className="eyebrow">WRITING PRACTICE</p><h1>{task.title}</h1><p>Develop your response under realistic time and word-count conditions.</p></div>
 <div className="writing-toolbar"><div className="segmented"><button className={task.task===1?"selected":""} onClick={()=>{setTask(writingTasks.find(x=>x.task===1));setText("");setSubmitted(false)}}>Task 1</button><button className={task.task===2?"selected":""} onClick={()=>{setTask(writingTasks.find(x=>x.task===2));setText("");setSubmitted(false)}}>Task 2</button></div><Timer seconds={60*60}/></div>
 <div className="writing-prompt"><span className="tag">PROMPT</span><h2>{task.prompt}</h2>{task.visualNote&&<div className="visual-placeholder">{task.visualNote}</div>}<strong>Minimum: {task.minimumWords} words</strong></div>
 <textarea className="writing-editor" value={text} onChange={e=>{setText(e.target.value);setSubmitted(false)}} placeholder="Write your answer here..."></textarea>
 <div className="writing-footer"><span>Word count: <strong>{words}</strong></span><button className="primary-btn" onClick={submit} disabled={words<20}>Submit response</button></div>
 {submitted&&<div className="success-box">Response submitted. In production, this submission can be routed to a teacher or a trusted evaluation service for feedback.</div>}
 </div>
}
