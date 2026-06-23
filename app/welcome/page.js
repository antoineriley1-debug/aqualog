'use client';
/**
 * FacilityH2O — Welcome / first-run experience.
 * A premium full-screen activation moment shown to a brand-new admin
 * right after signup (or first provisioned login). Greets them by name,
 * frames the value, and guides three real first steps. Skippable.
 */
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

function getUser() {
  if (typeof document === 'undefined') return null;
  const raw = document.cookie.split(';').find((c) => c.trim().startsWith('FacilityH2O_user='));
  if (!raw) return null;
  try { return JSON.parse(decodeURIComponent(raw.split('=')[1])); } catch { return null; }
}

const STEPS = [
  { id: 'equipment', n: '01', href: '/equipment', icon: '🛠️',
    title: 'Set up your equipment',
    desc: 'Tell FacilityH2O what you run — boilers, chillers, cooling towers, softeners. This is what we keep in range for you.' },
  { id: 'team', n: '02', href: '/users', icon: '👥',
    title: 'Add your team',
    desc: 'Invite the operators who log readings each shift. Everyone gets their own secure login.' },
  { id: 'reading', n: '03', href: '/entry', icon: '💧',
    title: 'Log your first reading',
    desc: 'Watch compliance tracking come alive the moment you save. Out-of-range values flag instantly.' },
];

const OUTCOMES = [
  ['⚡', 'Catch issues early', 'Out-of-range readings flag the second they are logged — not weeks later.'],
  ['🛡️', 'Always audit-ready', 'Every reading is timestamped and filed. The binder builds itself.'],
  ['📉', 'Spend less on repairs', 'Proactive water chemistry, for a fraction of what reactive failures cost.'],
];

