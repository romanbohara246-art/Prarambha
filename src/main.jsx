import React,{useEffect,useMemo,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {createClient} from '@supabase/supabase-js';
import {LayoutDashboard,ClipboardList,PlusCircle,Users,ShieldCheck,BarChart3,Bell,Search,CheckCircle2,Clock3,XCircle,FileText,LogOut,Menu,ChevronRight,LockKeyhole,RefreshCw,UserPlus,Trash2,Download} from 'lucide-react';
import {supabase,supabaseConfigured} from './supabase';
import './styles.css';

const products=[
 {name:'Business',icon:'💼',desc:'SME & Enterprise Loans • Working Capital • Expansion'},
 {name:'Hire Purchase',icon:'🚗',desc:'Vehicle & Equipment Financing • Asset Purchase'},
 {name:'Personal',icon:'👤',desc:'Staff Personal Loan • Emergency • Lifestyle'},
 {name:'Baideshik Rojgar',icon:'✈️',desc:'Foreign Employment Loan • Migration Support • Visa Costs'},
 {name:'Agriculture',icon:'🌾',desc:'Farming • Seeds & Equipment • Seasonal Loan'}
];
const security=[['With Collateral','No Limit • Property / Gold / Asset • Lowest Interest','🔒'],['Without Collateral','Max 3 Lakh • Unsecured • Credit Based','🛡️'],['With Saving','Max 3 Lakh • Secured by Savings • Reduced Rate','🐷']];
const seed=[
 {id:'DEMO-1007',staff_name:'Sita Karki',product:'Personal',amount:250000,status:'Pending',created_at:'2026-10-07',stage:'Submitted'},
 {id:'DEMO-1006',staff_name:'Bikash Thapa',product:'Business',amount:750000,status:'Under Review',created_at:'2026-10-06',stage:'Risk Assessment'},
 {id:'DEMO-1005',staff_name:'Anil Joshi',product:'Hire Purchase',amount:420000,status:'Approved',created_at:'2026-10-05',stage:'Disbursal Ready'},
 {id:'DEMO-1004',staff_name:'Mina Gurung',product:'Personal',amount:150000,status:'Rejected with Reason',created_at:'2026-10-04',stage:'Notification Sent'}
];

// Second client used ONLY for creating staff logins, so the admin's own session is not replaced.
const signupClient=supabaseConfigured
 ?createClient(import.meta.env.VITE_SUPABASE_URL,import.meta.env.VITE_SUPABASE_ANON_KEY,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false,storageKey:'signup-temp'}})
 :null;

function App(){
 const [session,setSession]=useState(null),[profile,setProfile]=useState(null),[loading,setLoading]=useState(true);
 useEffect(()=>{ if(!supabaseConfigured){setLoading(false);return;} supabase.auth.getSession().then(({data})=>{setSession(data.session); if(data.session) loadProfile(data.session.user.id,data.session.user.email); else setLoading(false)}); const {data:{subscription}}=supabase.auth.onAuthStateChange((_e,s)=>{setSession(s); if(s) loadProfile(s.user.id,s.user.email); else {setProfile(null);setLoading(false)}}); return()=>subscription.unsubscribe(); },[]);
 async function loadProfile(id,email){
  const {data}=await supabase.from('users').select('*').eq('id',id).maybeSingle();
  setProfile(data?{...data,full_name:data.name}:{full_name:(email||'Staff').split('@')[0],role:'staff'});
  setLoading(false)
 }
 if(loading)return <div className="center">Loading Prarambha…</div>;
 if(!session)return <Login/>;
 return <Portal session={session} profile={profile} />;
}

function Login(){const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
 async function submit(e){e.preventDefault();setError('');if(!supabaseConfigured){setError('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel.');return;}setBusy(true);const {error}=await supabase.auth.signInWithPassword({email,password});if(error)setError(error.message);setBusy(false)}
 return <div className="loginpage"><div className="loginbox"><div className="brand loginbrand"><div className="logo"><ClipboardList size={25}/></div><div><b>Prarambha</b><span>Staff Loan Request System</span></div></div><h1>Staff Sign In</h1><p>Secure access for loan officers, reviewers and administrators.</p>{!supabaseConfigured&&<div className="warning">Supabase connection is not configured yet.</div>}{error&&<div className="error">{error}</div>}<form onSubmit={submit}><label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="staff@company.com" required/></label><label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required/></label><button className="primary full" disabled={busy}>{busy?'Signing in…':'Sign In'} <ChevronRight size={17}/></button></form><small className="muted">Authentication is handled by Supabase Auth.</small></div></div>}

