'use client';
/**
 * FacilityH2O — One-Year Service Agreement generator (OWNER ONLY)
 * Fill the client fields, then Print → Save as PDF to send. Template only — have an attorney review.
 */
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

function getUser() {
  if (typeof document === 'undefined') return null;
  const raw = document.cookie.split(';').find(c => c.trim().startsWith('FacilityH2O_user='));
  if (!raw) return null;
  try { return JSON.parse(decodeURIComponent(raw.split('=')[1])); } catch { return null; }
}

export default function ContractPage() {
  const router = useRouter();
  const [ok, setOk] = useState(false);
  const [forbidden, setForbidden] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const [f, setF] = useState({
    client:'', clientAddress:'', signer:'', signerTitle:'',
    plan:'Professional', facilities:'', users:'',
    annualFee:'', startDate: today,
    paymentTerms:'Annual, due in advance', autoRenew:true,
  });

  useEffect(() => {
    const u = getUser();
    if (!u) { router.push('/login'); return; }
    if (u.id !== 'usr_ariley' && u.username !== 'ariley') { setForbidden(true); return; }
    setOk(true);
  }, [router]);

  const up = (k,v) => setF(p => ({ ...p, [k]: v }));
  const endDate = (() => { try { const d=new Date(f.startDate); d.setFullYear(d.getFullYear()+1); return d.toISOString().slice(0,10); } catch { return '____'; } })();
  const B = ({v}) => <span style={{borderBottom:'1px solid #475569',padding:'0 6px',fontWeight:600}}>{v && String(v).trim() ? v : '\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0'}</span>;

  if (forbidden) return <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'sans-serif'}}><div style={{textAlign:'center'}}><div style={{fontSize:40}}>■</div><b>Owner only</b><div style={{color:'#64748b',fontSize:14}}>The contract generator is restricted to the account owner.</div></div></div>;
  if (!ok) return <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',color:'#94a3b8'}}>Loading…</div>;

  return (
    <div style={{minHeight:'100vh',background:'#f1f5f9',fontFamily:'-apple-system,sans-serif'}}>
      {/* Controls — hidden when printing */}
      <div className="noprint" style={{background:'#003366',color:'#fff',padding:'16px 24px',position:'sticky',top:0,zIndex:10}}>
        <div style={{maxWidth:900,margin:'0 auto',display:'flex',flexWrap:'wrap',gap:12,alignItems:'flex-end'}}>
          <div style={{flex:1,minWidth:200}}>
            <div style={{fontWeight:800,fontSize:18,marginBottom:2}}>One-Year Service Agreement</div>
            <div style={{fontSize:12,color:'#bae6fd'}}>Fill in the client details, then Print → Save as PDF to send.</div>
          </div>
          <button onClick={() => window.print()} style={{background:'#0891b2',color:'#fff',border:'none',borderRadius:10,padding:'12px 22px',fontWeight:700,cursor:'pointer'}}>Print Print / Save PDF</button>
        </div>
        <div style={{maxWidth:900,margin:'14px auto 0',display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10}}>
          {[['client','Client legal name'],['clientAddress','Client address'],['signer','Client signer name'],['signerTitle','Signer title'],['facilities','# Facilities'],['users','# Users'],['annualFee','Annual fee (e.g. $12,000)'],['startDate','Start date']].map(([k,label]) => (
            <div key={k}>
              <label style={{display:'block',fontSize:11,color:'#bae6fd',marginBottom:3}}>{label}</label>
              <input type={k==='startDate'?'date':'text'} value={f[k]} onChange={e=>up(k,e.target.value)} style={{width:'100%',border:'none',borderRadius:7,padding:'8px 10px',fontSize:13}} />
            </div>
          ))}
          <div>
            <label style={{display:'block',fontSize:11,color:'#bae6fd',marginBottom:3}}>Plan</label>
            <select value={f.plan} onChange={e=>up('plan',e.target.value)} style={{width:'100%',border:'none',borderRadius:7,padding:'8px 10px',fontSize:13}}>
              <option>Starter</option><option>Professional</option><option>Enterprise</option>
            </select>
          </div>
          <div style={{display:'flex',alignItems:'flex-end'}}>
            <label style={{fontSize:12,color:'#fff',display:'flex',gap:6,alignItems:'center',cursor:'pointer'}}><input type="checkbox" checked={f.autoRenew} onChange={e=>up('autoRenew',e.target.checked)} /> Auto-renews yearly</label>
          </div>
        </div>
      </div>

      {/* The contract document */}
      <div style={{maxWidth:760,margin:'24px auto',background:'#fff',padding:'56px 64px',boxShadow:'0 10px 40px rgba(0,0,0,.1)',color:'#1e293b',fontSize:14,lineHeight:1.7}}>
        <div style={{textAlign:'center',borderBottom:'2px solid #003366',paddingBottom:16,marginBottom:24}}>
          <div style={{fontSize:22,fontWeight:800,color:'#003366'}}>[WATER] FacilityH2O</div>
          <div style={{fontSize:16,fontWeight:700,marginTop:10}}>SOFTWARE SERVICES AGREEMENT</div>
          <div style={{fontSize:12,color:'#64748b'}}>One-Year Term</div>
        </div>

        <p>This Software Services Agreement (the "Agreement") is entered into as of <B v={f.startDate}/> (the "Effective Date") by and between <b>FacilityH2O</b> ("Provider") and <B v={f.client}/> ("Client"), located at <B v={f.clientAddress}/>.</p>

        <h3 style={{fontSize:14,marginTop:22}}>1. Services</h3>
        <p>Provider grants Client a non-exclusive, non-transferable subscription to the FacilityH2O water-chemistry compliance platform (the "Service") at the <B v={f.plan}/> plan level, covering up to <B v={f.facilities}/> facilities and <B v={f.users}/> authorized users, for the Term defined below.</p>

        <h3 style={{fontSize:14,marginTop:22}}>2. Term</h3>
        <p>This Agreement begins on the Effective Date and continues for a period of <b>one (1) year</b>, ending <B v={endDate}/> (the "Term"). {f.autoRenew ? 'Upon expiration, this Agreement automatically renews for successive one-year terms unless either party provides written notice of non-renewal at least thirty (30) days before the end of the then-current Term.' : 'Renewal beyond the Term requires a new written agreement between the parties.'}</p>

        <h3 style={{fontSize:14,marginTop:22}}>3. Fees & Payment</h3>
        <p>Client shall pay Provider an annual subscription fee of <B v={f.annualFee}/>, billed annually in advance ({f.paymentTerms}). Fees are non-refundable except as required by law. Late payments may result in suspension of access to the Service until the balance is paid.</p>

        <h3 style={{fontSize:14,marginTop:22}}>4. Client Responsibilities</h3>
        <p>Client is responsible for the accuracy of all data entered into the Service, for maintaining the confidentiality of user credentials, and for ensuring its use complies with all applicable laws and regulations governing its facilities. The Service is a documentation and monitoring tool; it does not replace Client's professional judgment or its water treatment vendor's guidance.</p>

        <h3 style={{fontSize:14,marginTop:22}}>5. Data & Confidentiality</h3>
        <p>Client retains ownership of all data it enters. Provider will maintain commercially reasonable safeguards to protect Client data and will not disclose it except as required to deliver the Service or by law. Each party agrees to keep the other's confidential information in confidence.</p>

        <h3 style={{fontSize:14,marginTop:22}}>6. Warranty Disclaimer</h3>
        <p>The Service is provided "as is." Provider disclaims all warranties, express or implied, including merchantability and fitness for a particular purpose. Provider does not warrant that the Service will be uninterrupted or error-free.</p>

        <h3 style={{fontSize:14,marginTop:22}}>7. Limitation of Liability</h3>
        <p>To the maximum extent permitted by law, Provider's total liability under this Agreement shall not exceed the fees paid by Client in the twelve (12) months preceding the claim. Provider shall not be liable for indirect, incidental, or consequential damages.</p>

        <h3 style={{fontSize:14,marginTop:22}}>8. Termination</h3>
        <p>Either party may terminate this Agreement for material breach if the breach remains uncured thirty (30) days after written notice. Upon termination, Client's access ends and Client may request an export of its data within thirty (30) days.</p>

        <h3 style={{fontSize:14,marginTop:22}}>9. Governing Law</h3>
        <p>This Agreement shall be governed by the laws of the State of <B v={''}/>, without regard to its conflict-of-laws principles.</p>

        <h3 style={{fontSize:14,marginTop:22}}>10. Entire Agreement</h3>
        <p>This Agreement constitutes the entire understanding between the parties and supersedes all prior discussions. Any amendment must be in writing and signed by both parties.</p>

        <div style={{display:'flex',gap:40,marginTop:46}}>
          <div style={{flex:1}}>
            <div style={{borderTop:'1px solid #1e293b',paddingTop:6,fontSize:12}}><b>FacilityH2O</b> (Provider)</div>
            <div style={{marginTop:24,borderBottom:'1px solid #94a3b8',height:1}}></div>
            <div style={{fontSize:11,color:'#64748b',marginTop:4}}>Signature / Date</div>
            <div style={{marginTop:18,borderBottom:'1px solid #94a3b8',height:1}}></div>
            <div style={{fontSize:11,color:'#64748b',marginTop:4}}>Antoine W. Riley Sr., Authorized Representative</div>
          </div>
          <div style={{flex:1}}>
            <div style={{borderTop:'1px solid #1e293b',paddingTop:6,fontSize:12}}><b><span>{f.client||'Client'}</span></b> (Client)</div>
            <div style={{marginTop:24,borderBottom:'1px solid #94a3b8',height:1}}></div>
            <div style={{fontSize:11,color:'#64748b',marginTop:4}}>Signature / Date</div>
            <div style={{marginTop:18,borderBottom:'1px solid #94a3b8',height:1}}></div>
            <div style={{fontSize:11,color:'#64748b',marginTop:4}}>{f.signer||'Name'}{f.signerTitle?', '+f.signerTitle:', Title'}</div>
          </div>
        </div>

        <div style={{marginTop:34,paddingTop:12,borderTop:'1px solid #e2e8f0',fontSize:10,color:'#94a3b8',textAlign:'center'}}>
          This is a template service agreement generated by FacilityH2O. It is not legal advice. Have it reviewed by a licensed attorney before execution.
        </div>
      </div>

      <style>{`@media print { .noprint{display:none!important} body{background:#fff} div[style*="box-shadow"]{box-shadow:none!important;margin:0!important;max-width:100%!important} }`}</style>
    </div>
  );
}
