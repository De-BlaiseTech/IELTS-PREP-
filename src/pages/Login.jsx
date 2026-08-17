import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signIn } from "../services/auth";

export default function Login() {
  const [email,setEmail]=useState(""); const [password,setPassword]=useState("");
  const [loading,setLoading]=useState(false); const [error,setError]=useState("");
  const navigate=useNavigate();
  async function submit(e){e.preventDefault();setLoading(true);setError("");try{await signIn(email,password);navigate("/dashboard")}catch(err){setError(err.message || "Unable to sign in.")}finally{setLoading(false)}}
  return <div className="auth-page"><div className="auth-card">
    <div className="auth-brand"><div className="brand-mark">I</div><h1>IELTS Prep</h1><p>Practice with purpose. Prepare with confidence.</p></div>
    <form onSubmit={submit}><label>Email<input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></label>
    <label>Password<input type="password" required value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••"/></label>
    {error && <div className="error-box">{error}</div>}
    <button className="primary-btn full" disabled={loading}>{loading ? "Signing in…" : "Sign in"}</button></form>
    <p className="auth-switch">New here? <Link to="/register">Create an account</Link></p>
    <p className="demo-note">Demo mode is enabled until Firebase is connected.</p>
  </div></div>
}
