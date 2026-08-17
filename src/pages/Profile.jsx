import React from "react";
import { useApp } from "../context/AppContext";

export default function Profile(){
 const {user,targetBand,updateTargetBand}=useApp();
 return <div><div className="page-heading"><p className="eyebrow">ACCOUNT</p><h1>Profile</h1><p>Set your preparation target and review account information.</p></div>
 <div className="profile-card"><div className="profile-avatar">{(user?.displayName||user?.email||"S").slice(0,1).toUpperCase()}</div><div><h2>{user?.displayName||"Student"}</h2><p>{user?.email}</p></div></div>
 <div className="settings-card"><h2>Target band</h2><p>Choose the score you are working towards.</p><select value={targetBand} onChange={e=>updateTargetBand(e.target.value)}>{[5.5,6,6.5,7,7.5,8,8.5,9].map(x=><option key={x}>{x}</option>)}</select></div>
 </div>
}
