'use client';
/**
 * FacilityH2O — Notification Rules (Admin Overview + Config)
 * Author & Owner: Antoine Riley
 * © 2026 Antoine Riley / FacilityH2O. All rights reserved.
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { HOSPITALS } from '@/lib/hospitals';

function getUser() {
  if (typeof document === 'undefined') return null;
  const raw = document.cookie.split(';').find((c) => c.trim().startsWith('facilityh2o_user='));
  if (!raw) return null;
  try { return JSON.parse(decodeURIComponent(raw.split('=')[1])); } catch { return null; }
}

const TRIGGER_LABELS = {
  immediate:    'Immediately',
  trending:     'After trending days',
  missed_shift: 'On missed shift',
  critical:     'Critical only',
};

const CHANNEL_ICONS = { email: '✉️', phone: '📞', sms: '📱' };

const DEFAULT_THRESHOLDS = { trending_days: 3, missed_shifts: 1, out_of_range_count: 2, legionella_cfu_alert: 1 };
const DEFAULT_LEVELS = [
  { id:'level_1', name:'Level 1', trigger:'immediate',    triggerDays:null, channels:['email'],              contacts:[] },
  { id:'level_2', name:'Level 2', trigger:'trending',     triggerDays:3,    channels:['email','phone'],       contacts:[] },
  { id:'level_3', name:'Level 3', trigger:'critical',     triggerDays:null, channels:['email','phone','sms'], contacts:[] },
];

export default function NotificationsPage() {
  const router  = useRouter();
  const [user, setUser]         = useState(null);
  const [isOwner, setIsOwner]   = useState(false);
  const [rules, setRules]       = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // overview | global | hospital:<id>
  const [saving, setSaving]     = useState(false);
  const [msg, setMsg]           = useState(null);

  // Edit state for the currently selected config
  const [editThresholds, setEditThresholds] = useState({});
  const [editLevels, setEditLevels]         = useState([]);
  const [editContacts, setEditContacts]     = useState([]);
  const [newContact, setNewContact]         = useState({ name:'', title:'', email:'', phone:'', sms:'', hospital:'' });
  const [addingContact, setAddingContact]   = useState(null);

  useEffect(() => {
    const u = getUser();
    if (!u || u.role !== 'admin') { router.push('/dashboard'); return; }
    setUser(u);
    setIsOwner(u.id === 'usr_ariley');
    loadRules();
  }, []);

  const loadRules = () => {
    fetch('/api/notifications').then(r => r.json()).then(d => {
      setRules(d.rules || { global: { thresholds: DEFAULT_THRESHOLDS, levels: DEFAULT_LEVELS }, hospitals: {} });
    });
  };

  // When tab changes, populate edit state
  useEffect(() => {
    if (!rules) return;
    if (activeTab === 'global') {
      setEditThresholds(rules.global?.thresholds || DEFAULT_THRESHOLDS);
      setEditLevels(rules.global?.levels || DEFAULT_LEVELS);
      setEditContacts(rules.global?.contacts || []);
    } else if (activeTab.startsWith('hospital:')) {
      const hid = activeTab.split(':')[1];
      const h   = rules.hospitals?.[hid] || {};
      setEditThresholds(h.thresholds || rules.global?.thresholds || DEFAULT_THRESHOLDS);
      setEditLevels(h.levels || rules.global?.levels || DEFAULT_LEVELS);
      setEditContacts(h.contacts || []);
    }
  }, [activeTab, rules]);

  const save = async () => {
    setSaving(true); setMsg(null);
    const isHospital = activeTab.startsWith('hospital:');
    const hospitalId = isHospital ? activeTab.split(':')[1] : null;
    const res = await fetch('/api/notifications', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hospitalId, thresholds: editThresholds, levels: editLevels, contacts: editContacts }),
    });
    const data = await res.json();
    setSaving(false);
    if (data.ok) { setMsg({ type:'success', text:'Rules saved.' }); loadRules(); }
    else setMsg({ type:'error', text: data.error });
  };

  const updateLevel = (lid, patch) => {
    setEditLevels(prev => prev.map(l => l.id === lid ? { ...l, ...patch } : l));
  };

  const toggleChannel = (lid, ch) => {
    const level = editLevels.find(l => l.id === lid);
    const has   = level.channels.includes(ch);
    updateLevel(lid, { channels: has ? level.channels.filter(c => c !== ch) : [...level.channels, ch] });
  };

  const addContact = (lid) => {
    if (!newContact.name) return;
    const level = editLevels.find(l => l.id === lid);
    updateLevel(lid, { contacts: [...(level.contacts || []), { ...newContact, id: Date.now().toString() }] });
    setNewContact({ name:'', title:'', email:'', phone:'', sms:'', hospital:'' });
    setAddingContact(null);
  };

  const removeContact = (lid, cid) => {
    const level = editLevels.find(l => l.id === lid);
    updateLevel(lid, { contacts: level.contacts.filter(c => c.id !== cid) });
  };

  if (!rules) return (
    <div className="flex min-h-screen bg-gray-50"><Sidebar />
      <main className="flex-1 flex items-center justify-center text-gray-400">Loading...</main>
    </div>
  );

  const global     = rules.global || { thresholds: DEFAULT_THRESHOLDS, levels: DEFAULT_LEVELS };
  const hospitals  = rules.hospitals || {};

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 w-full min-w-0 p-4 md:p-8 pt-16 md:pt-8">

        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Alert &amp; Notification Rules</h1>
            <p className="text-gray-500 text-sm mt-1">
              {isOwner ? 'Configure who gets alerted and when — globally or per hospital.' : 'View alert rules. Contact ariley to make changes.'}
            </p>
          </div>
          {isOwner && activeTab !== 'overview' && (
            <button onClick={save} disabled={saving}
              className="bg-[#0072CE] text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#005fa3] transition disabled:opacity-50">
              {saving ? 'Saving...' : '💾 Save Rules'}
            </button>
          )}
        </div>

        {msg && (
          <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium ${msg.type==='success' ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-700'}`}>
            {msg.text}
          </div>
        )}

        {/* Tab bar */}
        <div className="flex flex-wrap gap-1 mb-6 border-b border-gray-200 pb-1">
          <TabBtn active={activeTab==='overview'}  onClick={() => setActiveTab('overview')}>📊 Overview</TabBtn>
          <TabBtn active={activeTab==='global'}    onClick={() => setActiveTab('global')}>🌐 Global Defaults</TabBtn>
          <div className="w-px bg-gray-200 mx-1" />
          {HOSPITALS.map(h => (
            <TabBtn key={h.id} active={activeTab===`hospital:${h.id}`} onClick={() => setActiveTab(`hospital:${h.id}`)}>
              {h.code}
              {hospitals[h.id] ? <span className="ml-1 w-1.5 h-1.5 rounded-full bg-[#0072CE] inline-block" title="Has custom rules" /> : null}
            </TabBtn>
          ))}
        </div>

        {/* ── OVERVIEW TAB ──────────────────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500 mb-2">Global defaults apply to all hospitals unless overridden. Blue dot = hospital has custom rules.</p>

            {/* Global summary row */}
            <SummaryCard
              label="🌐 Global Defaults"
              thresholds={global.thresholds || DEFAULT_THRESHOLDS}
              levels={global.levels || DEFAULT_LEVELS}
              onEdit={() => setActiveTab('global')}
              isOwner={isOwner}
              custom={false}
            />

            {/* One row per hospital */}
            {HOSPITALS.map(h => {
              const hRules = hospitals[h.id];
              const t = hRules?.thresholds ? { ...(global.thresholds || DEFAULT_THRESHOLDS), ...hRules.thresholds } : (global.thresholds || DEFAULT_THRESHOLDS);
              const l = hRules?.levels || global.levels || DEFAULT_LEVELS;
              return (
                <SummaryCard
                  key={h.id}
                  label={`🏥 ${h.name}`}
                  subLabel={h.code}
                  thresholds={t}
                  levels={l}
                  contacts={hRules?.contacts || []}
                  onEdit={() => setActiveTab(`hospital:${h.id}`)}
                  isOwner={isOwner}
                  custom={!!hRules}
                />
              );
            })}
          </div>
        )}

        {/* ── CONFIG TABS (global or hospital) ─────────────────────────────── */}
        {activeTab !== 'overview' && (
          <div className="space-y-6">
            {activeTab.startsWith('hospital:') && (
              <div className="bg-blue-50 border border-[#0072CE]/20 rounded-xl px-5 py-3 text-sm text-[#003366] flex items-center justify-between">
                <span>
                  <strong>{HOSPITALS.find(h => h.id === activeTab.split(':')[1])?.name}</strong>
                  {' '}— custom rules override global defaults for this hospital only.
                </span>
                {isOwner && !hospitals[activeTab.split(':')[1]] && (
                  <span className="text-xs text-gray-400 italic">Currently using global defaults</span>
                )}
              </div>
            )}

            {/* Thresholds */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="font-bold text-gray-800 mb-4">📏 Alert Thresholds</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key:'trending_days',        label:'Trending days before escalation',        unit:'days',     min:1, max:14, hint:'Consecutive days going wrong direction' },
                  { key:'missed_shifts',         label:'Missed shifts before alert',             unit:'shifts',   min:1, max:7,  hint:'How many missed before notifying' },
                  { key:'out_of_range_count',    label:'Out-of-range readings before alert',     unit:'readings', min:1, max:10, hint:'Consecutive OOR readings' },
                  { key:'legionella_cfu_alert',  label:'Legionella CFU/mL trigger',             unit:'CFU/mL',   min:1, max:100,hint:'Any result ≥ this triggers Level 3' },
                ].map(({ key, label, unit, min, max, hint }) => (
                  <div key={key} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="text-sm font-semibold text-gray-800">{label}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{hint}</div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <input type="number" min={min} max={max}
                          value={editThresholds[key] ?? DEFAULT_THRESHOLDS[key]}
                          onChange={e => setEditThresholds(p => ({ ...p, [key]: parseInt(e.target.value)||min }))}
                          disabled={!isOwner}
                          className="w-16 border border-gray-300 rounded-lg px-2 py-1.5 text-center text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#0072CE] disabled:bg-white disabled:cursor-default"
                        />
                        <span className="text-xs text-gray-500">{unit}</span>
                      </div>
                    </div>
                    {isOwner && <input type="range" min={min} max={max}
                      value={editThresholds[key] ?? DEFAULT_THRESHOLDS[key]}
                      onChange={e => setEditThresholds(p => ({ ...p, [key]: parseInt(e.target.value) }))}
                      className="w-full mt-2 accent-[#0072CE]" />}
                  </div>
                ))}
              </div>
            </div>

            {/* Escalation levels */}
            {editLevels.map((level, li) => (
              <div key={level.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className={`px-6 py-3 border-b border-gray-100 flex items-center gap-3 ${li===0?'bg-yellow-50':li===1?'bg-orange-50':'bg-red-50'}`}>
                  <span className={`w-7 h-7 rounded-full text-white text-xs font-bold flex items-center justify-center ${li===0?'bg-yellow-500':li===1?'bg-orange-500':'bg-red-600'}`}>
                    {li+1}
                  </span>
                  <div>
                    <div className="font-bold text-gray-800 text-sm">{level.name}</div>
                    <div className="text-xs text-gray-500">{level.description || ''}</div>
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  {/* Trigger */}
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-2">When to Trigger</label>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(TRIGGER_LABELS).map(([k, lbl]) => (
                        <button key={k} type="button" disabled={!isOwner}
                          onClick={() => updateLevel(level.id, { trigger: k })}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${level.trigger===k?'border-[#0072CE] bg-blue-50 text-[#0072CE]':'border-gray-200 text-gray-600'} disabled:cursor-default`}>
                          {lbl}
                        </button>
                      ))}
                    </div>
                    {level.trigger === 'trending' && (
                      <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                        <span>After</span>
                        <input type="number" min={1} max={14} value={level.triggerDays || 3}
                          onChange={e => updateLevel(level.id, { triggerDays: parseInt(e.target.value)||1 })}
                          disabled={!isOwner}
                          className="w-14 border border-gray-300 rounded px-2 py-1 text-sm text-center font-mono focus:outline-none focus:ring-2 focus:ring-[#0072CE] disabled:bg-gray-50" />
                        <span>consecutive days</span>
                      </div>
                    )}
                  </div>

                  {/* Channels */}
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-2">How to Notify</label>
                    <div className="flex gap-3">
                      {['email','phone','sms'].map(ch => (
                        <label key={ch} className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-sm ${level.channels.includes(ch)?'border-[#0072CE] bg-blue-50':'border-gray-200'} ${!isOwner?'cursor-default':''}`}>
                          <input type="checkbox" checked={level.channels.includes(ch)} readOnly={!isOwner}
                            onChange={() => isOwner && toggleChannel(level.id, ch)} className="accent-[#0072CE]" />
                          {CHANNEL_ICONS[ch]} {ch.charAt(0).toUpperCase()+ch.slice(1)}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Contacts */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Who to Notify</label>
                      {isOwner && (
                        <button type="button" onClick={() => setAddingContact(addingContact===level.id?null:level.id)}
                          className="text-xs bg-[#0072CE] text-white px-3 py-1 rounded hover:bg-[#005fa3] transition">
                          + Add Contact
                        </button>
                      )}
                    </div>

                    {(!level.contacts || level.contacts.length===0) ? (
                      <div className="text-sm text-gray-400 italic">No contacts added.</div>
                    ) : (
                      <div className="space-y-2">
                        {level.contacts.map(c => (
                          <div key={c.id} className="flex items-center justify-between px-4 py-2.5 bg-gray-50 rounded-lg">
                            <div>
                              <span className="font-medium text-sm text-gray-800">{c.name}</span>
                              {c.title && <span className="text-xs text-gray-400 ml-2">{c.title}</span>}
                              {c.hospital && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full ml-2">{c.hospital.toUpperCase()}</span>}
                              <div className="flex gap-3 mt-0.5">
                                {c.email && <span className="text-xs text-gray-500">✉️ {c.email}</span>}
                                {c.phone && <span className="text-xs text-gray-500">📞 {c.phone}</span>}
                                {c.sms   && <span className="text-xs text-gray-500">📱 {c.sms}</span>}
                              </div>
                            </div>
                            {isOwner && <button onClick={() => removeContact(level.id, c.id)} className="text-red-400 hover:text-red-600 text-xs ml-4">✕</button>}
                          </div>
                        ))}
                      </div>
                    )}

                    {isOwner && addingContact === level.id && (
                      <div className="mt-3 p-4 bg-blue-50 border border-[#0072CE]/20 rounded-xl">
                        <div className="grid grid-cols-2 gap-2 mb-3">
                          {[['name','Full Name *'],['title','Title'],['email','Email'],['phone','Phone'],['sms','SMS #'],['hospital','Hospital code']].map(([k,lbl]) => (
                            <div key={k}>
                              <label className="text-xs font-medium text-gray-600 block mb-0.5">{lbl}</label>
                              <input type="text" value={newContact[k]} placeholder={lbl}
                                onChange={e => setNewContact(p => ({...p,[k]:e.target.value}))}
                                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0072CE]" />
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => addContact(level.id)} className="bg-[#0072CE] text-white px-4 py-1.5 rounded text-sm font-medium hover:bg-[#005fa3]">Add</button>
                          <button onClick={() => setAddingContact(null)} className="text-gray-500 px-3 py-1.5 text-sm hover:text-gray-700">Cancel</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </main>
    </div>
  );
}

function TabBtn({ active, onClick, children }) {
  return (
    <button onClick={onClick}
      className={`px-3 py-1.5 rounded-t-lg text-xs font-semibold transition border-b-2 flex items-center gap-1
        ${active ? 'border-[#0072CE] text-[#0072CE] bg-white' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
      {children}
    </button>
  );
}

function SummaryCard({ label, subLabel, thresholds, levels, contacts, onEdit, isOwner, custom }) {
  const t = thresholds || DEFAULT_THRESHOLDS;
  const l = levels || DEFAULT_LEVELS;
  return (
    <div className={`bg-white rounded-xl border ${custom ? 'border-[#0072CE]/30' : 'border-gray-100'} shadow-sm overflow-hidden`}>
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50">
        <div>
          <span className="font-bold text-gray-800 text-sm">{label}</span>
          {subLabel && <span className="text-xs text-gray-400 ml-2">{subLabel}</span>}
          {custom && <span className="ml-2 text-xs bg-[#0072CE] text-white px-2 py-0.5 rounded-full">Custom</span>}
        </div>
        {isOwner && (
          <button onClick={onEdit} className="text-xs text-[#0072CE] hover:underline px-3 py-1 rounded border border-[#0072CE]/30 hover:bg-blue-50 transition">
            ✏️ Edit
          </button>
        )}
      </div>
      <div className="px-5 py-4 grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Thresholds quick view */}
        <div className="col-span-2 md:col-span-1">
          <div className="text-xs font-bold text-gray-400 uppercase mb-2">Thresholds</div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between"><span className="text-gray-500">Trending days</span><span className="font-bold text-gray-800">{t.trending_days}d</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Missed shifts</span><span className="font-bold text-gray-800">{t.missed_shifts}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">OOR readings</span><span className="font-bold text-gray-800">{t.out_of_range_count}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Legionella CFU</span><span className="font-bold text-red-600">{t.legionella_cfu_alert}</span></div>
          </div>
        </div>

        {/* Levels quick view */}
        {l.map((lv, i) => (
          <div key={lv.id}>
            <div className={`text-xs font-bold uppercase mb-2 ${i===0?'text-yellow-600':i===1?'text-orange-600':'text-red-600'}`}>
              Level {i+1}
            </div>
            <div className="text-xs text-gray-500 mb-1">{TRIGGER_LABELS[lv.trigger]}</div>
            <div className="flex gap-1 flex-wrap mb-1">
              {lv.channels.map(ch => <span key={ch} title={ch}>{CHANNEL_ICONS[ch]}</span>)}
            </div>
            <div className="text-xs text-gray-400">
              {(lv.contacts||[]).length > 0
                ? `${lv.contacts.length} contact${lv.contacts.length>1?'s':''}`
                : <span className="italic">No contacts</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
