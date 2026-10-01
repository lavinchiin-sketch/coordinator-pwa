import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { StatusBadge, ErrorBanner, SuccessBanner, Spinner, EmptyState, Field, Modal, Pagination } from '../components/ui.jsx';
import { usePagedList } from '../hooks.js';

export default function Users() {
  const [role, setRole] = useState('supervisor');
  const [message, setMessage] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const { list, page, setPage, error, setError, reload } = usePagedList(api.listUsers, { role });
  const load = reload;

  async function toggleActive(u) {
    try { await api.updateUser(u.user_id, { is_active: !u.is_active }); load(); } catch (e) { setError(e.message); }
  }
  async function resetPw(u) {
    if (!confirm(`Reset ${u.full_name}'s password?`)) return;
    try { const r = await api.resetPassword(u.user_id); setMessage(`New temporary password for ${r.email}: ${r.temp_password}`); } catch (e) { setError(e.message); }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold text-slate-800">Supervisors & Staff</h1>
        <button onClick={() => setShowAdd(true)} className="btn-primary text-sm">+ Add Account</button>
      </div>
      <ErrorBanner message={error} /><SuccessBanner message={message} />

      <div className="flex gap-2">
        {['supervisor', 'coordinator', 'all'].map((r) => (
          <button key={r} onClick={() => setRole(r)} className={`badge border ${role === r ? 'bg-accent text-white border-accent' : 'border-slate-200 text-slate-500'}`}>{r}</button>
        ))}
      </div>

      {!list ? <Spinner /> : list.data.length === 0 ? <EmptyState icon="👥" title="No accounts yet" /> : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead><tr className="text-left text-slate-400 border-b border-slate-100"><th className="px-4 py-2 font-medium">Name</th><th className="px-4 py-2 font-medium">Company</th><th className="px-4 py-2 font-medium">Interns</th><th className="px-4 py-2 font-medium">Status</th><th className="px-4 py-2"></th></tr></thead>
            <tbody>
              {list.data.map((u) => (
                <tr key={u.user_id} className="border-b border-slate-50 last:border-0">
                  <td className="px-4 py-2.5"><p className="font-medium text-slate-700">{u.full_name}</p><p className="text-xs text-slate-400">{u.email}</p></td>
                  <td className="px-4 py-2.5 text-slate-600">{u.company_name || '—'}</td>
                  <td className="px-4 py-2.5 text-slate-600">{u.interns ?? '—'}</td>
                  <td className="px-4 py-2.5"><StatusBadge status={u.is_active ? 'active' : 'inactive'} /></td>
                  <td className="px-4 py-2.5 text-right whitespace-nowrap">
                    <button onClick={() => resetPw(u)} className="text-xs text-accent mr-3">Reset password</button>
                    <button onClick={() => toggleActive(u)} className="text-xs text-slate-500">{u.is_active ? 'Deactivate' : 'Activate'}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {list && <Pagination page={list.page} pages={list.pages} onChange={setPage} />}
      {showAdd && <AddUserModal onClose={() => setShowAdd(false)} onDone={(msg) => { setShowAdd(false); load(); setMessage(msg); }} />}
    </div>
  );
}

function AddUserModal({ onClose, onDone }) {
  const [role, setRole] = useState('supervisor');
  const [companies, setCompanies] = useState([]);
  const [f, setF] = useState({ full_name: '', email: '', phone_number: '', company_id: '', position: '', department: '' });
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  useEffect(() => { if (role === 'supervisor') api.listCompanies({ all: 1 }).then((r) => setCompanies(r.data)); }, [role]);

  async function submit(e) {
    e.preventDefault(); setError('');
    if (!f.full_name || !f.email) return setError('Name and email are required.');
    setBusy(true);
    try {
      const res = role === 'supervisor' ? await api.createSupervisor(f) : await api.createCoordinator(f);
      onDone(`Account created: ${res.email} / ${res.temp_password}`);
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }

  return (
    <Modal open onClose={onClose} title="Add Account">
      <form onSubmit={submit} className="space-y-3">
        <Field label="Role">
          <select className="input" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="supervisor">Company Supervisor</option><option value="coordinator">Coordinator / Staff</option>
          </select>
        </Field>
        <Field label="Full name"><input className="input" value={f.full_name} onChange={set('full_name')} /></Field>
        <Field label="Email"><input type="email" className="input" value={f.email} onChange={set('email')} /></Field>
        {role === 'supervisor' && (
          <>
            <Field label="Company">
              <select className="input" value={f.company_id} onChange={set('company_id')}><option value="">Select…</option>{companies.map((c) => <option key={c.company_id} value={c.company_id}>{c.company_name}</option>)}</select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Position"><input className="input" value={f.position} onChange={set('position')} /></Field>
              <Field label="Department"><input className="input" value={f.department} onChange={set('department')} /></Field>
            </div>
          </>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={busy} className="btn-primary w-full">{busy ? 'Creating…' : 'Create Account'}</button>
      </form>
    </Modal>
  );
}
