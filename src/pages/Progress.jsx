import React from "react";
import { useApp } from "../context/AppContext";

export default function Progress(){
 const {attempts,targetBand}=useApp();
 const sample=[["Listening",7],["Reading",6.5],["Writing",6],["Speaking",6.5]];
 return <div><div className="page-heading"><p className="eyebrow">YOUR PERFORMANCE</p><h1>Progress</h1><p>Track your practice performance and identify where to focus next.</p></div>
 <div className="progress-hero"><div><span>Target band</span><strong>{targetBand}</strong></div><div><span>Practice attempts</span><strong>{attempts.length}</strong></div><div><span>Latest overall</span><strong>{attempts[0]?.overall || "—"}</strong></div></div>
 <section className="section"><h2>Skill breakdown</h2><div className="analytics-grid">{sample.map(([s,b])=><div className="analytics-card" key={s}><div><span>{s}</span><strong>{b}</strong></div><div className="big-progress"><span style={{width:`${b/9*100}%`}}/></div></div>)}</div></section>
 <section className="section"><h2>Practice history</h2><div className="history">{attempts.length?attempts.map((a,i)=><div className="history-row" key={i}><span>{a.skill||"Mock test"}</span><span>{a.correct ?? "—"}/{a.total ?? "—"}</span><strong>{a.overall || "—"}</strong></div>):<div className="empty">Complete a practice test to build your history.</div>}</div></section>
 </div>
}
