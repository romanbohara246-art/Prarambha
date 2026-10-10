import React,{useState} from 'react';
import {FileText,ChevronRight,ShieldCheck,CheckCircle2} from 'lucide-react';
import {Modal} from './ui.jsx';
import {supabase} from './supabase.js';
import {PRODUCTS,SECURITY,UNSECURED_LIMIT,validateRequest,getQueue,setQueue,fmtRs} from './lib.js';

export default function NewRequest({me,uid,online,say,go,reload,setQueued,init}){
 const blank=()=>({member_name:'',member_id:'',member_phone:'',member_citizenship_no:'',member_address:'',share_amount:'',total_saving_amount:'',account_open_date:'',
  product:init?.product||'Personal',product_detail:'',security_type:init?.security||'Without Collateral',collateral_details:'',savings_account_no:'',amount:'',tenure_months:'12',purpose:'',
  guarantee_details:'',guarantor_name:'',guarantor_member_id:'',guarantor_phone:'',guarantor_relation:''});
 const [f,setF]=useState(blank);
 const [errors,setErrors]=useState({}),[busy,setBusy]=useState(false),[error,setError]=useState(''),[done,setDone]=useState(null);
 const set=k=>e=>setF({...f,[k]:e.target.value});
 const prod=PRODUCTS.find(p=>p.name===f.product);
 const sec=SECURITY.find(s=>s.name===f.security_type);
 const months=Number(f.tenure_months);
 const today=new Date().toISOString().slice(0,10);
 const opt=v=>v.trim()||null;
 const Err=({k})=>errors[k]?<small className="fielderr">{errors[k]}</small>:null;
 async function submit(e){
  e.preventDefault();setError('');
  const v=validateRequest(f);setErrors(v);
  if(Object.keys(v).length){setError('Please fix the highlighted fields.');return}
  const payload={staff_name:me.name,member_name:f.member_name.trim(),member_id:f.member_id.trim(),member_phone:f.member_phone.trim(),member_citizenship_no:f.member_citizenship_no.trim(),member_address:f.member_address.trim(),
   share_amount:Number(f.share_amount),total_saving_amount:Number(f.total_saving_amount),account_open_date:f.account_open_date,
   product:f.product,product_detail:f.product_detail.trim(),security_type:f.security_type,
   collateral_details:f.security_type==='With Collateral'?f.collateral_details.trim():null,
   savings_account_no:f.security_type==='With Saving'?f.savings_account_no.trim():null,
   amount:Number(f.amount),tenure_months:months,purpose:f.purpose.trim(),
   guarantee_details:opt(f.guarantee_details),guarantor_name:opt(f.guarantor_name),guarantor_member_id:opt(f.guarantor_member_id),guarantor_phone:opt(f.guarantor_phone),guarantor_relation:opt(f.guarantor_relation)};
  if(!online){
   setQueue([...getQueue(),{uid,payload,at:Date.now()}]);setQueued(getQueue().filter(q=>q.uid===uid).length);
   setDone({offline:true,member:payload.member_name,amount:payload.amount});return;
  }
  setBusy(true);
  const {data,error:err}=await supabase.from('loan_requests').insert(payload).select().single();
  setBusy(false);
  if(err){setError(err.message);return}
  await reload();setDone({code:data.request_code,member:payload.member_name,amount:payload.amount});
 }
 return <section className="card formcard">
  <div className="cardtitle"><div><b>New Loan Request for a Member</b><small>Submitted by {me.name}. Fields change with the product and security type.</small></div><FileText size={23}/></div>
  {error&&<div className="error">{error}</div>}
  <form onSubmit={submit} noValidate>
   <div className="formgrid">
    <div className="sectionlabel">Member details</div>
    <label>Member name<input value={f.member_name} onChange={set('member_name')} placeholder="e.g. Sita Karki"/><Err k="member_name"/></label>
    <label>Member ID<input value={f.member_id} onChange={set('member_id')} placeholder="e.g. M-00142"/><Err k="member_id"/></label>
    <label>Member mobile number<input value={f.member_phone} onChange={set('member_phone')} inputMode="numeric" maxLength={10} placeholder="98XXXXXXXX"/><Err k="member_phone"/></label>
    <label>Member citizenship number (KYC)<input value={f.member_citizenship_no} onChange={set('member_citizenship_no')} placeholder="As on the citizenship card"/><Err k="member_citizenship_no"/></label>
    <label className="wide">Member address<input value={f.member_address} onChange={set('member_address')} placeholder="Municipality, ward no., tole / street"/><Err k="member_address"/></label>
    <label>Share amount (Rs.)<input type="number" min="0" value={f.share_amount} onChange={set('share_amount')} placeholder="0"/><Err k="share_amount"/></label>
    <label>Total saving amount (Rs.)<input type="number" min="0" value={f.total_saving_amount} onChange={set('total_saving_amount')} placeholder="0"/><Err k="total_saving_amount"/></label>
    <label>Account open date<input type="date" max={today} value={f.account_open_date} onChange={set('account_open_date')}/><Err k="account_open_date"/></label>
    <div className="sectionlabel">Loan details</div>
    <label>Loan product<select value={f.product} onChange={set('product')}>{PRODUCTS.map(p=><option key={p.name}>{p.name}</option>)}</select><small className="muted">{prod.desc}</small></label>
    <label>{prod.label}<input value={f.product_detail} onChange={set('product_detail')}/><Err k="product_detail"/></label>
    <label>Security type<select value={f.security_type} onChange={set('security_type')}>{SECURITY.map(s=><option key={s.name}>{s.name}</option>)}</select><small className="muted">{sec.desc}</small></label>
    {f.security_type==='With Collateral'&&<label>Collateral details<input value={f.collateral_details} onChange={set('collateral_details')} placeholder="Property / gold / asset and value"/><Err k="collateral_details"/></label>}
    {f.security_type==='With Saving'&&<label>Member savings account number<input value={f.savings_account_no} onChange={set('savings_account_no')}/><Err k="savings_account_no"/></label>}
    <label>Loan amount (Rs.)<input type="number" min="1000" value={f.amount} onChange={set('amount')} placeholder="250000"/>
     <small className="muted">{f.security_type==='With Collateral'?'No upper limit':'Maximum '+fmtRs(UNSECURED_LIMIT)}</small><Err k="amount"/></label>
    <label>Loan period (months)<input type="number" min="3" max="120" value={f.tenure_months} onChange={set('tenure_months')}/>
     <small className="muted">{months>=12&&months%12===0?(months/12)+' year'+(months===12?'':'s'):'3 to 120 months'}</small><Err k="tenure_months"/></label>
    <label className="wide">Purpose<textarea value={f.purpose} onChange={set('purpose')} placeholder="Explain what the member needs the loan for..."/><Err k="purpose"/></label>
    <div className="sectionlabel">Guarantee</div>
    <label className="wide">Guarantee details (optional)<input value={f.guarantee_details} onChange={set('guarantee_details')} placeholder="What is offered as guarantee, e.g. land, salary, group guarantee"/></label>
    <div className="sectionlabel">Personal guarantee (guarantor)</div>
    <label>Guarantor name<input value={f.guarantor_name} onChange={set('guarantor_name')}/><Err k="guarantor_name"/></label>
    <label>Guarantor member ID<input value={f.guarantor_member_id} onChange={set('guarantor_member_id')}/></label>
    <label>Guarantor mobile number<input value={f.guarantor_phone} onChange={set('guarantor_phone')} inputMode="numeric" maxLength={10} placeholder="98XXXXXXXX"/><Err k="guarantor_phone"/></label>
    <label>Relation to member<input value={f.guarantor_relation} onChange={set('guarantor_relation')} placeholder="e.g. Brother, Friend, Employer"/></label>
   </div>
   <div className="formfooter"><span><ShieldCheck size={16}/> Validated here and again in the database</span>
    <button className="primary" type="submit" disabled={busy}>{busy?'Submitting…':online?'Submit Request':'Save offline'} <ChevronRight size={17}/></button></div>
  </form>
  {done&&<Modal onClose={()=>go('/requests')}>
   <div className="thanks">
    <div className="thanksicon"><CheckCircle2 size={46}/></div>
    <h2>Thank you!</h2>
    {done.offline
     ?<p>You are offline, so the loan request for <b>{done.member}</b> ({fmtRs(done.amount)}) is saved on this device. It will be sent automatically when you are back online.</p>
     :<p>Your loan request <b>{done.code}</b> for <b>{done.member}</b> ({fmtRs(done.amount)}) has been submitted successfully.</p>}
    <div className="steps"><b>What happens next</b>
     <ol><li>A loan officer reviews it: field visit, document check and remarks.</li>
      <li>It is approved, or rejected with a reason.</li>
      <li>Paper work is completed, then the loan is disbursed to the member.</li></ol>
     <small>You will get a notification at every step, and you can track it any time under Requests.</small></div>
    <div className="actions" style={{justifyContent:'center'}}>
     <button className="primary" onClick={()=>go('/requests')}>View my requests</button>
     <button className="link" onClick={()=>{setDone(null);setF(blank());setErrors({})}}>Submit another</button></div>
   </div>
  </Modal>}
 </section>;
}
