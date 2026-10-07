import React,{useEffect,useState} from 'react';
import {supabase} from './supabase.js';
import {fmtDateTime} from './lib.js';

export default function Audit({online}){
 const [rows,setRows]=useState([]),[error,setError]=useState('');
 useEffect(()=>{if(!online)return;supabase.from('audit_log').select('*').order('created_at',{ascending:false}).limit(300)
  .then(({data,error})=>{if(error)setError(error.message);else setRows(data||[])})},[online]);
 return <section className="card">
  {error&&<div className="error">{error}</div>}
  {!online&&<p className="muted pad">The audit trail needs an internet connection.</p>}
  <div className="tablewrap"><table><thead><tr><th>When</th><th>Request</th><th>Action</th><th>Change</th><th>By</th><th>Note</th></tr></thead>
   <tbody>{rows.map(a=><tr key={a.id}><td>{fmtDateTime(a.created_at)}</td><td><b>{a.request_code}</b></td><td>{a.action}</td>
    <td>{a.from_status?a.from_status+' → ':''}{a.to_status}</td><td>{a.actor_name}</td><td>{a.note}</td></tr>)}</tbody></table></div>
  {online&&rows.length===0&&!error&&<p className="muted pad">No activity yet.</p>}
 </section>;
}
