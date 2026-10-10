import React,{useCallback,useEffect,useState} from 'react';
import {LayoutDashboard,ClipboardList,PlusCircle,Users,ShieldCheck,BarChart3,Bell,LogOut,Menu,History,WifiOff,Lock} from 'lucide-react';
import {supabase,supabaseConfigured} from './supabase.js';
import {getQueue,setQueue,fmtDateTime,ROLE_LABEL} from './lib.js';
import {Empty} from './ui.jsx';
import Login from './Login.jsx';
import Dashboard from './Dashboard.jsx';
import Requests from './Requests.jsx';
import RequestDetail from './RequestDetail.jsx';
import NewRequest from './NewRequest.jsx';
import Workflow from './Workflow.jsx';
import Reports from './Reports.jsx';
import Audit from './Audit.jsx';
import Admin from './Admin.jsx';

const ALL=['staff','approver','admin'],REV=['approver','admin'];
const NAV=[
 {path:'/',label:'Dashboard',icon:LayoutDashboard,roles:ALL,sub:'Real-time overview of member loan requests and workflow.'},
 {path:'/requests',label:'Requests',icon:ClipboardList,roles:ALL,sub:'Search, review and track every loan request.'},
 {path:'/new',label:'New Request',icon:PlusCircle,roles:ALL,sub:'Submit a loan request on behalf of a member.'},
 {path:'/workflow',label:'Workflow',icon:ShieldCheck,roles:REV,sub:'Approval queue: review, approve, paper work and disbursal.'},
 {path:'/reports',label:'Reports',icon:BarChart3,roles:REV,sub:'Analytics and exports (CSV / PDF).'},
 {path:'/audit',label:'Audit Trail',icon:History,roles:REV,sub:'Every submission and decision, with who and when.'},
 {path:'/admin',label:'Staff',icon:Users,roles:['admin'],sub:'Add staff, change roles and manage access.'}
];

export default function App(){
 const [session,setSession]=useState(null),[profile,setProfile]=useState(null),[loading,setLoading]=useState(true);
 useEffect(()=>{
  if(!supabaseConfigured){setLoading(false);return}
  const load=async s=>{
   if(!s){setProfile(null);setLoading(false);return}
   const {data,error}=await supabase.from('users').select('*').eq('id',s.user.id).maybeSingle();
   if(error){
    const c=localStorage.getItem('prarambha:profile:'+s.user.id);
    setProfile(c?JSON.parse(c):{blocked:true,offline:true});
   }else if(data&&data.active){
    localStorage.setItem('prarambha:profile:'+s.user.id,JSON.stringify(data));setProfile(data);
   }else setProfile({blocked:true});
   setLoading(false);
  };
  supabase.auth.getSession().then(({data})=>{setSession(data.session);load(data.session)});
  const {data:{subscription}}=supabase.auth.onAuthStateChange((_e,s)=>{setSession(s);setTimeout(()=>load(s),0)});
  return()=>subscription.unsubscribe();
 },[]);
 if(loading)return <div className="center">Loading Prarambha…</div>;
 if(!session)return <Login/>;
 if(profile?.blocked)return <div className="loginpage"><div className="loginbox">
  <h1>{profile.offline?'Cannot connect':'Access not granted'}</h1>
  <p>{profile.offline?'Check your internet connection and try again.':'Your login exists but has no active staff profile. Ask an administrator to add or re-activate you.'}</p>
  <button className="primary full" onClick={()=>supabase.auth.signOut()}>Sign out</button></div></div>;
 if(!profile)return <div className="center">Loading Prarambha…</div>;
 return <Shell session={session} me={profile}/>;
}

function browserNotify(n){
 if(!('Notification' in window)||Notification.permission!=='granted')return;
 const o={body:n.body||'',icon:'/icon-192.png',tag:n.id};
 if(navigator.serviceWorker?.controller)navigator.serviceWorker.ready.then(r=>r.showNotification(n.title,o));
 else new Notification(n.title,o);
}

