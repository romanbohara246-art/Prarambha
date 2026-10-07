import React,{useMemo,useState} from 'react';
import {Download,FileText,BarChart3,CheckCircle2,XCircle} from 'lucide-react';
import {Stat,RequestTable} from './ui.jsx';
import {PRODUCTS,STATUSES,fmtRs,exportCsv,exportPdf} from './lib.js';

export default function Reports({requests,onOpen}){
 const [from,setFrom]=useState(''),[to,setTo]=useState(''),[st,setSt]=useState('All statuses'),[pr,setPr]=useState('All products'),[busy,setBusy]=useState(false);
 const rows=useMemo(()=>requests.filter(r=>{const d=r.created_at.slice(0,10);
  return(!from||d>=from)&&(!to||d<=to)&&(st==='All statuses'||r.status===st)&&(pr==='All products'||r.product===pr)}),[requests,from,to,st,pr]);
 const sum=a=>a.reduce((t,r)=>t+Number(r.amount),0);
 const approved=rows.filter(r=>r.status==='Approved');
 const byProduct=PRODUCTS.map(p=>{const l=rows.filter(r=>r.product===p.name);return{name:p.name,count:l.length,total:sum(l),ok:sum(l.filter(r=>r.status==='Approved'))}});
 async function pdf(){setBusy(true);try{await exportPdf(rows)}finally{setBusy(false)}}
 return <>
  <div className="stats">
   <Stat icon={<FileText/>} label="Requests" value={rows.length} note="In this filter"/>
   <Stat icon={<BarChart3/>} label="Total requested" value={fmtRs(sum(rows))} note="All statuses"/>
   <Stat icon={<CheckCircle2/>} label="Approved amount" value={fmtRs(sum(approved))} note={approved.length+' approved'}/>
   <Stat icon={<XCircle/>} label="Rejected" value={rows.filter(r=>r.status==='Rejected with Reason').length} note="Reason logged"/>
  </div>
  <section className="card">
   <div className="toolbar">
    <label className="inl">From<input type="date" value={from} onChange={e=>setFrom(e.target.value)}/></label>
    <label className="inl">To<input type="date" value={to} onChange={e=>setTo(e.target.value)}/></label>
    <select value={st} onChange={e=>setSt(e.target.value)}><option>All statuses</option>{STATUSES.map(s=><option key={s}>{s}</option>)}</select>
    <select value={pr} onChange={e=>setPr(e.target.value)}><option>All products</option>{PRODUCTS.map(p=><option key={p.name}>{p.name}</option>)}</select>
    <button className="primary" onClick={()=>exportCsv(rows)} disabled={!rows.length}><Download size={16}/> CSV</button>
    <button className="primary" onClick={pdf} disabled={!rows.length||busy}><Download size={16}/> {busy?'Making PDF…':'PDF'}</button>
   </div>
   <div className="tablewrap"><table><thead><tr><th>Product</th><th>Requests</th><th>Total requested</th><th>Approved amount</th></tr></thead>
    <tbody>{byProduct.map(p=><tr key={p.name}><td><b>{p.name}</b></td><td>{p.count}</td><td>{fmtRs(p.total)}</td><td>{fmtRs(p.ok)}</td></tr>)}</tbody></table></div>
  </section>
  <section className="card"><div className="cardtitle"><div><b>Matching requests</b><small>Included in the exports</small></div></div><RequestTable rows={rows} onOpen={onOpen}/></section>
 </>;
}
