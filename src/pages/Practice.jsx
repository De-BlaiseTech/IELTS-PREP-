import React from "react";
import { Link } from "react-router-dom";
export default function Practice(){
  const cards=[
    ["Listening","Train with section-based audio practice and varied question types.","/listening","🎧"],
    ["Reading","Practise passages, matching tasks, completion tasks and more.","/reading","📖"],
    ["Writing","Work through Task 1 and Task 2 with word counts and timed practice.","/writing","✍️"],
    ["Speaking","Practise all three parts with preparation and recording prompts.","/speaking","🎤"]
  ];
  return <div><div className="page-heading"><p className="eyebrow">PRACTICE CENTRE</p><h1>Choose a skill</h1><p>Practise one skill at a time and focus on the areas that need the most attention.</p></div><div className="practice-grid">{cards.map(([t,d,to,i])=><Link className="large-practice-card" to={to} key={t}><span className="emoji">{i}</span><h2>{t}</h2><p>{d}</p><span className="text-link">Start practice →</span></Link>)}</div></div>
}
