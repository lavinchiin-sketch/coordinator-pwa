import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { ErrorBanner, SuccessBanner, Spinner, EmptyState, Field, Modal } from '../components/ui.jsx';

export default function Companies() {
  const [list, setList] = useState(null); const [filter, setFilter] = useState('');
  const [error, setError] = useState(''); const [message, setMessage] = useState('');
  const [showAdd, setShowAdd] = useState(false); const [editing, setEditing] = useState(null);

  function load() { api.listCompanies({ partner: filter || undefined, all: 1 }).then(setList).catch((e) => setError(e.message)); }
  useEffect(load, [filter]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold text-slate-800">Companies</h1>
        <button onClick={() => setShowAdd(true)} className="btn-primary text-sm">+ Add Company</button>
      </div>
      <ErrorBanner message={error} /><SuccessBanner message={message} />

      <div className="flex gap-2">
        <FilterTab label="All" active={filter === ''} onClick={() => setFilter('')} />
        <FilterTab label="Partner" active={filter === '1'} onClick={() => setFilter('1')} />
        <FilterTab label="Non-partner" active={filter === '0'} onClick={() => setFilter('0')} />
      </div>

      {!list ? <Spinner /> : list.data.length === 0 ? <EmptyState icon="🏢" title="No companies yet" /> : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {list.data.map((c) => (
            <button key={c.company_id} onClick={() => setEditing(c)} className="card p-4 text-left hover:border-accent transition">
              <div className="flex justify-between items-start gap-2">
                <p className="font-medium text-slate-700">{c.company_name}</p>
                {c.is_partner ? <span className="badge bg-emerald-100 text-emerald-700">Partner</span> : <span className="badge bg-slate-100 text-slate-500">Non-partner</span>}
              </div>
              <p className="text-xs text-slate-400">{c.industry}{c.address ? ` · ${c.address}` : ''}</p>
              <p className="text-xs text-slate-500 mt-2">{c.interns} intern(s) · {c.supervisors} supervisor(s)</p>
              {c.source === 'student' && <p className="text-xs text-blue-600 mt-1">Added via a student's own OJT</p>}
            </button>
          ))}
        </div>
      )}
      {showAdd && <CompanyModal onClose={() => setShowAdd(false)} onDone={() => { setShowAdd(false); load(); setMessage('Company added.'); }} />}
      {editing && <CompanyModal company={editing} onClose={() => setEditing(null)} onDone={() => { setEditing(null); load(); setMessage('Company updated.'); }} />}
    </div>
  );
}

function FilterTab({ label, active, onClick }) {
  return <button onClick={onClick} className={`badge border ${active ? 'bg-accent text-white border-accent' : 'border-slate-200 text-slate-500'}`}>{label}</button>;
}

function CompanyModal({ company, onClose, onDone }) {
  const [f, setF] = useState(company || { company_name: '', address: '', industry: '', contact_person: '', contact_email: '', contact_phone: '', is_partner: false, status: 'active' });
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault(); setError('');
    if (!f.company_name.trim()) return setError('Company name is required.');
    setBusy(true);
    try { company ? await api.updateCompany(company.company_id, f) : await api.createCompany(f); onDone(); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  }

  return (
    <Modal open onClose={onClose} title={company ? 'Edit Company' : 'Add Company'}>
      <form onSubmit={submit} className="space-y-3">
        <Field label="Company name"><input className="input" value={f.company_name} onChange={set('company_name')} /></Field>
        <Field label="Industry"><input className="input" value={f.industry || ''} onChange={set('industry')} /></Field>
        <Field label="Address"><input className="input" value={f.address || ''} onChange={set('address')} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Contact person"><input className="input" value={f.contact_person || ''} onChange={set('contact_person')} /></Field>
          <Field label="Contact email"><input className="input" value={f.contact_email || ''} onChange={set('contact_email')} /></Field>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={!!f.is_partner} onChange={(e) => setF({ ...f, is_partner: e.target.checked })} />
          This is an official school partner (has an MOA)
        </label>
        {company && (
          <Field label="Status">
            <select className="input" value={f.status} onChange={set('status')}><option value="active">Active</option><option value="inactive">Inactive</option></select>
          </Field>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={busy} className="btn-primary w-full">{busy ? 'Saving…' : company ? 'Save Changes' : 'Add Company'}</button>
      </form>
    </Modal>
  );
}
