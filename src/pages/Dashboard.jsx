import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Headphones, Mic2, PenLine, BookOpen, Target } from "lucide-react";
import { useApp } from "../context/AppContext";

export default function Dashboard(){
  const {user,targetBand,attempts,saveLocalAttempt}=useApp();
  const latest=attempts[0];
  const current=latest?.overall || 0;
  const skills=[["Listening",7.0,Headphones,"/listening"],["Reading",6.5,BookOpen,"/reading"],["Writing",6.0,PenLine,"/writing"],["Speaking",6.5,Mic2,"/speaking"]];
  return <div>
    <section className="hero"><div><p className="eyebrow">YOUR PREPARATION HUB</p><h1>Welcome back, {user?.displayName || user?.email?.split("@")[0] || "Student"}.</h1><p>Keep building the skills you need for your target IELTS band.</p></div><Link className="primary-btn" to="/mock-tests">Take a mock test <ArrowRight size={18}/></Link></section>
    <div className="stat-grid"><div className="stat-card"><span>Current estimate</span><strong>{current || "—"}</strong><small>Based on your latest practice</small></div><div className="stat-card"><span>Target band</span><strong>{targetBand}</strong><small>Keep your target in view</small></div><div className="stat-card"><span>Tests completed</span><strong>{attempts.length}</strong><small>Practice attempts recorded</small></div><div className="stat-card"><span>Study streak</span><strong>7</strong><small>Demo value — connect activity data later</small></div></div>
    <section className="section"><div className="section-heading"><div><p className="eyebrow">SKILLS</p><h2>Your IELTS skills</h2></div><Link to="/progress">View progress <ArrowRight size={16}/></Link></div>
      <div className="skill-grid">{skills.map(([name,band,Icon,to])=><Link to={to} className="skill-card" key={name}><div className="skill-icon"><Icon size={22}/></div><div className="skill-main"><strong>{name}</strong><div className="progress"><span style={{width:`${band/9*100}%`}}/></div><small>Estimated band {band}</small></div><ArrowRight size={18}/></Link>)}</div>
    </section>
    <section className="section"><div className="section-heading"><div><p className="eyebrow">RECOMMENDED</p><h2>Practice next</h2></div></div>
      <div className="recommendation"><div><div className="tag">READING</div><h3>Improve question accuracy</h3><p>Practise True/False/Not Given and Matching Headings to strengthen your reading technique.</p></div><Link className="secondary-btn" to="/reading">Start practice</Link></div>
    </section>
  </div>
}
