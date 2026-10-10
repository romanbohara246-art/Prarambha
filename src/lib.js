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
 ['Under Review','Field Visit • Documents • Remarks'],
 ['Approved','Approved • Ready for Paper Work'],
 ['Ready for Disburse','Paper Work Complete • Ready for Disbursal'],
 ['Disbursed','Loan Disbursed'],
 ['Rejected with Reason','Not Eligible • Reason Logged • Notification Sent']
];
export const APPROVED_SET=['Approved','Ready for Disburse','Disbursed'];
export const STATUSES=FLOW.map(f=>f[0]);
export const ROLES=['staff','approver','admin'];
export const ROLE_LABEL={staff:'Staff',approver:'Loan Officer',admin:'Admin'};
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
 const share=Number(f.share_amount);
 if(f.share_amount===''||isNaN(share)||share<0)e.share_amount='Enter the share amount (0 if none)';
 const sav=Number(f.total_saving_amount);
 if(f.total_saving_amount===''||isNaN(sav)||sav<0)e.total_saving_amount='Enter the total saving amount (0 if none)';
 if(!f.account_open_date)e.account_open_date='Enter the account open date';
 else if(f.account_open_date>new Date().toISOString().slice(0,10))e.account_open_date='Date cannot be in the future';
 const hasG=[f.guarantor_name,f.guarantor_member_id,f.guarantor_phone,f.guarantor_relation].some(x=>x.trim());
 if(hasG){
  if(!f.guarantor_name.trim())e.guarantor_name='Enter the guarantor name';
  if(!/^9[678]\d{8}$/.test(f.guarantor_phone.trim()))e.guarantor_phone='Enter a valid 10-digit mobile number';
 }
 return e;
}

// Phase 5: offline queue for requests created without internet
const QK='prarambha:queue';
export const getQueue=()=>{try{return JSON.parse(localStorage.getItem(QK)||'[]')}catch{return[]}};
export const setQueue=q=>localStorage.setItem(QK,JSON.stringify(q));

// Phase 4: exports
const HEAD=['Request','Member','Member ID','Product','Security','Amount','Period (months)','Submitted by','Status','Stage','Date','Member address','Share amount','Total saving','Account open date','Guarantee','Guarantor','Guarantor phone'];
const line=r=>[r.request_code,r.member_name,r.member_id,r.product,r.security_type,r.amount,r.tenure_months,r.staff_name,r.status,r.stage,fmtDate(r.created_at),r.member_address,r.share_amount,r.total_saving_amount,r.account_open_date,r.guarantee_details,r.guarantor_name,r.guarantor_phone];
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
 autoTable(doc,{startY:25,head:[HEAD.slice(0,11)],body:rows.map(r=>line(r).slice(0,11).map((v,i)=>i===5?fmtRs(v):v)),styles:{fontSize:8},headStyles:{fillColor:[11,114,133]}});
 doc.save('loan-requests.pdf');
}
