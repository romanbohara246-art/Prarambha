import React,{useEffect,useState} from 'react';
import {supabase} from './supabase.js';
import {Modal,StatusBadge} from './ui.jsx';
import {fmtRs,fmtDateTime} from './lib.js';

export default function RequestDetail({r,me,online,onClose,onChanged}){
 const [audit,setAudit]=useState([]),[busy,setBusy]=useState(false),[err,setErr]=useState(''),[rejecting,setRejecting]=useState(false),[reason,setReason]=useState('');
 const loadAudit=async()=>{const {data}=await supabase.from('audit_log').select('*').eq('request_id',r.id).order('created_at');setAudit(data||[])};
 useEffect(()=>{if(online)loadAudit()},[r.id,r.status,online]);
 const reviewer=me.role==='approver'||me.role==='admin';
 const own=r.user_id===me.id;
 const canAct=reviewer&&(!own||me.role==='admin')&&online;
 async function move(to,why){
  setBusy(true);setErr('');
  const patch={status:to};if(why)patch.reject_reason=why;
  const {error}=await supabase.from('loan_requests').update(patch).eq('id',r.id);
  if(error)setErr(error.message);else{setRejecting(false);setReason('');await onChanged();await loadAudit()}
  setBusy(false);
 }
 const rows=[['Member',r.member_name],['Member ID',r.member_id],['Member phone',r.member_phone],['Member citizenship no. (KYC)',r.member_citizenship_no],['Submitted by (staff)',r.staff_name],
  ['Product',r.product],['Product detail',r.product_detail],['Security',r.security_type],
  ...(r.collateral_details?[['Collateral',r.collateral_details]]:[]),...(r.savings_account_no?[['Savings account',r.savings_account_no]]:[]),
  ['Loan amount',fmtRs(r.amount)],['Loan period',r.tenure_months+' months'],['Purpose',r.purpose],['Stage',r.stage],['Submitted',fmtDateTime(r.created_at)],
  ...(r.reject_reason?[['Rejection reason',r.reject_reason]]:[])];
 return <Modal onClose={onClose}>
  <div className="cardtitle"><div><b>{r.request_code}</b><small>Request details</small></div><StatusBadge s={r.status}/></div>
  {rows.map(([k,v])=><div className="kv" key={k}><span>{k}</span><b>{v}</b></div>)}
  {err&&<div className="error">{err}</div>}
  {reviewer&&own&&me.role!=='admin'&&<div className="warning">You cannot review your own request.</div>}
  {canAct&&r.status==='Pending'&&<div className="actions"><button className="primary" disabled={busy} onClick={()=>move('Under Review')}>Start review</button></div>}
  {canAct&&r.status==='Under Review'&&!rejecting&&<div className="actions">
   <button className="primary" disabled={busy} onClick={()=>move('Approved')}>Approve</button>
   <button className="primary danger" disabled={busy} onClick={()=>setRejecting(true)}>Reject</button></div>}
  {canAct&&rejecting&&<div className="actions col">
   <label>Reason for rejection<textarea value={reason} onChange={e=>setReason(e.target.value)} placeholder="e.g. Not eligible, incomplete documents..."/></label>
   <div className="actions"><button className="primary danger" disabled={busy||reason.trim().length<5} onClick={()=>move('Rejected with Reason',reason.trim())}>Confirm reject</button>
   <button className="link" onClick={()=>setRejecting(false)}>Cancel</button></div></div>}
  <div className="cardtitle" style={{marginTop:18}}><div><b>Audit trail</b><small>History of this request</small></div></div>
  {audit.length===0&&<p className="muted">{online?'No history yet.':'History is available when online.'}</p>}
  {audit.map(a=><div className="timeline" key={a.id}><b>{a.action}{a.to_status?' → '+a.to_status:''}</b><span>{a.actor_name} • {fmtDateTime(a.created_at)}</span>{a.note&&<small>{a.note}</small>}</div>)}
  <div className="actions"><button className="link" onClick={onClose}>Close</button></div>
 </Modal>;
}
