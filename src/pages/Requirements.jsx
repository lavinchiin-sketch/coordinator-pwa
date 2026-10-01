import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { ErrorBanner, SuccessBanner, Spinner, Field, Modal } from '../components/ui.jsx';

export default function Requirements() {
  const [list, setList] = useState(null);
  const [error, setError] = useState(''); const [message, setMessage] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  function load() { api.listRequirements({ include_inactive: 1 }).then(setList).catch((e) => setError(e.message)); }
  useEffect(load, []);

  async function toggle(r, key) {
    try { await api.updateRequirement(r.requirement_id, { [key]: !r[key] }); load(); } catch (e) { setError(e.message); }
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">Requirements</h1>
        <button onClick={() => setShowAdd(true)} className="btn-primary text-sm">+ Add</button>
      </div>
      <ErrorBanner message={error} /><SuccessBanner message={message} />
      {!list ? <Spinner /> : (
        <div className="card divide-y divide-slate-50">
          {list.map((r) => (
            <div key={r.requirement_id} className="p-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-700">{r.name}{r.is_required && <span className="text-red-500"> *</span>}</p>
                {r.description && <p className="text-xs text-slate-400">{r.description}</p>}
                <p className="text-xs text-slate-400 mt-0.5">{r.approved_count} approved</p>
              </div>
              <div className="flex flex-col gap-1 items-end">
                <button onClick={() => toggle(r, 'is_required')} className={`badge border ${r.is_required ? 'bg-accent/10 text-accent border-accent/30' : 'border-slate-200 text-slate-400'}`}>{r.is_required ? 'Required' : 'Optional'}</button>
                <button onClick={() => toggle(r, 'is_active')} className="text-xs text-slate-400">{r.is_active ? 'Deactivate' : 'Activate'}</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {showAdd && <AddModal onClose={() => setShowAdd(false)} onDone={() => { setShowAdd(false); load(); setMessage('Requirement added.'); }} />}
    </div>
  );
}

function AddModal({ onClose, onDone }) {
  const [name, setName] = useState(''); const [description, setDescription] = useState(''); const [isRequired, setIsRequired] = useState(true);
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault(); if (!name.trim()) return setError('Enter a name.');
    setBusy(true);
    try { await api.createRequirement({ name, description, is_required: isRequired }); onDone(); } catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  return (
    <Modal open onClose={onClose} title="Add Requirement">
      <form onSubmit={submit} className="space-y-3">
        <Field label="Name"><input className="input" value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <Field label="Description (optional)"><textarea className="input" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} /></Field>
        <label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={isRequired} onChange={(e) => setIsRequired(e.target.checked)} /> Required for all students</label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={busy} className="btn-primary w-full">{busy ? 'Adding…' : 'Add'}</button>
      </form>
    </Modal>
  );
}