function Portal({session,profile}){
 const isAdmin=profile?.role==='admin';
 const canReview=isAdmin||profile?.role==='loan_officer';
 const [selected,setSelected]=useState(null);
 const [page,setPage]=useState(window.location.pathname==='/admin'?'Manage Staff':'Dashboard'),[sidebar,setSidebar]=useState(true),[requests,setRequests]=useState([]),[query,setQuery]=useState(''),[status,setStatus]=useState('All statuses'),[refreshing,setRefreshing]=useState(false);
 // keep the browser URL in sync: Manage Staff = /admin
 useEffect(()=>{const path=page==='Manage Staff'?'/admin':'/';if(window.location.pathname!==path)window.history.pushState({},'',path)},[page]);
 async function loadRequests(){setRefreshing(true); if(supabaseConfigured){const {data,error}=await supabase.from('loan_requests').select('*').order('created_at',{ascending:false}); if(!error)setRequests(data||[])} setRefreshing(false)}
 useEffect(()=>{loadRequests()},[]);
 const rows=requests.length?requests:seed; const filtered=useMemo(()=>rows.filter(r=>(`${r.staff_name||r.staff||''} ${r.request_code||r.id||''} ${r.product||''} ${r.status||''}`).toLowerCase().includes(query.toLowerCase())&&(status==='All statuses'||r.status===status)),[rows,query,status]);
 async function addRequest(payload){const local={...payload,id:'LOCAL-'+Date.now(),status:'Pending',stage:'Submitted',created_at:new Date().toISOString()}; if(!supabaseConfigured){setRequests([local,...requests]);setPage('Requests');return;} const {data,error}=await supabase.from('loan_requests').insert(payload).select().single(); if(error) throw error; setRequests([data,...requests]);setPage('Requests')}
 async function updateStatus(r,status,stage,reason){
  const patch={status,stage,reject_reason:reason||null,reviewed_at:new Date().toISOString()};
  const {data,error}=await supabase.from('loan_requests').update(patch).eq('id',r.id).select().single();
  if(error)throw error;
  setRequests(requests.map(x=>x.id===r.id?data:x));
 }
 async function logout(){await supabase?.auth.signOut();window.history.pushState({},'','/')}
 const subtitle=page==='Dashboard'?'Real-time overview of staff loan requests and workflow.':page==='Requests'?'Search, review and track every loan request.':page==='New Request'?'Create a new staff loan request.':page==='Manage Staff'?'Create staff accounts and manage existing users.':'Roadmap module ready for implementation.';
 return <div className="app"><header className="top"><div className="brand"><div className="logo"><ClipboardList size={25}/></div><div><b>Prarambha</b><span>Staff Loan Request System</span></div></div><div className="topright"><span className="online"><i/> System Online</span>{isAdmin&&<button className="primary" onClick={()=>setPage('Manage Staff')}><Users size={16}/> Manage Staff</button>}<button className="iconbtn"><Bell size={19}/></button><div className="user"><div className="avatar">{(profile?.full_name||'LO').slice(0,2).toUpperCase()}</div><div><b>{profile?.full_name||session.user.email}</b><small>{profile?.role||'staff'}</small></div></div><button className="logout" onClick={logout}><LogOut size={16}/></button></div></header>
 <div className="body"><aside className={sidebar?'side':'side collapsed'}><button className="menubtn" onClick={()=>setSidebar(!sidebar)}><Menu size={20}/></button>{[['Dashboard',LayoutDashboard],['Requests',ClipboardList],['New Request',PlusCircle],['Staff',Users],['Workflow',ShieldCheck],['Reports',BarChart3]].map(([n,I])=><button key={n} className={'nav '+(page===n?'active':'')} onClick={()=>setPage(n)}><I size={19}/><span>{n}</span></button>)}<div className="sidebottom"><LockKeyhole size={17}/><span>Supabase RLS secured</span></div></aside>
 <main className="main"><div className="pagehead"><div><div className="crumb">Staff Loan Portal <ChevronRight size={14}/> {page}</div><h1>{page}</h1><p>{subtitle}</p></div>{page==='Requests'&&<button className="primary" onClick={()=>setPage('New Request')}><PlusCircle size={17}/> New Request</button>}</div>
 {page==='Dashboard'&&<Dashboard requests={rows} setPage={setPage} onOpen={setSelected}/>} {page==='Requests'&&<Requests rows={filtered} query={query} setQuery={setQuery} status={status} setStatus={setStatus} refresh={loadRequests} refreshing={refreshing} onOpen={setSelected}/>} {page==='New Request'&&<NewRequest onSubmit={addRequest}/>} {page==='Staff'&&<StaffList isAdmin={isAdmin} setPage={setPage}/>}{page==='Workflow'&&<Workflow rows={rows} onOpen={setSelected}/>}{page==='Reports'&&<Reports rows={rows}/>}
 {page==='Manage Staff'&&(isAdmin?<Admin currentUserId={session.user.id}/>:<section className="card empty"><h2>Access denied</h2><p>Only administrators can view this page.</p></section>)}</main>{selected&&<RequestDetail r={selected} canReview={canReview} onClose={()=>setSelected(null)} onUpdate={updateStatus}/>}</div></div>}

