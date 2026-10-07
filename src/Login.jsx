import React,{useState} from 'react';
import {ClipboardList,ChevronRight} from 'lucide-react';
import {supabase,supabaseConfigured} from './supabase.js';

export default function Login(){
 const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
 async function submit(e){
  e.preventDefault();setError('');
  if(!supabaseConfigured){setError('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel, then redeploy.');return}
  setBusy(true);
  const {error}=await supabase.auth.signInWithPassword({email:email.trim(),password});
  if(error)setError(error.message);
  setBusy(false);
 }
 return <div className="loginpage"><div className="loginbox">
  <div className="brand loginbrand"><div className="logo"><ClipboardList size={25}/></div><div><b>Prarambha</b><span>Staff Loan Request System</span></div></div>
  <h1>Staff Sign In</h1><p>Secure access for staff, approvers and administrators.</p>
  {!supabaseConfigured&&<div className="warning">Supabase connection is not configured yet.</div>}
  {error&&<div className="error">{error}</div>}
  <form onSubmit={submit}>
   <label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="staff@company.com" required autoComplete="username"/></label>
   <label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required autoComplete="current-password"/></label>
   <button className="primary full" disabled={busy}>{busy?'Signing in…':'Sign In'} <ChevronRight size={17}/></button>
  </form>
  <small className="muted">Authentication is handled by Supabase Auth.</small>
 </div></div>;
}
