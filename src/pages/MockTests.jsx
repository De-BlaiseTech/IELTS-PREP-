import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Clock, FileText, ArrowRight } from "lucide-react";
import { useApp } from "../context/AppContext";

export default function MockTests(){
 const {tests}=useApp(); const [type,setType]=useState("academic");
 return <div><div className="page-heading"><p className="eyebrow">FULL EXAMS</p><h1>Mock tests</h1><p>Simulate an IELTS practice session with timed sections and detailed review.</p></div>
 <div className="segmented"><button className={type==="academic"?"selected":""} onClick={()=>setType("academic")}>Academic</button><button className={type==="general"?"selected":""} onClick={()=>setType("general")}>General Training</button></div>
 <div className="test-list">{tests.filter(t=>t.type===type).map(t=><div className="test-card" key={t.id}><div className="test-icon"><FileText size={24}/></div><div className="test-info"><span className="tag">{t.type}</span><h2>{t.title}</h2><p>{t.description}</p><div className="test-meta"><span><Clock size={15}/> {t.duration} minutes</span><span>{t.skills.join(" · ")}</span></div></div><Link className="primary-btn" to={`/exam/${t.id}`}>Start <ArrowRight size={17}/></Link></div>)}</div>
 </div>
}