function Admin({currentUserId}){
 const [users,setUsers]=useState([]),[busy,setBusy]=useState(false),[error,setError]=useState(''),[ok,setOk]=useState('');
 async function loadUsers(){const {data,error}=await supabase.from('users').select('*').order('created_at',{ascending:false});if(error)setError(error.message);else setUsers(data||[])}
 useEffect(()=>{loadUsers()},[]);
 async function create(e){
  e.preventDefault();setError('');setOk('');setBusy(true);
  const form=e.currentTarget,f=new FormData(form);
  const name=String(f.get('name')).trim(),email=String(f.get('email')).trim(),password=String(f.get('password')),role=String(f.get('role'));
  try{
   const {data,error:authErr}=await signupClient.auth.signUp({email,password});
   if(authErr)throw authErr;
   if(!data.user)throw new Error('Auth user was not created.');
   // insert with the ADMIN session (main client) so the admin RLS policy applies
   const {error:insErr}=await supabase.from('users').insert({id:data.user.id,name,email,role});
   if(insErr)throw insErr;
   setOk('Staff "'+name+'" created.');form.reset();loadUsers();
  }catch(err){setError(err.message)}
  setBusy(false);
 }
 async function remove(u){
  if(u.id===currentUserId)return;
  if(!window.confirm('Delete '+u.name+' ('+u.email+')?'))return;
  const {error}=await supabase.from('users').delete().eq('id',u.id);
  if(error)setError(error.message);else setUsers(users.filter(x=>x.id!==u.id));
 }
 return <>
  <section className="card formcard">
   <div className="cardtitle"><div><b>Add New Staff</b><small>Creates a login and a user record</small></div><UserPlus size={23}/></div>
   {error&&<div className="error">{error}</div>}
   {ok&&<div className="badge">{ok}</div>}
   <form onSubmit={create}>
    <div className="formgrid">
     <label>Full Name<input name="name" required placeholder="e.g. Sita Karki"/></label>
     <label>Email<input name="email" type="email" required placeholder="staff@company.com"/></label>
     <label>Password<input name="password" type="password" minLength={6} required placeholder="Min 6 characters"/></label>
     <label>Role<select name="role" defaultValue="staff"><option value="staff">staff</option><option value="loan_officer">loan_officer</option><option value="admin">admin</option></select></label>
    </div>
    <div className="formfooter"><span><ShieldCheck size={16}/> Admin only</span><button className="primary" type="submit" disabled={busy}>{busy?'Creating…':'Create Staff'} <ChevronRight size={17}/></button></div>
   </form>
  </section>
  <section className="card" style={{marginTop:16}}>
   <div className="cardtitle"><div><b>All Users</b><small>{users.length} total</small></div></div>
   <div className="tablewrap"><table>
    <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Action</th></tr></thead>
    <tbody>{users.map(u=><tr key={u.id}><td><b>{u.name}</b></td><td>{u.email}</td><td>{u.role}</td><td><button className="iconbtn" disabled={u.id===currentUserId} onClick={()=>remove(u)} title="Delete"><Trash2 size={16}/></button></td></tr>)}</tbody>
   </table></div>
  </section>
 </>
}

