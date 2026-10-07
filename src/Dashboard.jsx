import React from 'react';
import {Clock3,Search,CheckCircle2,XCircle,ChevronRight} from 'lucide-react';
import {Stat,RequestTable,BarList} from './ui.jsx';
import {PRODUCTS,SECURITY,FLOW,fmtRs} from './lib.js';

export default function Dashboard({me,requests,go,onOpen}){
 const by=s=>requests.filter(r=>r.status===s);
 const approved=by('Approved'),rejected=by('Rejected with Reason');
 const decided=approved.length+rejected.length;
 const rate=decided?Math.round(approved.length/decided*100):0;
 const dr=[...approved,...rejected].filter(r=>r.reviewed_at);
 const avgH=dr.length?dr.reduce((t,r)=>t+(new Date(r.reviewed_at)-new Date(r.created_at)),0)/dr.length/36e5:0;
 const avg=!dr.length?'-':avgH<1?Math.round(avgH*60)+' min':avgH<48?avgH.toFixed(1)+' hrs':(avgH/24).toFixed(1)+' days';
 const months=[...Array(6)].map((_,i)=>{const d=new Date();d.setDate(1);d.setMonth(d.getMonth()-(5-i));return{key:d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'),label:d.toLocaleString('en-GB',{month:'short'})}});
 const monthRows=months.map(m=>({label:m.label,value:requests.filter(r=>r.created_at.slice(0,7)===m.key).length}));
 const productRows=PRODUCTS.map(p=>({label:p.name,value:requests.filter(r=>r.product===p.name).length}));
 const sum=a=>a.reduce((t,r)=>t+Number(r.amount),0);
 return <>
  <div className="stats">
   <Stat icon={<Clock3/>} label="Pending" value={by('Pending').length} note="Awaiting review"/>
   <Stat icon={<Search/>} label="Under Review" value={by('Under Review').length} note="Risk assessment"/>
   <Stat icon={<CheckCircle2/>} label="Approved" value={approved.length} note="Ready for disbursal"/>
   <Stat icon={<XCircle/>} label="Rejected" value={rejected.length} note="Reason logged"/>
  </div>
  <section className="grid3">
   <div className="card"><div className="cardtitle"><div><b>Requests by product</b><small>{me.role==='staff'?'Requests you submitted':'All requests'}</small></div></div><BarList rows={productRows}/></div>
   <div className="card"><div className="cardtitle"><div><b>Last 6 months</b><small>Requests submitted</small></div></div><BarList rows={monthRows}/></div>
   <div className="card"><div className="cardtitle"><div><b>Key metrics</b><small>Performance</small></div></div>
    <div className="kv"><span>Total requested</span><b>{fmtRs(sum(requests))}</b></div>
    <div className="kv"><span>Approved amount</span><b>{fmtRs(sum(approved))}</b></div>
    <div className="kv"><span>Approval rate</span><b>{decided?rate+'%':'-'}</b></div>
    <div className="kv"><span>Avg. decision time</span><b>{avg}</b></div></div>
  </section>
  <section className="card"><div className="cardtitle"><div><b>Recent Requests</b><small>Click a row for details</small></div><button className="link" onClick={()=>go('/requests')}>View all <ChevronRight size={15}/></button></div><RequestTable rows={requests.slice(0,5)} onOpen={onOpen}/></section>
  <section className="grid2">
   <div className="card"><div className="cardtitle"><div><b>5 Loan Products</b><small>Available request categories</small></div><button className="link" onClick={()=>go('/new')}>Create <ChevronRight size={15}/></button></div>
    <div className="productgrid">{PRODUCTS.map(p=><div className="product" key={p.name}><span>{p.icon}</span><div><b>{p.name}</b><small>{p.desc}</small></div></div>)}</div></div>
   <div className="card"><div className="cardtitle"><div><b>3 Security Types</b><small>Policy controls</small></div></div>
    {SECURITY.map(s=><div className="product" key={s.name}><span>{s.icon}</span><div><b>{s.name}</b><small>{s.desc}</small></div></div>)}</div>
  </section>
  <section className="card"><div className="cardtitle"><div><b>4 Status Flow</b><small>From submission to decision</small></div></div>
   <div className="flow">{FLOW.map((x,i)=><div className="flowitem" key={x[0]}><div className={'flowicon f'+i}>{[<Clock3/>,<Search/>,<CheckCircle2/>,<XCircle/>][i]}</div><div><b>{x[0]}</b><small>{x[1]}</small></div></div>)}</div></section>
 </>;
}