function Shell({session,me}){
 const uid=session.user.id,ck='prarambha:requests:'+uid;
 const [path,setPath]=useState(window.location.pathname==='/staff'?'/admin':window.location.pathname);
 const [requests,setRequests]=useState(()=>{try{return JSON.parse(localStorage.getItem(ck)||'[]')}catch{return[]}});
 const [notes,setNotes]=useState([]),[bellOpen,setBellOpen]=useState(false),[refreshing,setRefreshing]=useState(false);
 const [online,setOnline]=useState(navigator.onLine),[queued,setQueued]=useState(getQueue().filter(q=>q.uid===uid).length);
 const [toast,setToast]=useState(''),[openId,setOpenId]=useState(null),[side,setSide]=useState(true),[preset,setPreset]=useState(null),[newInit,setNewInit]=useState(null);

 const say=(m,ms=3500)=>{setToast(m);setTimeout(()=>setToast(''),ms)};
 const go=p=>{if(p!==window.location.pathname)window.history.pushState({},'',p);setPath(p);window.scrollTo(0,0)};
 const navTo=p=>{setPreset(null);setNewInit(null);go(p)};
 const goFilter=f=>{setPreset(f);go('/requests')};
 const goNew=i=>{setNewInit(i);go('/new')};
 useEffect(()=>{const f=()=>setPath(window.location.pathname==='/staff'?'/admin':window.location.pathname);window.addEventListener('popstate',f);return()=>window.removeEventListener('popstate',f)},[]);

 const loadRequests=useCallback(async()=>{
  if(!navigator.onLine)return;
  setRefreshing(true);
  const {data,error}=await supabase.from('loan_requests').select('*').order('created_at',{ascending:false});
  if(!error){setRequests(data||[]);localStorage.setItem(ck,JSON.stringify(data||[]))}
  setRefreshing(false);
 },[ck]);
 const loadNotes=useCallback(async()=>{
  if(!navigator.onLine)return;
  const {data}=await supabase.from('notifications').select('*').order('created_at',{ascending:false}).limit(30);
  setNotes(data||[]);
 },[]);
 const flushQueue=useCallback(async()=>{
  const q=getQueue(),mine=q.filter(x=>x.uid===uid);
  if(!mine.length||!navigator.onLine)return;
  const rest=q.filter(x=>x.uid!==uid);let sent=0,dropped=0;
  for(const item of mine){
   const {error}=await supabase.from('loan_requests').insert(item.payload);
   if(!error)sent++;else if(!error.code)rest.push(item);else dropped++;
  }
  setQueue(rest);setQueued(rest.filter(x=>x.uid===uid).length);
  if(sent){say(sent+' offline request'+(sent>1?'s':'')+' submitted');loadRequests()}
  if(dropped)say(dropped+' offline request(s) were rejected by the server');
 },[uid,loadRequests]);

 useEffect(()=>{loadRequests();loadNotes();flushQueue()},[loadRequests,loadNotes,flushQueue]);
 useEffect(()=>{
  const on=()=>{setOnline(true);loadRequests();loadNotes();flushQueue()},off=()=>setOnline(false);
  window.addEventListener('online',on);window.addEventListener('offline',off);
  return()=>{window.removeEventListener('online',on);window.removeEventListener('offline',off)};
 },[loadRequests,loadNotes,flushQueue]);
 useEffect(()=>{
  const ch=supabase.channel('portal-'+uid)
   .on('postgres_changes',{event:'*',schema:'public',table:'loan_requests'},()=>loadRequests())
   .on('postgres_changes',{event:'INSERT',schema:'public',table:'notifications',filter:'user_id=eq.'+uid},p=>{
     setNotes(n=>[p.new,...n]);say(p.new.title+(p.new.body?' — '+p.new.body:''),8000);browserNotify(p.new);
   }).subscribe();
  return()=>{supabase.removeChannel(ch)};
 },[uid,loadRequests]);

 const unread=notes.filter(n=>!n.read).length;
 async function markAllRead(){
  setNotes(notes.map(n=>({...n,read:true})));
  await supabase.from('notifications').update({read:true}).eq('user_id',uid).eq('read',false);
 }
 async function enableAlerts(){
  if(!('Notification' in window)){say('This browser does not support notifications');return}
  const p=await Notification.requestPermission();say(p==='granted'?'Alerts enabled':'Alerts blocked in browser settings');
 }
 async function logout(){await supabase.auth.signOut();window.history.pushState({},'','/')}

 const cur=NAV.find(n=>n.path===path)||NAV[0];
 const forbidden=!cur.roles.includes(me.role);
 const openReq=requests.find(r=>r.id===openId);
 const common={me,requests,onOpen:setOpenId};

 return <div className="app">
  <header className="top">
   <div className="brand"><div className="logo"><ClipboardList size={25}/></div><div><b>Prarambha</b><span>Staff Loan Request System</span></div></div>
   <div className="topright">
    {online?<span className="online"><i/> System Online</span>:<span className="online offline"><WifiOff size={14}/> Offline</span>}
    {me.role==='admin'&&<button className="headlink" onClick={()=>go('/admin')}><Users size={16}/> Manage Staff</button>}
    <div className="bellwrap">
     <button className="iconbtn" onClick={()=>setBellOpen(!bellOpen)} title="Notifications"><Bell size={19}/>{unread>0&&<em className="dot">{unread}</em>}</button>
     {bellOpen&&<div className="bellpanel">
      <div className="bellhead"><b>Notifications</b><button className="link" onClick={markAllRead}>Mark all read</button></div>
      {'Notification' in window&&Notification.permission==='default'&&<button className="link pad" onClick={enableAlerts}>Turn on browser alerts</button>}
      {notes.length===0&&<p className="muted pad">No notifications yet.</p>}
      {notes.map(n=><div key={n.id} className={'note '+(n.read?'':'unread')} onClick={()=>{setOpenId(n.request_id);setBellOpen(false)}}>
       <b>{n.title}</b><span>{n.body}</span><small>{fmtDateTime(n.created_at)}</small></div>)}
     </div>}
    </div>
    <div className="user"><div className="avatar">{me.name.slice(0,2).toUpperCase()}</div><div><b>{me.name}</b><small>{ROLE_LABEL[me.role]}</small></div></div>
    <button className="logout" onClick={logout} title="Sign out"><LogOut size={16}/></button>
   </div>
  </header>
  {(!online||queued>0)&&<div className="banner"><WifiOff size={15}/> {!online?'You are offline. Showing saved data; new requests will be sent when you reconnect.':''} {queued>0&&queued+' request(s) waiting to be sent.'}</div>}
  <div className="body">
   <aside className={side?'side':'side collapsed'}>
    <button className="menubtn" onClick={()=>setSide(!side)}><Menu size={20}/></button>
    {NAV.filter(n=>n.roles.includes(me.role)).map(n=>{const I=n.icon;return <button key={n.path} className={'nav '+(cur.path===n.path?'active':'')} onClick={()=>navTo(n.path)}><I size={19}/><span>{n.label}</span></button>})}
    <div className="sidebottom"><Lock size={17}/><span>Supabase RLS secured</span></div>
   </aside>
   <main className="main">
    <div className="pagehead"><div><div className="crumb">Staff Loan Portal › {cur.label}</div><h1>{cur.label}</h1><p>{cur.sub}</p></div>
     {cur.path==='/requests'&&<button className="primary" onClick={()=>navTo('/new')}><PlusCircle size={17}/> New Request</button>}</div>
    {forbidden?<Empty title="Access denied" text="You do not have permission to view this page."/>:<>
     {cur.path==='/'&&<Dashboard {...common} go={navTo} goFilter={goFilter} goNew={goNew}/>}
     {cur.path==='/requests'&&<Requests key={JSON.stringify(preset)} preset={preset} {...common} refresh={loadRequests} refreshing={refreshing}/>}
     {cur.path==='/new'&&<NewRequest init={newInit} me={me} uid={uid} online={online} say={say} go={go} reload={loadRequests} setQueued={setQueued}/>}
     {cur.path==='/workflow'&&<Workflow {...common}/>}
     {cur.path==='/reports'&&<Reports {...common}/>}
     {cur.path==='/audit'&&<Audit online={online}/>}
     {cur.path==='/admin'&&<Admin me={me} online={online} say={say}/>}
    </>}
   </main>
  </div>
  {openReq&&<RequestDetail r={openReq} me={me} online={online} onClose={()=>setOpenId(null)} onChanged={loadRequests}/>}
  {toast&&<div className="toast">{toast}</div>}
 </div>;
}import React,{useCallback,useEffect,useState} from 'react';
import {LayoutDashboard,ClipboardList,PlusCircle,Users,ShieldCheck,BarChart3,Bell,LogOut,Menu,History,WifiOff,Lock} from 'lucide-react';
import {supabase,supabaseConfigured} from './supabase.js';
import {getQueue,setQueue,fmtDateTime} from './lib.js';
import {Empty} from './ui.jsx';
import Login from './Login.jsx';
import Dashboard from './Dashboard.jsx';
import Requests from './Requests.jsx';
import RequestDetail from './RequestDetail.jsx';
import NewRequest from './NewRequest.jsx';
import Workflow from './Workflow.jsx';
import Reports from './Reports.jsx';
import Audit from './Audit.jsx';
import Admin from './Admin.jsx';

