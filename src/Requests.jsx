import React,{useMemo,useState} from 'react';
import {Search,RefreshCw} from 'lucide-react';
import {RequestTable} from './ui.jsx';
import {PRODUCTS,STATUSES} from './lib.js';

export default function Requests({requests,onOpen,refresh,refreshing}){
 const [q,setQ]=useState(''),[st,setSt]=useState('All statuses'),[pr,setPr]=useState('All products');
 const rows=useMemo(()=>requests.filter(r=>
  `${r.request_code} ${r.member_name} ${r.member_id} ${r.staff_name} ${r.product} ${r.status}`.toLowerCase().includes(q.toLowerCase())
  &&(st==='All statuses'||r.status===st)&&(pr==='All products'||r.product===pr)),[requests,q,st,pr]);
 return <section className="card">
  <div className="toolbar">
   <div className="search"><Search size={18}/><input placeholder="Search request, member, member ID, staff or product..." value={q} onChange={e=>setQ(e.target.value)}/></div>
   <select value={st} onChange={e=>setSt(e.target.value)}><option>All statuses</option>{STATUSES.map(s=><option key={s}>{s}</option>)}</select>
   <select value={pr} onChange={e=>setPr(e.target.value)}><option>All products</option>{PRODUCTS.map(p=><option key={p.name}>{p.name}</option>)}</select>
   <button className="iconbtn dark" onClick={refresh} title="Refresh"><RefreshCw size={17} className={refreshing?'spin':''}/></button>
  </div>
  <RequestTable rows={rows} onOpen={onOpen}/>
 </section>;
}
