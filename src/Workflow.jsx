import React from 'react';
import {FLOW,fmtRs} from './lib.js';

export default function Workflow({me,requests,onOpen}){
 const mine=r=>r.user_id===me.id&&me.role!=='admin';
 const todo=requests.filter(r=>(r.status==='Pending'||r.status==='Under Review')&&!mine(r)).length;
 return <>
  <div className="card"><b>{todo}</b> request{todo===1?'':'s'} waiting for your action. Flow: Pending → Under Review → Approved or Rejected with Reason. Open a card to act.</div>
  <div className="kanban">
   {FLOW.map(([st,note])=>{const list=requests.filter(r=>r.status===st);return <div className="card col" key={st}>
    <div className="cardtitle"><div><b>{st}</b><small>{note}</small></div><span className="badge">{list.length}</span></div>
    {list.length===0&&<p className="muted">Nothing here.</p>}
    {list.map(r=><div key={r.id} className="product click" onClick={()=>onOpen(r.id)}>
     <div><b>{r.request_code} • {r.member_name}</b><small>{r.product} • {fmtRs(r.amount)} • {r.tenure_months} mo • by {r.staff_name}</small></div></div>)}
   </div>})}
  </div>
 </>;
}