const ALL=['staff','approver','admin'],REV=['approver','admin'];
const NAV=[
 {path:'/',label:'Dashboard',icon:LayoutDashboard,roles:ALL,sub:'Real-time overview of member loan requests and workflow.'},
 {path:'/requests',label:'Requests',icon:ClipboardList,roles:ALL,sub:'Search, review and track every loan request.'},
 {path:'/new',label:'New Request',icon:PlusCircle,roles:ALL,sub:'Submit a loan request on behalf of a member.'},
 {path:'/workflow',label:'Workflow',icon:ShieldCheck,roles:REV,sub:'Approval queue: review, approve or reject requests.'},
 {path:'/reports',label:'Reports',icon:BarChart3,roles:REV,sub:'Analytics and exports (CSV / PDF).'},
 {path:'/audit',label:'Audit Trail',icon:History,roles:REV,sub:'Every submission and decision, with who and when.'},
 {path:'/admin',label:'Staff',icon:Users,roles:['admin'],sub:'Add staff, change roles and manage access.'}
];

export default function App(){
 const [session,setSession]=useState(null),[profile,setProfile]=useState(null),[loading,setLoading]=useState(true);
 useEffect(()=>{
  if(!supabaseConfigured){setLoading(false);return}
  const load=async s=>{
   if(!s){setProfile(null);setLoading(false);return}
   const {data,error}=await supabase.from('users').select('*').eq('id',s.user.id).maybeSingle();
   if(error){
    const c=localStorage.getItem('prarambha:profile:'+s.user.id);
    setProfile(c?JSON.parse(c):{blocked:true,offline:true});
   }else if(data&&data.active){
    localStorage.setItem('prarambha:profile:'+s.user.id,JSON.stringify(data));setProfile(data);
   }else setProfile({blocked:true});
   setLoading(false);
  };
  supabase.auth.getSession().then(({data})=>{setSession(data.session);load(data.session)});
  const {data:{subscription}}=supabase.auth.onAuthStateChange((_e,s)=>{setSession(s);setTimeout(()=>load(s),0)});
  return()=>subscription.unsubscribe();
 },[]);
 if(loading)return <div className="center">Loading Prarambha…</div>;
 if(!session)return <Login/>;
 if(profile?.blocked)return <div className="loginpage"><div className="loginbox">
  <h1>{profile.offline?'Cannot connect':'Access not granted'}</h1>
  <p>{profile.offline?'Check your internet connection and try again.':'Your login exists but has no active staff profile. Ask an administrator to add or re-activate you.'}</p>
  <button className="primary full" onClick={()=>supabase.auth.signOut()}>Sign out</button></div></div>;
 if(!profile)return <div className="center">Loading Prarambha…</div>;
 return <Shell session={session} me={profile}/>;
}