export default function WelcomePage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [uid, setUid] = useState('');
  const [done, setDone] = useState({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const u = getUser();
    if (!u) { router.push('/login'); return; }
    setName((u.name || '').trim().split(' ')[0] || 'there');
    setUid(u.id || u.username || 'user');
    try {
      const saved = JSON.parse(localStorage.getItem('facilityh2o_onboarding_' + (u.id || u.username)) || '{}');
      setDone(saved && typeof saved === 'object' ? saved : {});
    } catch {}
    setReady(true);
  }, [router]);

  const go = (step) => {
    const next = { ...done, [step.id]: true };
    setDone(next);
    try { localStorage.setItem('facilityh2o_onboarding_' + uid, JSON.stringify(next)); } catch {}
    router.push(step.href);
  };

  const count = STEPS.filter((s) => done[s.id]).length;
  const pct = Math.round((count / STEPS.length) * 100);
  const allDone = count === STEPS.length;

  return (
    <div className="fh2o-welcome">
      <style>{`
        .fh2o-welcome{min-height:100vh;position:relative;overflow:hidden;
          background:radial-gradient(1200px 600px at 20% -10%, #0b4a73 0%, rgba(11,74,115,0) 60%),
                     radial-gradient(900px 500px at 100% 0%, #0a6e8c 0%, rgba(10,110,140,0) 55%),
                     linear-gradient(180deg, #002744 0%, #001b30 60%, #00131f 100%);
          color:#fff;font-feature-settings:"ss01";}
        .fh2o-glow{position:absolute;inset:0;pointer-events:none;
          background:radial-gradient(600px 300px at 50% 8%, rgba(56,189,248,.22), transparent 70%);
          animation:fh2oPulse 7s ease-in-out infinite;}
        @keyframes fh2oPulse{0%,100%{opacity:.55}50%{opacity:1}}
        .fh2o-rise{opacity:0;transform:translateY(14px);animation:fh2oRise .7s cubic-bezier(.2,.7,.2,1) forwards;}
        @keyframes fh2oRise{to{opacity:1;transform:none}}
        .fh2o-d1{animation-delay:.05s}.fh2o-d2{animation-delay:.15s}.fh2o-d3{animation-delay:.28s}.fh2o-d4{animation-delay:.42s}
        .fh2o-card{transition:transform .18s ease, border-color .18s ease, background .18s ease;}
        .fh2o-card:hover{transform:translateY(-3px);border-color:rgba(56,189,248,.55);background:rgba(255,255,255,.07);}
        @media (prefers-reduced-motion: reduce){
          .fh2o-glow,.fh2o-rise{animation:none}.fh2o-rise{opacity:1;transform:none}.fh2o-card:hover{transform:none}
        }
      `}</style>
      <div className="fh2o-glow" />

      <div className="relative max-w-3xl mx-auto px-6 py-14 md:py-20">
        {/* brand + skip */}
        <div className="fh2o-rise fh2o-d1 flex items-center justify-between mb-12">
          <div className="flex items-center gap-2 text-cyan-200/90 font-semibold tracking-wide">
            <span className="text-2xl">💧</span> FacilityH2O
          </div>
          <button onClick={() => router.push('/dashboard')}
            className="text-sm text-blue-200/70 hover:text-white transition">Skip for now →</button>
        </div>

        {/* hero */}
        <div className="fh2o-rise fh2o-d2">
          <div className="text-cyan-300/80 text-sm font-semibold uppercase tracking-[0.2em] mb-4">Welcome aboard</div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.05]">
            {name ? `Hi ${name},` : 'Hello,'}<br />
            your water just got <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-sky-400">a lot smarter.</span>
          </h1>
          <p className="mt-5 text-lg text-blue-100/80 max-w-xl leading-relaxed">
            FacilityH2O turns water chemistry from a stack of paper logs into a live compliance system — so problems surface early and audits take minutes, not days.
          </p>
        </div>

        {/* outcomes */}
        <div className="fh2o-rise fh2o-d3 grid sm:grid-cols-3 gap-3 mt-10">
          {OUTCOMES.map(([icon, h, d]) => (
            <div key={h} className="rounded-2xl border border-white/10 bg-white/[.04] p-4">
              <div className="text-xl mb-2">{icon}</div>
              <div className="font-semibold text-white">{h}</div>
              <div className="text-sm text-blue-100/65 mt-1 leading-snug">{d}</div>
            </div>
          ))}
        </div>

        {/* guided steps */}
        <div className="fh2o-rise fh2o-d4 mt-12">
          <div className="flex items-end justify-between mb-4">
            <h2 className="text-lg font-bold">Let’s get you set up</h2>
            <span className="text-sm text-blue-200/70">{count} of {STEPS.length} done</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden mb-6">
            <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-sky-400 transition-all duration-500" style={{ width: pct + '%' }} />
          </div>

          <div className="space-y-3">
            {STEPS.map((s) => {
              const finished = !!done[s.id];
              return (
                <button key={s.id} onClick={() => go(s)}
                  className={`fh2o-card w-full text-left rounded-2xl border p-5 flex items-start gap-4 ${finished ? 'border-cyan-400/40 bg-cyan-400/[.06]' : 'border-white/10 bg-white/[.04]'}`}>
                  <div className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-lg font-bold ${finished ? 'bg-cyan-400 text-[#002744]' : 'bg-white/10 text-cyan-200'}`}>
                    {finished ? '✓' : s.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold tracking-widest text-cyan-300/70">{s.n}</span>
                      <span className="font-semibold text-white">{s.title}</span>
                    </div>
                    <div className="text-sm text-blue-100/70 mt-1 leading-snug">{s.desc}</div>
                  </div>
                  <div className="flex-shrink-0 self-center text-blue-200/60 text-sm">{finished ? 'Revisit' : 'Start →'}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* finale */}
        <div className="fh2o-rise fh2o-d4 mt-10">
          {allDone && (
            <div className="rounded-2xl bg-gradient-to-r from-cyan-500/20 to-sky-500/20 border border-cyan-400/40 px-5 py-4 mb-4 text-cyan-100 font-medium">
              🎉 You’re all set. Everything from here lives in your dashboard.
            </div>
          )}
          <button onClick={() => router.push('/dashboard')}
            className="w-full sm:w-auto bg-white text-[#002744] font-bold px-8 py-4 rounded-2xl text-base hover:bg-cyan-50 transition shadow-lg shadow-cyan-500/10">
            Go to your dashboard →
          </button>
          <p className="text-sm text-blue-200/60 mt-4">You can come back to these steps anytime from Help.</p>
        </div>
      </div>
    </div>
  );
}
