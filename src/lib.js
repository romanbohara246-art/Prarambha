export const PRODUCTS=[
 {name:'Business',icon:'💼',desc:'SME & Enterprise Loans • Working Capital • Expansion',label:'Business name and type'},
 {name:'Hire Purchase',icon:'🚗',desc:'Vehicle & Equipment Financing • Asset Purchase',label:'Vehicle or equipment to purchase'},
 {name:'Personal',icon:'👤',desc:'Staff Personal Loan • Emergency • Lifestyle',label:'Reason category (medical, education, family...)'},
 {name:'Baideshik Rojgar',icon:'✈️',desc:'Foreign Employment Loan • Migration Support • Visa Costs',label:'Destination country and job'},
 {name:'Agriculture',icon:'🌾',desc:'Farming • Seeds & Equipment • Seasonal Loan',label:'Crop or activity and land area'}
];
export const SECURITY=[
 {name:'With Collateral',icon:'🔒',desc:'No Limit • Property / Gold / Asset • Lowest Interest'},
 {name:'Without Collateral',icon:'🛡️',desc:'Max 3 Lakh • Unsecured • Credit Based'},
 {name:'With Saving',icon:'🐷',desc:'Max 3 Lakh • Secured by Savings • Reduced Rate'}
];
export const FLOW=[
 ['Pending','Submitted • Awaiting Review'],
 ['Under Review','Document Verification • Risk Assessment'],
 ['Approved','Loan Sanctioned • Disbursal Ready'],
 ['Rejected with Reason','Not Eligible • Reason Logged • Notification Sent']
];
export const STATUSES=FLOW.map(f=>f[0]);
export const ROLES=['staff','approver','admin'];
export const UNSECURED_LIMIT=300000;

export const fmtRs=n=>'Rs. '+Number(n||0).toLocaleString('en-IN');
export const fmtDate=d=>new Date(d).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'});
export const fmtDateTime=d=>new Date(d).toLocaleString('en-GB',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});
export const statusClass=s=>'status '+String(s).toLowerCase().replace(/\s+/g,'-');

// Phase 2: validation rules for the loan form
export function validateRequest(f){
 const e={};
 if(!f.member_name.trim())e.member_name='Enter the member name';
 if(!f.member_id.trim())e.member_id='Enter the member ID';
 if(!/^9[678]\d{8}$/.test(f.member_phone.trim()))e.member_phone='Enter a valid 10-digit mobile number';
 if(f.member_address.trim().length<3)e.member_address='Enter the member address';
 if(f.member_citizenship_no.trim().length<5)e.member_citizenship_no='Enter the member citizenship number (KYC)';
 const amt=Number(f.amount);
 if(!amt||amt<1000)e.amount='Minimum amount is Rs. 1,000';
 else if(f.security_type!=='With Collateral'&&amt>UNSECURED_LIMIT)e.amount='Above Rs. 3,00,000 requires collateral';
 const t=Number(f.tenure_months);
 if(!Number.isInteger(t)||t<3||t>120)e.tenure_months='Tenure must be 3 to 120 months';
 if(!f.product_detail.trim())e.product_detail='This field is required';
 if(f.security_type==='With Collateral'&&f.collateral_details.trim().length<5)e.collateral_details='Describe the collateral (property, gold, asset)';
 if(f.security_type==='With Saving'&&!f.savings_account_no.trim())e.savings_account_no='Enter the savings account number';
 if(f.purpose.trim().length<10)e.purpose='Describe the purpose (at least 10 characters)';
 return e;
}

// Phase 5: offline queue for requests created without internet
const QK='prarambha:queue';
export const getQueue=()=>{try{return JSON.parse(localStorage.getItem(QK)||'[]')}catch{return[]}};
export const setQueue=q=>localStorage.setItem(QK,JSON.stringify(q));

// Phase 4: exports
const HEAD=['Request','Member','Member ID','Product','Security','Amount','Period (months)','Submitted by','Status','Stage','Date','Member address'];
const line=r=>[r.request_code,r.member_name,r.member_id,r.product,r.security_type,r.amount,r.tenure_months,r.staff_name,r.status,r.stage,fmtDate(r.created_at),r.member_address];
export function exportCsv(rows){
 const esc=v=>'"'+String(v??'').replace(/"/g,'""')+'"';
 const text=[HEAD.map(esc).join(',')].concat(rows.map(r=>line(r).map(esc).join(','))).join('\n');
 const a=document.createElement('a');
 a.href=URL.createObjectURL(new Blob([text],{type:'text/csv'}));
 a.download='loan-requests.csv';a.click();URL.revokeObjectURL(a.href);
}
export async function exportPdf(rows){
 const [{default:jsPDF},{default:autoTable}]=await Promise.all([import('jspdf'),import('jspdf-autotable')]);
 const doc=new jsPDF({orientation:'landscape'});
 doc.setFontSize(14);doc.text('Prarambha - Loan Requests Report',14,14);
 doc.setFontSize(9);doc.text('Generated '+new Date().toLocaleString('en-GB')+'  |  '+rows.length+' requests',14,20);
 autoTable(doc,{startY:25,head:[HEAD],body:rows.map(r=>line(r).map((v,i)=>i===5?fmtRs(v):v)),styles:{fontSize:8},headStyles:{fillColor:[11,114,133]}});
 doc.save('loan-requests.pdf');
}
