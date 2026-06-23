'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { HOSPITALS } from '@/lib/hospitals';

function getUser() {
  if (typeof document === 'undefined') return null;
  const raw = document.cookie.split(';').find((c) => c.trim().startsWith('FacilityH2O_user='));
  if (!raw) return null;
  try { return JSON.parse(decodeURIComponent(raw.split('=')[1])); } catch { return null; }
}

const HOSPITAL_OPTIONS = [{ id: '', name: 'All Hospitals (Admin)' }, ...HOSPITALS.map((h) => ({ id: h.id, name: h.name }))];

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  // New user form state
  const [form, setForm] = useState({ username: '', password: '', name: '', hospital: 'whc', role: 'operator', email: '' });

  useEffect(() => {
    const u = getUser();
    if (u?.role !== 'admin') { router.push('/dashboard'); return; }
    fetchUsers();
  }, []);

  const fetchUsers = () => {
    setLoading(true);
    fetch('/api/users')
      .then((r) => {
        if (!r.ok) throw new Error(`Server error ${r.status}`);
        return r.json();
      })
      .then((d) => {
        setUsers(d.users || []);
        setIsSuperAdmin(d.isSuperAdmin === true);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Users fetch error:', err);
        setMsg({ type: 'error', text: `Failed to load users: ${err.message}. Please refresh the page.` });
        setLoading(false);
      });
  };

  const hospitalName = (id) => {
    if (!id) return 'All Hospitals';
    return HOSPITALS.find((h) => h.id === id)?.name || id;
  };

  const toggleActive = async (user) => {
    const res = await fetch(`/api/users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !user.active }),
    });
    if (res.ok) fetchUsers();
  };

  const deleteUser = async (user) => {
    if (!confirm(`Remove ${user.name} (${user.username})? This cannot be undone.`)) return;
    const res = await fetch(`/api/users/${user.id}`, { method: 'DELETE' });
    if (res.ok) {
      setMsg({ type: 'success', text: `${user.name} removed.` });
      fetchUsers();
    }
  };

  const resetPassword = async (user, newPw) => {
    const res = await fetch(`/api/users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: newPw }),
    });
    if (res.ok) {
      setMsg({ type: 'success', text: `Password updated for ${user.name}.` });
    }
  };

  const sendResetLink = async (user) => {
    setMsg(null);
    const res  = await fetch('/api/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'request', username: user.username }),
    });
    const data = await res.json();
    if (data.resetUrl) {
      // Show the link in a copyable alert since email may not be configured
      const copy = window.confirm(`Reset link for ${user.name}:\n\n${data.resetUrl}\n\nClick OK to copy to clipboard.`);
      if (copy) navigator.clipboard?.writeText(data.resetUrl).catch(() => {});
      setMsg({ type: 'success', text: `Reset link generated for ${user.name}. ${user.email ? `Also sent to ${user.email}.` : 'No email on file — copy from the dialog.'}` });
    } else {
      setMsg({ type: 'success', text: data.message || 'Reset link sent.' });
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    const payload = {
      ...form,
      hospital: form.role === 'admin' ? null : (form.hospital || null),
    };
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setSaving(false);
    if (data.success) {
      setMsg({ type: 'success', text: `User ${form.username} created.` });
      setForm({ username: '', password: '', name: '', hospital: 'whc', role: 'operator', email: '' });
      setShowAdd(false);
      fetchUsers();
    } else {
      setMsg({ type: 'error', text: data.error || 'Failed to create user.' });
    }
  };

  const operators = users.filter((u) => u.role === 'operator');
  // Regular admins only see their own account in admin list; super-admin sees all
  const admins = isSuperAdmin ? users.filter((u) => u.role === 'admin') : [];

  // Group operators by hospital
  const byHospital = HOSPITALS.map((h) => ({
    hospital: h,
    users: operators.filter((u) => u.hospital === h.id),
  }));

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 w-full min-w-0 p-4 md:p-8 pt-16 md:pt-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-500 text-sm mt-1">Add, remove, or disable portal access by hospital</p>
          </div>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="bg-[#0072CE] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#005fa3] transition"
          >
            {showAdd ? '× Cancel' : '+ Add User'}
          </button>
        </div>

        {msg && (
          <div className={`mb-6 px-4 py-3 rounded-xl text-sm font-medium ${msg.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-700'}`}>
            {msg.text}
          </div>
        )}

        {/* Add User Form */}
        {showAdd && (
          <div className="bg-white rounded-xl shadow-sm border border-[#0072CE]/20 p-6 mb-8">
            <h2 className="text-base font-semibold text-gray-800 mb-4">New User</h2>
            <form onSubmit={handleAdd} className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. John Smith"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0072CE]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Username</label>
                <input
                  type="text"
                  required
                  value={form.username}
                  onChange={(e) => setForm((p) => ({ ...p, username: e.target.value.toLowerCase().replace(/\s/g, '_') }))}
                  placeholder="e.g. j.smith"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0072CE]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Password</label>
                <input
                  type="text"
                  required
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                  placeholder="Set a password"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0072CE]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Email (optional)</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  placeholder="email@FacilityH2O.net"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0072CE]"
                />
              </div>
              {/* Only super-admin can assign admin role */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Role</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0072CE]"
                >
                  <option value="operator">Operator (Hospital Only)</option>
                  {isSuperAdmin && <option value="admin">Admin (All Hospitals)</option>}
                </select>
              </div>
            {form.role === 'operator' && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Assigned Hospital</label>
                  <select
                    value={form.hospital}
                    onChange={(e) => setForm((p) => ({ ...p, hospital: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0072CE]"
                  >
                    {HOSPITALS.map((h) => (
                      <option key={h.id} value={h.id}>{h.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="col-span-2 flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-[#0072CE] text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-[#005fa3] transition disabled:opacity-60"
                >
                  {saving ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="text-center text-gray-400 py-12">Loading...</div>
        ) : (
          <div className="space-y-6">
            {/* Admin accounts — visible to super-admin only */}
            {isSuperAdmin && admins.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-5 py-3 bg-[#003366] text-white text-sm font-semibold flex items-center gap-2">
                  ⚿ Admin Accounts
                  <span className="ml-2 text-xs bg-yellow-400 text-gray-900 px-2 py-0.5 rounded-full font-bold">Owner View Only</span>
                  <span className="ml-auto text-xs text-blue-200 font-normal">Full system access</span>
                </div>
                <div className="divide-y divide-gray-50">
                  {admins.map((u) => (
                    <UserRow key={u.id} user={u} hospitalName={hospitalName} onToggle={toggleActive} onDelete={deleteUser} onReset={resetPassword} onSendReset={sendResetLink} isAdmin isSuperAdmin={isSuperAdmin} superAdminId="usr_ariley" />
                  ))}
                </div>
              </div>
            )}

            {/* Operators by hospital */}
            {byHospital.map(({ hospital, users: hospUsers }) => (
              <div key={hospital.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 text-sm font-semibold text-gray-700 flex items-center justify-between">
                  <span>[SITE] {hospital.name}</span>
                  <span className="text-xs text-gray-400">{hospital.code} · {hospUsers.length} user{hospUsers.length !== 1 ? 's' : ''}</span>
                </div>
                {hospUsers.length === 0 ? (
                  <div className="px-5 py-4 text-sm text-gray-400 italic">No users assigned to this hospital.</div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {hospUsers.map((u) => (
                      <UserRow key={u.id} user={u} hospitalName={hospitalName} onToggle={toggleActive} onDelete={deleteUser} onReset={resetPassword} onSendReset={sendResetLink} isSuperAdmin={isSuperAdmin} superAdminId="usr_ariley" />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function UserRow({ user, hospitalName, onToggle, onDelete, onReset, onSendReset, isAdmin, isSuperAdmin, superAdminId }) {
  const [editingPw, setEditingPw] = useState(false);
  const [newPw, setNewPw] = useState('');

  const handleReset = () => {
    if (!newPw.trim()) return;
    onReset(user, newPw.trim());
    setNewPw('');
    setEditingPw(false);
  };

  return (
    <div className={`px-5 py-4 flex items-center justify-between gap-4 ${!user.active ? 'opacity-50 bg-gray-50' : ''}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900 text-sm">{user.name}</span>
          {!user.active && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Disabled</span>}
          {isAdmin && <span className="text-xs bg-[#003366] text-white px-2 py-0.5 rounded-full">Admin</span>}
          {isAdmin && user.id === superAdminId && <span className="text-xs bg-yellow-400 text-gray-900 px-2 py-0.5 rounded-full font-bold">Owner</span>}
        </div>
        <div className="text-xs text-gray-400 mt-0.5">
          Username: <span className="font-mono text-gray-600">{user.username}</span>
          {user.email && <span className="ml-3">✉️ {user.email}</span>}
        </div>

        {editingPw && (
          <div className="flex items-center gap-2 mt-2">
            <input
              type="text"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              placeholder="New password"
              className="border border-gray-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-[#0072CE] w-44"
            />
            <button onClick={handleReset} className="text-xs bg-[#0072CE] text-white px-3 py-1 rounded-lg hover:bg-[#005fa3]">Save</button>
            <button onClick={() => { setEditingPw(false); setNewPw(''); }} className="text-xs text-gray-400 hover:text-gray-600">Cancel</button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Send Reset Link — available for all users */}
        {onSendReset && (
          <button
            onClick={() => onSendReset(user)}
            className="text-xs text-[#0072CE] hover:text-[#005fa3] px-2 py-1 rounded border border-[#0072CE]/30 hover:border-[#0072CE] transition"
            title="Generate a password reset link for this user"
          >
            ⛓ Reset Link
          </button>
        )}
        {/* Manual password reset: admins can reset operators; super-admin can reset anyone except themselves */}
        {(!isAdmin || (isSuperAdmin && user.id !== superAdminId)) && (
          <button
            onClick={() => setEditingPw(!editingPw)}
            className="text-xs text-gray-500 hover:text-[#0072CE] px-2 py-1 rounded border border-gray-200 hover:border-[#0072CE] transition"
          >
            ⚿ Set PW
          </button>
        )}
        {/* Disable/Enable: operators only (super-admin can also toggle other admins) */}
        {(!isAdmin || (isSuperAdmin && user.id !== superAdminId)) && (
          <button
            onClick={() => onToggle(user)}
            className={`text-xs px-2 py-1 rounded border transition ${
              user.active
                ? 'text-orange-600 border-orange-200 hover:bg-orange-50'
                : 'text-green-600 border-green-200 hover:bg-green-50'
            }`}
          >
            {user.active ? '⏸ Disable' : '▶ Enable'}
          </button>
        )}
        {/* Remove: operators only (super-admin can also remove other admins) */}
        {(!isAdmin || (isSuperAdmin && user.id !== superAdminId)) && (
          <button
            onClick={() => onDelete(user)}
            className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded border border-red-100 hover:border-red-300 hover:bg-red-50 transition"
          >
            ⌫ Remove
          </button>
        )}
      </div>
    </div>
  );
}
