import React,{useEffect,useState} from 'react';
import {supabase} from './supabase.js';
import {Modal,StatusBadge} from './ui.jsx';
import {fmtRs,fmtDate,fmtDateTime} from './lib.js';

const fromReq=r=>({field_visit_done:!!r.field_visit_done,field_visit_date:r.field_visit_date||'',documents_collected:!!r.documents_collected,documentation_done:!!r.documentation_done,officer_remarks:r.officer_remarks||''});

export default function RequestDetail({r,me,online,onClose,onChanged}){
 const [audit,setAudit]=useState([]),[busy,setBusy]=useState(false),[err,setErr]=useState(''),[rejecting,setRejecting]=useState(false),[reason,setReason]=useState('');
 const [rv,setRv]=useState(fromReq(r));
 useEffect(()=>{setRv(fromReq(r))},[r.id,r.status,r.updated_at]);
 const loadAudit=async()=>{const {data}=await supabase.from('audit_log').select('*').eq('request_id',r.id).order('created_at');setAudit(data||[])};
 useEffect(()=>{if(online)loadAudit()},[r.id,r.status,r.updated_at,online]);

 const reviewer=me.role==='approver'||me.role==='admin';
 const own=r.user_id===me.id;
 const canAct=reviewer&&(!own||me.role==='admin')&&online;
 const saved=fromReq(r);
 const dirty=JSON.stringify(rv)!==JSON.stringify(saved);
 const complete=saved.field_visit_done&&!!saved.field_visit_date&&saved.documents_collected&&saved.documentation_done&&saved.officer_remarks.trim().length>=5;
 const today=new Date().toISOString().slice(0,10);

 async function run(fn){setBusy(true);setErr('');const {error}=await fn();if(error)setErr(error.message);else{await onChanged();await loadAudit()}setBusy(false);return !error}
 const saveReview=()=>run(()=>supabase.from('loan_requests').update({
  field_visit_done:rv.field_visit_done,field_visit_date:rv.field_visit_done?(rv.field_visit_date||null):null,
  documents_collected:rv.documents_collected,documentation_done:rv.documentation_done,officer_remarks:rv.officer_remarks.trim()||null}).eq('id',r.id));
 const move=async(to,why)=>{const patch={status:to};if(why)patch.reject_reason=why;
  const ok=await run(()=>supabase.from('loan_requests').update(patch).eq('id',r.id));if(ok){setRejecting(false);setReason('')}};

 const rows=[['Member',r.member_name],['Member ID',r.member_id],['Member phone',r.member_phone],['Member address',r.member_address||'-'],['Member citizenship no. (KYC)',r.member_citizenship_no],
  ['Share amount',fmtRs(r.share_amount)],['Total saving amount',fmtRs(r.total_saving_amount)],['Account open date',r.account_open_date?fmtDate(r.account_open_date):'-'],
  ['Submitted by (staff)',r.staff_name],['Product',r.product],['Product detail',r.product_detail],['Security',r.security_type],
  ...(r.collateral_details?[['Collateral',r.collateral_details]]:[]),...(r.savings_account_no?[['Savings account',r.savings_account_no]]:[]),
  ['Loan amount',fmtRs(r.amount)],['Loan period',r.tenure_months+' months'],['Purpose',r.purpose],
  ...(r.guarantee_details?[['Guarantee',r.guarantee_details]]:[]),
  ...(r.guarantor_name?[['Guarantor',r.guarantor_name+(r.guarantor_relation?' ('+r.guarantor_relation+')':'')],['Guarantor phone',r.guarantor_phone||'-'],['Guarantor member ID',r.guarantor_member_id||'-']]:[]),
  ['Stage',r.stage],['Submitted',fmtDateTime(r.created_at)],
  ...(r.reject_reason?[['Rejection reason',r.reject_reason]]:[]),
  ...(r.paperwork_done_at?[['Paper work completed',fmtDateTime(r.paperwork_done_at)]]:[]),
  ...(r.disbursed_at?[['Loan disbursed',fmtDateTime(r.disbursed_at)]]:[])];
 const editing=r.status==='Under Review'&&canAct;
 const showSummary=r.status!=='Pending'&&!editing;

 return <Modal onClose={onClose}>
  <div className="cardtitle"><div><b>{r.request_code}</b><small>Request details</small></div><StatusBadge s={r.status}/></div>
  {rows.map(([k,v])=><div className="kv" key={k}><span>{k}</span><b>{v}</b></div>)}

  {showSummary&&<div className="reviewbox">
   <div className="cardtitle" style={{margin:0}}><div><b>Loan officer review</b><small>Field visit, documents and remarks</small></div></div>
   <div className="kv"><span>Field visit</span><b>{r.field_visit_done?'Done'+(r.field_visit_date?' on '+fmtDate(r.field_visit_date):'')+(r.field_visit_by?' by '+r.field_visit_by:''):'Not done'}</b></div>
   <div className="kv"><span>Documents collected</span><b>{r.documents_collected?'Yes':'No'}</b></div>
   <div className="kv"><span>Documentation done</span><b>{r.documentation_done?'Yes':'No'}</b></div>
   <div className="kv"><span>Remarks</span><b>{r.officer_remarks||'-'}</b></div></div>}

  {editing&&<div className="reviewbox">
   <div className="cardtitle" style={{margin:0}}><div><b>Loan officer review</b><small>Complete everything, save, then approve</small></div></div>
   <label className="chk"><input type="checkbox" checked={rv.field_visit_done} onChange={e=>setRv({...rv,field_visit_done:e.target.checked})}/> Field visit done</label>
   {rv.field_visit_done&&<label>Field visit date<input type="date" max={today} value={rv.field_visit_date} onChange={e=>setRv({...rv,field_visit_date:e.target.value})}/></label>}
   <label className="chk"><input type="checkbox" checked={rv.documents_collected} onChange={e=>setRv({...rv,documents_collected:e.target.checked})}/> Documents collected</label>
   <label className="chk"><input type="checkbox" checked={rv.documentation_done} onChange={e=>setRv({...rv,documentation_done:e.target.checked})}/> Documentation done</label>
   <label>Loan officer remarks<textarea value={rv.officer_remarks} onChange={e=>setRv({...rv,officer_remarks:e.target.value})} placeholder="Explain the status of the member, visit findings and documents..."/></label>
   <div><button className="primary" disabled={busy||!dirty} onClick={saveReview}>Save review</button></div>
  </div>}

  {err&&<div className="error">{err}</div>}
  {reviewer&&own&&me.role!=='admin'&&<div className="warning">You cannot review your own request.</div>}

  {canAct&&r.status==='Pending'&&<div className="actions"><button className="primary" disabled={busy} onClick={()=>move('Under Review')}>Start review</button></div>}
  {canAct&&r.status==='Under Review'&&!rejecting&&<>
   <div className="actions">
    <button className="primary" disabled={busy||dirty||!complete} onClick={()=>move('Approved')}>Approve</button>
    <button className="primary danger" disabled={busy} onClick={()=>setRejecting(true)}>Reject</button></div>
   {(dirty||!complete)&&<p className="hint">Approve unlocks after field visit (with date), documents, documentation and remarks are saved.</p>}</>}
  {canAct&&rejecting&&<div className="actions col">
   <label>Reason for rejection<textarea value={reason} onChange={e=>setReason(e.target.value)} placeholder="e.g. Not eligible, incomplete documents..."/></label>
   <div className="actions"><button className="primary danger" disabled={busy||reason.trim().length<5} onClick={()=>move('Rejected with Reason',reason.trim())}>Confirm reject</button>
   <button className="link" onClick={()=>setRejecting(false)}>Cancel</button></div></div>}
  {canAct&&r.status==='Approved'&&<div className="actions"><button className="primary" disabled={busy} onClick={()=>move('Ready for Disburse')}>Paper work completed</button></div>}
  {canAct&&r.status==='Ready for Disburse'&&<div className="actions"><button className="primary" disabled={busy} onClick={()=>{if(window.confirm('Confirm the loan has been disbursed to the member?'))move('Disbursed')}}>Mark loan disbursed</button></div>}

  <div className="cardtitle" style={{marginTop:18}}><div><b>Audit trail</b><small>History of this request</small></div></div>
  {audit.length===0&&<p className="muted">{online?'No history yet.':'History is available when online.'}</p>}
  {audit.map(a=><div className="timeline" key={a.id}><b>{a.action}{a.to_status?' → '+a.to_status:''}</b><span>{a.actor_name} • {fmtDateTime(a.created_at)}</span>{a.note&&<small>{a.note}</small>}</div>)}
  <div className="actions"><button className="link" onClick={onClose}>Close</button></div>
 </Modal>;
}