function Dashboard({requests,setPage,onOpen}){const counts={Pending:requests.filter(x=>x.status==='Pending').length,'Under Review':requests.filter(x=>x.status==='Under Review').length,Approved:requests.filter(x=>x.status==='Approved').length,'Rejected with Reason':requests.filter(x=>x.status==='Rejected with Reason').length};return <><div className="stats"><Stat icon={<Clock3/>} label="Pending" value={counts.Pending} note="Awaiting review"/><Stat icon={<Search/>} label="Under Review" value={counts['Under Review']} note="Risk assessment"/><Stat icon={<CheckCircle2/>} label="Approved" value={counts.Approved} note="Ready for disbursal"/><Stat icon={<XCircle/>} label="Rejected" value={counts['Rejected with Reason']} note="Reason logged"/></div><section className="grid2"><div className="card"><div className="cardtitle"><div><b>5 Loan Products</b><small>Available request categories</small></div><button className="link" onClick={()=>setPage('New Request')}>Create <ChevronRight size={15}/></button></div><div className="productgrid">{products.map(p=><div className="product" key={p.name}><span>{p.icon}</span><div><b>{p.name}</b><small>{p.desc}</small></div></div>)}</div></div><div className="card"><div className="cardtitle"><div><b>3 Security Types</b><small>Policy controls</small></div><ShieldCheck size={22}/></div>{security.map(s=><div className="security" key={s[0]}><span>{s[2]}</span><div><b>{s[0]}</b><small>{s[1]}</small></div></div>)}</div></section><section className="card workflow"><div className="cardtitle"><div><b>4 Status Flow</b><small>From submission to decision</small></div><span className="badge">Live tracking</span></div><div className="flow">{[['Pending','Submitted'],['Under Review','Document Verification • Risk Assessment'],['Approved','Loan Sanctioned • Disbursal Ready'],['Rejected with Reason','Not Eligible • Reason Logged • Notification Sent']].map((x,i)=><div className="flowitem" key={x[0]}><div className={'flowicon f'+i}>{i===0?<Clock3/>:i===1?<Search/>:i===2?<CheckCircle2/>:<XCircle/>}</div><div><b>{x[0]}</b><small>{x[1]}</small></div>{i<3&&<div className="line"/>}</div>)}</div></section><section className="card"><div className="cardtitle"><div><b>Recent Requests</b><small>Audit-friendly request activity</small></div><button className="link" onClick={()=>setPage('Requests')}>View all <ChevronRight size={15}/></button></div><Table rows={requests.slice(0,4)} onOpen={onOpen}/></section></>}
function Stat({icon,label,value,note}){return <div className="stat"><div className="staticon">{icon}</div><div><span>{label}</span><strong>{value}</strong><small>{note}</small></div></div>}
function Requests({rows,query,setQuery,status,setStatus,refresh,refreshing,onOpen}){return <section className="card"><div className="toolbar"><div className="search"><Search size={18}/><input placeholder="Search ID, staff, product or status..." value={query} onChange={e=>setQuery(e.target.value)}/></div><select value={status} onChange={e=>setStatus(e.target.value)}><option>All statuses</option><option>Pending</option><option>Under Review</option><option>Approved</option><option>Rejected with Reason</option></select><button className="iconbtn" onClick={refresh} title="Refresh"><RefreshCw size={17} className={refreshing?'spin':''}/></button></div><Table rows={rows} onOpen={onOpen}/></section>}
function Table({rows,onOpen}){return <div className="tablewrap"><table><thead><tr><th>Request</th><th>Staff</th><th>Product</th><th>Amount</th><th>Status</th><th>Stage</th></tr></thead><tbody>{rows.map(r=><tr key={r.id} onClick={()=>onOpen&&onOpen(r)} style={{cursor:onOpen?'pointer':'default'}}><td><b>{r.request_code||r.id}</b><small>{new Date(r.created_at).toLocaleDateString()}</small></td><td>{r.staff_name||r.staff}</td><td>{r.product}</td><td>Rs. {Number(r.amount).toLocaleString()}</td><td><span className={'status '+String(r.status).toLowerCase().replaceAll(' ','-')}>{r.status}</span></td><td>{r.stage}</td></tr>)}</tbody></table></div>}
function NewRequest({onSubmit}){const [busy,setBusy]=useState(false),[error,setError]=useState('');async function submit(e){e.preventDefault();setError('');setBusy(true);const form=e.currentTarget;const f=new FormData(form);try{await onSubmit({staff_name:f.get('staff'),product:f.get('product'),amount:Number(f.get('amount')),security_type:f.get('security_type'),purpose:f.get('purpose')});form.reset()}catch(err){setError(err.message)}setBusy(false)}return <section className="card formcard"><div className="cardtitle"><div><b>New Staff Loan Request</b><small>Phase 2 • Dynamic application form</small></div><FileText size={23}/></div>{error&&<div className="error">{error}</div>}<form onSubmit={submit}><div className="formgrid"><label>Staff name<input name="staff" required placeholder="e.g. Sita Karki"/></label><label>Loan product<select name="product">{products.map(p=><option key={p.name}>{p.name}</option>)}</select></label><label>Requested amount<input name="amount" type="number" min="1000" required placeholder="250000"/></label><label>Security type<select name="security_type"><option>Without Collateral</option><option>With Collateral</option><option>With Saving</option></select></label><label className="wide">Purpose<textarea name="purpose" required placeholder="Explain the purpose of the loan..."/></label></div><div className="formfooter"><span><ShieldCheck size={16}/> Supabase validation + RLS protection</span><button className="primary" type="submit" disabled={busy}>{busy?'Submitting…':'Submit Request'} <ChevronRight size={17}/></button></div></form></section>}
function Placeholder({page}){return <section className="empty card"><div className="emptyicon">{page==='Staff'?<Users/>:page==='Workflow'?<ShieldCheck/>:<BarChart3/>}</div><h2>{page} module</h2><p>This module is the next implementation area: role-based access, approval rules, audit history, notifications, exports and analytics.</p><div className="road"><span>Phase 1 ✓</span><span>Phase 2 ✓</span><span>Phase 3 →</span><span>Phase 4 →</span><span>Phase 5 →</span></div></section>}
const flowStatuses=['Pending','Under Review','Approved','Rejected with Reason'];

