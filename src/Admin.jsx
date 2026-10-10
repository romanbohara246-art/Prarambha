import React,{useEffect,useState} from 'react';
import {UserPlus,Trash2,ShieldCheck,ChevronRight} from 'lucide-react';
import {supabase,signupClient} from './supabase.js';
import {ROLES,ROLE_LABEL} from './lib.js';

export default function Admin({me,online,say}){
 const [users,setUsers]=useState([]),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const load=async()=>{const {data,error}=await supabase.from('users').select('*').order('created_at',{ascending:false});if(error)setError(error.message);else setUsers(data||[])};
 useEffect(()=>{if(online)load()},[online]);
 async function create(e){
  e.preventDefault();setError('');setBusy(true);
  const form=e.currentTarget,f=new FormData(form);
  const name=String(f.get('name')).trim(),email=String(f.get('email')).trim().toLowerCase(),password=String(f.get('password')),role=String(f.get('role'));
  try{
   const {data,error:ae}=await signupClient.auth.signUp({email,password,options:{data:{name}}});
   if(ae)throw ae;
   if(!data.user||data.user.identities?.length===0)throw new Error('This email is already registered. Remove it in Supabase → Authentication first, or use another email.');
   const {error:ie}=await supabase.from('users').insert({id:data.user.id,name,email,role});
   if(ie)throw ie;
   say('Staff "'+name+'" created');form.reset();load();
  }catch(err){setError(err.message)}
  setBusy(false);
 }
 async function patch(u,changes){
  const {error}=await supabase.from('users').update(changes).eq('id',u.id);
  if(error)setError(error.message);else{setError('');load()}
 }
 async function remove(u){
  if(!window.confirm('Remove '+u.name+'? They will lose access to the app.'))return;
  const {error}=await supabase.from('users').delete().eq('id',u.id);
  if(error)setError(error.message);else load();
 }
 return <>
  <section className="card formcard">
   <div className="cardtitle"><div><b>Add New Staff</b><small>Creates a login and a staff profile</small></div><UserPlus size={23}/></div>
   {error&&<div className="error">{error}</div>}
   <form onSubmit={create}>
    <div className="formgrid">
     <label>Full Name<input name="name" required placeholder="e.g. Sita Karki"/></label>
     <label>Email<input name="email" type="email" required placeholder="staff@company.com"/></label>
     <label>Password<input name="password" type="password" minLength={6} required placeholder="Min 6 characters"/></label>
     <label>Role<select name="role" defaultValue="staff">{ROLES.map(r=><option key={r} value={r}>{ROLE_LABEL[r]}</option>)}</select></label>
    </div>
    <div className="formfooter"><span><ShieldCheck size={16}/> Admin only</span>
     <button className="primary" disabled={busy||!online}>{busy?'Creating…':'Create Staff'} <ChevronRight size={17}/></button></div>
   </form>
  </section>
  <section className="card">
   <div className="cardtitle"><div><b>All Users</b><small>{users.length} total • Deactivate to block sign-in without deleting</small></div></div>
   <div className="tablewrap"><table><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th></th></tr></thead>
    <tbody>{users.map(u=>{const self=u.id===me.id;return <tr key={u.id}>
     <td><b>{u.name}</b></td><td>{u.email}</td>
     <td><select value={u.role} disabled={self} onChange={e=>patch(u,{role:e.target.value})}>{ROLES.map(r=><option key={r} value={r}>{ROLE_LABEL[r]}</option>)}</select></td>
     <td><button className="link" disabled={self} onClick={()=>patch(u,{active:!u.active})}>{u.active?'Active · Deactivate':'Inactive · Activate'}</button></td>
     <td><button className="iconbtn dark" disabled={self} onClick={()=>remove(u)} title="Remove"><Trash2 size={16}/></button></td></tr>})}</tbody></table></div>
  </section>
 </>;
}
