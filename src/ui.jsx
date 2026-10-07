import React from 'react';
import {fmtRs,fmtDate,statusClass} from './lib.js';

export function Stat({icon,label,value,note,onClick}){
 return <div className={'stat'+(onClick?' click':'')} onClick={onClick}><div className="staticon">{icon}</div><div><span>{label}</span><strong>{value}</strong><small>{note}</small></div></div>;
}
export function StatusBadge({s}){return <span className={statusClass(s)}>{s}</span>}
export function Empty({title,text}){return <section className="card empty"><h2>{title}</h2><p>{text}</p></section>}
export function Modal({children,onClose}){
 return <div className="overlay" onClick={onClose}><div className="modal" onClick={e=>e.stopPropagation()}>{children}</div></div>;
}
export function BarList({rows}){
 const max=Math.max(1,...rows.map(r=>r.value));
 return <div className="bars">{rows.map(r=><div className={'barrow'+(r.onClick?' click':'')} key={r.label} onClick={r.onClick}>
  <span className="barlabel">{r.label}</span>
  <div className="bartrack"><div className="barfill" style={{width:(r.value/max*100)+'%'}}/></div>
  <b className="barval">{r.display??r.value}</b></div>)}</div>;
}
export function RequestTable({rows,onOpen}){
 if(!rows.length)return <p className="muted pad">No requests to show yet.</p>;
 return <div className="tablewrap"><table><thead><tr><th>Request</th><th>Member</th><th>Product</th><th>Amount</th><th>Period</th><th>Submitted by</th><th>Status</th></tr></thead>
  <tbody>{rows.map(r=><tr key={r.id} className={onOpen?'click':''} onClick={()=>onOpen&&onOpen(r.id)}>
   <td><b>{r.request_code}</b><small>{fmtDate(r.created_at)}</small></td>
   <td><b>{r.member_name}</b><small>ID: {r.member_id}</small></td>
   <td>{r.product}</td><td>{fmtRs(r.amount)}</td><td>{r.tenure_months} mo</td><td>{r.staff_name}</td>
   <td><StatusBadge s={r.status}/></td></tr>)}</tbody></table></div>;
}