function RequestDetail({r,canReview,onClose,onUpdate}){
 const [reason,setReason]=useState(''),[rejecting,setRejecting]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const sample=String(r.id).startsWith('DEMO')||String(r.id).startsWith('LOCAL');
 async function act(status,stage,why){setBusy(true);setError('');try{await onUpdate(r,status,stage,why);onClose()}catch(e){setError(e.message)}setBusy(false)}
 const fields=[['Staff',r.staff_name||r.staff],['Product',r.product],['Amount','Rs. '+Number(r.amount).toLocaleString()],['Security',r.security_type||'-'],['Purpose',r.purpose||'-'],['Stage',r.stage],['Submitted',new Date(r.created_at).toLocaleString()]];
 if(r.reject_reason)fields.push(['Reject reason',r.reject_reason]);
 return <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(10,30,40,.55)',display:'flex',alignItems:'center',justifyContent:'center',padding:16,zIndex:50}}>
  <div className="card" onClick={e=>e.stopPropagation()} style={{width:'100%',maxWidth:520,maxHeight:'90vh',overflow:'auto',background:'#fff'}}>
   <div className="cardtitle"><div><b>{r.request_code||r.id}</b><small>Request details</small></div><span className={'status '+String(r.status).toLowerCase().replaceAll(' ','-')}>{r.status}</span></div>
   {fields.map(([k,v])=><div key={k} style={{display:'flex',gap:12,padding:'8px 0',borderBottom:'1px solid #e3eef0'}}><small style={{width:110,flexShrink:0}}>{k}</small><span>{v}</span></div>)}
   {error&&<div className="error" style={{marginTop:12}}>{error}</div>}
   {sample&&<div className="warning" style={{marginTop:12}}>This is a demo row. Submit a real request to use the workflow actions.</div>}
   {canReview&&!sample&&r.status==='Pending'&&<div style={{marginTop:16}}><button className="primary" disabled={busy} onClick={()=>act('Under Review','Document Verification')}>Start review</button></div>}
   {canReview&&!sample&&r.status==='Under Review'&&!rejecting&&<div style={{marginTop:16,display:'flex',gap:10}}>
    <button className="primary" disabled={busy} onClick={()=>act('Approved','Disbursal Ready')}>Approve</button>
    <button className="primary" disabled={busy} style={{background:'#b42318'}} onClick={()=>setRejecting(true)}>Reject</button></div>}
   {rejecting&&<div style={{marginTop:16}}>
    <label>Reason for rejection<textarea value={reason} onChange={e=>setReason(e.target.value)} placeholder="e.g. Not eligible, incomplete documents..."/></label>
    <div style={{display:'flex',gap:10,marginTop:10}}>
     <button className="primary" disabled={busy||!reason.trim()} style={{background:'#b42318'}} onClick={()=>act('Rejected with Reason','Notification Sent',reason.trim())}>Confirm reject</button>
     <button className="link" onClick={()=>setRejecting(false)}>Cancel</button></div></div>}
   <div style={{marginTop:16}}><button className="link" onClick={onClose}>Close</button></div>
  </div></div>
}