function browserNotify(n){
 if(!('Notification' in window)||Notification.permission!=='granted')return;
 const o={body:n.body||'',icon:'/icon-192.png',tag:n.id};
 if(navigator.serviceWorker?.controller)navigator.serviceWorker.ready.then(r=>r.showNotification(n.title,o));
 else new Notification(n.title,o);
}

function Shell({session,me}){
 const uid=session.user.id,ck='prarambha:requests:'+uid;
 const [path,setPath]=useState(window.location.pathname==='/staff'?'/admin':window.location.pathname);
 const [requests,setRequests]=useState(()=>{try{return JSON.parse(localStorage.getItem(ck)||'[]')}catch{return[]}});
 const [notes,setNotes]=useState([]),[bellOpen,setBellOpen]=useState(false),[refreshing,setRefreshing]=useState(false);
 const [online,setOnline]=useState(navigator.onLine),[queued,setQueued]=useState(getQueue().filter(q=>q.uid===uid).length);
 const [toast,setToast]=useState(''),[openId,setOpenId]=useState(null),[side,setSide]=useState(true),[preset,setPreset]=useState(null),[newInit,setNewInit]=useState(null);

 const say=m=>{setToast(m);setTimeout(()=>setToast(''),3500)};
 const go=p=>{if(p!==window.location.pathname)window.history.pushState({},'',p);setPath(p);window.scrollTo(0,0)};
 const navTo=p=>{setPreset(null);setNewInit(null);go(p)};
 const goFilter=f=>{setPreset(f);go('/requests')};
 const goNew=i=>{setNewInit(i);go('/new')};
 useEffect(()=>{const f=()=>setPath(window.location.pathname==='/staff'?'/admin':window.location.pathname);window.addEventListener('popstate',f);return()=>window.removeEventListener('popstate',f)},[]);

 const loadRequests=useCallback(async()=>{
  if(!navigator.onLine)return;
  setRefreshing(true);
  const {data,error}=await supabase.from('loan_requests').select('*').order('created_at',{ascending:false});
  if(!error){setRequests(data||[]);localStorage.setItem(ck,JSON.stringify(data||[]))}
  setRefreshing(false);
 },[ck]);
 const loadNotes=useCallback(async()=>{
  if(!navigator.onLine)return;
  const {data}=await supabase.from('notifications').select('*').order('created_at',{ascending:false}).limit(30);
  setNotes(data||[]);
 },[]);
 const flushQueue=useCallback(async()=>{
  const q=getQueue(),mine=q.filter(x=>x.uid===uid);
  if(!mine.length||!navigator.onLine)return;
  const rest=q.filter(x=>x.uid!==uid);let sent=0,dropped=0;
  for(const item of mine){
   const {error}=await supabase.from('loan_requests').insert(item.payload);
   if(!error)sent++;else if(!error.code)rest.push(item);else dropped++;
  }
  setQueue(rest);setQueued(rest.filter(x=>x.uid===uid).length);
  if(sent){say(sent+' offline request'+(sent>1?'s':'')+' submitted');loadRequests()}
  if(dropped)say(dropped+' offline request(s) were rejected by the server');
 },[uid,loadRequests]);

 useEffect(()=>{loadRequests();loadNotes();flushQueue()},[loadRequests,loadNotes,flushQueue]);
 useEffect(()=>{
  const on=()=>{setOnline(true);loadRequests();loadNotes();flushQueue()},off=()=>setOnline(false);
  window.addEventListener('online',on);window.addEventListener('offline',off);
  return()=>{window.removeEventListener('online',on);window.removeEventListener('offline',off)};
 },[loadRequests,loadNotes,flushQueue]);
 useEffect(()=>{
  const ch=supabase.channel('portal-'+uid)
   .on('postgres_changes',{event:'*',schema:'public',table:'loan_requests'},()=>loadRequests())
   .on('postgres_changes',{event:'INSERT',schema:'public',table:'notifications',filter:'user_id=eq.'+uid},p=>{
     setNotes(n=>[p.new,...n]);say(p.new.title);browserNotify(p.new);
   }).subscribe();
  return()=>{supabase.removeChannel(ch)};
 },[uid,loadRequests]);

 const unread=notes.filter(n=>!n.read).length;
 async function markAllRead(){
  setNotes(notes.map(n=>({...n,read:true})));
  await supabase.from('notifications').update({read:true}).eq('user_id',uid).eq('read',false);
 }
 async function enableAlerts(){
  if(!('Notification' in window)){say('This browser does not support notifications');return}
  const p=await Notification.requestPermission();say(p==='granted'?'Alerts enabled':'Alerts blocked in browser settings');
 }
 async function logout(){await supabase.auth.signOut();window.history.pushState({},'','/')}

 const cur=NAV.find(n=>n.path===path)||NAV[0];
 const forbidden=!cur.roles.includes(me.role);
 const openReq=requests.find(r=>r.id===openId);
 const common={me,requests,onOpen:setOpenId};

 return <div className="app">
  <header className="top">
   <div className="brand"><div className="logo"><ClipboardList size={25}/></div><div><b>Prarambha</b><span>Staff Loan Request System</span></div></div>
   <div className="topright">
    {online?<span className="online"><i/> System Online</span>:<span className="online offline"><WifiOff size={14}/> Offline</span>}
    {me.role==='admin'&&<button className="headlink" onClick={()=>go('/admin')}><Users size={16}/> Manage Staff</button>}
    <div className="bellwrap">
     <button className="iconbtn" onClick={()=>setBellOpen(!bellOpen)} title="Notifications"><Bell size={19}/>{unread>0&&<em className="dot">{unread}</em>}</button>
     {bellOpen&&<div className="bellpanel">
      <div className="bellhead"><b>Notifications</b><button className="link" onClick={markAllRead}>Mark all read</button></div>
      {'Notification' in window&&Notification.permission==='default'&&<button className="link pad" onClick={enableAlerts}>Turn on browser alerts</button>}
      {notes.length===0&&<p className="muted pad">No notifications yet.</p>}
      {notes.map(n=><div key={n.id} className={'note '+(n.read?'':'unread')} onClick={()=>{setOpenId(n.request_id);setBellOpen(false)}}>
       <b>{n.title}</b><span>{n.body}</span><small>{fmtDateTime(n.created_at)}</small></div>)}
     </div>}
    </div>
    <div className="user"><div className="avatar">{me.name.slice(0,2).toUpperCase()}</div><div><b>{me.name}</b><small>{me.role}</small></div></div>
    <button className="logout" onClick={logout} title="Sign out"><LogOut size={16}/></button>
   </div>
  </header>
  {(!online||queued>0)&&<div className="banner"><WifiOff size={15}/> {!online?'You are offline. Showing saved data; new requests will be sent when you reconnect.':''} {queued>0&&queued+' request(s) waiting to be sent.'}</div>}
  <div className="body">
   <aside className={side?'side':'side collapsed'}>
    <button className="menubtn" onClick={()=>setSide(!side)}><Menu size={20}/></button>
    {NAV.filter(n=>n.roles.includes(me.role)).map(n=>{const I=n.icon;return <button key={n.path} className={'nav '+(cur.path===n.path?'active':'')} onClick={()=>navTo(n.path)}><I size={19}/><span>{n.label}</span></button>})}
    <div className="sidebottom"><Lock size={17}/><span>Supabase RLS secured</span></div>
   </aside>
   <main className="main">
    <div className="pagehead"><div><div className="crumb">Staff Loan Portal › {cur.label}</div><h1>{cur.label}</h1><p>{cur.sub}</p></div>
     {cur.path==='/requests'&&<button className="primary" onClick={()=>navTo('/new')}><PlusCircle size={17}/> New Request</button>}</div>
    {forbidden?<Empty title="Access denied" text="You do not have permission to view this page."/>:<>
     {cur.path==='/'&&<Dashboard {...common} go={navTo} goFilter={goFilter} goNew={goNew}/>}
     {cur.path==='/requests'&&<Requests key={JSON.stringify(preset)} preset={preset} {...common} refresh={loadRequests} refreshing={refreshing}/>}
     {cur.path==='/new'&&<NewRequest init={newInit} me={me} uid={uid} online={online} say={say} go={go} reload={loadRequests} setQueued={setQueued}/>}
     {cur.path==='/workflow'&&<Workflow {...common}/>}
     {cur.path==='/reports'&&<Reports {...common}/>}
     {cur.path==='/audit'&&<Audit online={online}/>}
     {cur.path==='/admin'&&<Admin me={me} online={online} say={say}/>}
    </>}
   </main>
  </div>
  {openReq&&<RequestDetail r={openReq} me={me} online={online} onClose={()=>setOpenId(null)} onChanged={loadRequests}/>}
  {toast&&<div className="toast">{toast}</div>}
 </div>;
}
