import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signUp } from "../services/auth";

export default function Register() {
  const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [confirm,setConfirm]=useState("");
  const [loading,setLoading]=useState(false); const [error,setError]=useState(""); const navigate=useNavigate();
  async function submit(e){e.preventDefault();setError("");if(password!==confirm){setError("Passwords do not match.");return}setLoading(true);try{await signUp(email,password);navigate("/dashboard")}catch(err){setError(err.message||"Unable to create account.")}finally{setLoading(false)}}
  return <div className="auth-page"><div className="auth-card">
    <div className="auth-brand"><div className="brand-mark">I</div><h1>Create your account</h1><p>Build a focused IELTS preparation routine.</p></div>
    <form onSubmit={submit}><label>Email<input type="email" required value={email} onChange={e=>setEmail(e.target.value)}/></label>
    <label>Password<input type="password" required minLength="6" value={password} onChange={e=>setPassword(e.target.value)}/></label>
    <label>Confirm password<input type="password" required value={confirm} onChange={e=>setConfirm(e.target.value)}/></label>
    {error && <div className="error-box">{error}</div>}
    <button className="primary-btn full" disabled={loading}>{loading ? "Creating account…" : "Create account"}</button></form>
    <p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p>
  </div></div>
}