function Workflow({rows,onOpen}){
 return <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(230px,1fr))',gap:16}}>
  {flowStatuses.map(st=>{const list=rows.filter(r=>r.status===st);return <div className="card" key={st}>
   <div className="cardtitle"><div><b>{st}</b><small>{list.length} request{list.length===1?'':'s'}</small></div></div>
   {list.length===0&&<small>No requests here.</small>}
   {list.map(r=><div key={r.id} className="product" style={{cursor:'pointer',marginBottom:8}} onClick={()=>onOpen(r)}><div><b>{r.staff_name||r.staff}</b><small>{r.product} • Rs. {Number(r.amount).toLocaleString()}</small></div></div>)}
  </div>})}
 </div>
}

function exportCsv(rows){
 const head=['Request','Staff','Product','Amount','Security','Status','Stage','Created'];
 const esc=v=>'"'+String(v??'').replace(/"/g,'""')+'"';
 const lines=[head.map(esc).join(',')].concat(rows.map(r=>[r.request_code||r.id,r.staff_name||r.staff,r.product,r.amount,r.security_type,r.status,r.stage,r.created_at].map(esc).join(',')));
 const blob=new Blob([lines.join('\n')],{type:'text/csv'});
 const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='loan-requests.csv';a.click();URL.revokeObjectURL(a.href);
}

function Reports({rows}){
 const total=rows.reduce((t,r)=>t+Number(r.amount||0),0);
 const byProduct=products.map(p=>{const l=rows.filter(r=>r.product===p.name);return {name:p.name,count:l.length,sum:l.reduce((t,r)=>t+Number(r.amount||0),0)}});
 return <>
  <div className="stats">
   <Stat icon={<FileText/>} label="Total requests" value={rows.length} note="All statuses"/>
   <Stat icon={<BarChart3/>} label="Total amount" value={'Rs. '+total.toLocaleString()} note="Requested"/>
   <Stat icon={<CheckCircle2/>} label="Approved" value={rows.filter(r=>r.status==='Approved').length} note="Ready for disbursal"/>
   <Stat icon={<XCircle/>} label="Rejected" value={rows.filter(r=>r.status==='Rejected with Reason').length} note="Reason logged"/>
  </div>
  <section className="card" style={{marginTop:16}}>
   <div className="cardtitle"><div><b>By loan product</b><small>Count and requested amount</small></div><button className="primary" onClick={()=>exportCsv(rows)}><Download size={16}/> Export CSV</button></div>
   <div className="tablewrap"><table><thead><tr><th>Product</th><th>Requests</th><th>Total amount</th></tr></thead>
   <tbody>{byProduct.map(p=><tr key={p.name}><td><b>{p.name}</b></td><td>{p.count}</td><td>Rs. {p.sum.toLocaleString()}</td></tr>)}</tbody></table></div>
  </section>
 </>
}

function StaffList({isAdmin,setPage}){
 const [users,setUsers]=useState([]),[error,setError]=useState('');
 useEffect(()=>{supabase.from('users').select('*').order('name').then(({data,error})=>{if(error)setError(error.message);else setUsers(data||[])})},[]);
 return <section className="card">
  <div className="cardtitle"><div><b>Staff directory</b><small>{users.length} user{users.length===1?'':'s'}</small></div>{isAdmin&&<button className="primary" onClick={()=>setPage('Manage Staff')}><UserPlus size={16}/> Manage Staff</button>}</div>
  {error&&<div className="error">{error}</div>}
  <div className="tablewrap"><table><thead><tr><th>Name</th><th>Email</th><th>Role</th></tr></thead>
  <tbody>{users.map(u=><tr key={u.id}><td><b>{u.name}</b></td><td>{u.email}</td><td>{u.role}</td></tr>)}</tbody></table></div>
 </section>
}

createRoot(document.getElementById('root')).render(<App/>);
