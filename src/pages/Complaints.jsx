import React, { useState } from 'react';
import { api } from '../api';
import { StatusBadge, ErrorBanner, Spinner, EmptyState, Pagination } from '../components/ui.jsx';
import { usePagedList } from '../hooks.js';

const SEVERITY_COLOR = { high: 'text-red-600', medium: 'text-amber-600', low: 'text-slate-400' };

export default function Complaints() {
  const [status, setStatus] = useState('open');
  const [busyId, setBusyId] = useState(null);
  const [resolving, setResolving] = useState(null); const [notes, setNotes] = useState('');
  const { list, page, setPage, error, setError, reload } = usePagedList(api.listComplaints, { status: status || undefined });
  const load = reload;

  async function updateStatus(id, s) {
    if (['resolved', 'dismissed'].includes(s) && !notes.trim()) return setError('Add resolution notes.');
    setBusyId(id);
    try { await api.updateComplaint(id, s, notes); setResolving(null); setNotes(''); load(); } catch (e) { setError(e.message); } finally { setBusyId(null); }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold text-slate-800">Complaints</h1>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="input max-w-[10rem]">
          <option value="open">Open</option><option value="under_review">Under review</option><option value="resolved">Resolved</option><option value="dismissed">Dismissed</option><option value="">All</option>
        </select>
      </div>
      <ErrorBanner message={error} />
      {!list ? <Spinner /> : list.data.length === 0 ? <EmptyState icon="!" title="Nothing here" /> : (
        <div className="space-y-3">
          {list.data.map((c) => (
            <div key={c.complaint_id} className="card p-4">
              <div className="flex justify-between items-start gap-2 flex-wrap">
                <div>
                  <p className="font-medium text-slate-700">{c.subject} <span className={`text-xs font-normal ${SEVERITY_COLOR[c.severity]}`}>· {c.severity}</span></p>
                  <p className="text-xs text-slate-400">{c.filed_by_name} ({c.filed_by_role}) · {c.category}{c.company_name ? ` · ${c.company_name}` : ''}</p>
                </div>
                <StatusBadge status={c.status} />
              </div>
              <p className="text-sm text-slate-600 mt-2">{c.description}</p>
              {c.resolution_notes && <p className="text-xs text-emerald-700 mt-2 bg-emerald-50 rounded p-2">Resolution: {c.resolution_notes}</p>}
              {!['resolved', 'dismissed'].includes(c.status) && (
                resolving === c.complaint_id ? (
                  <div className="mt-3 space-y-2">
                    <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Resolution notes" rows={2} className="input text-sm" />
                    <div className="flex gap-2">
                      <button onClick={() => updateStatus(c.complaint_id, 'resolved')} disabled={busyId === c.complaint_id} className="btn-primary text-sm py-1.5">Mark Resolved</button>
                      <button onClick={() => updateStatus(c.complaint_id, 'dismissed')} disabled={busyId === c.complaint_id} className="btn-secondary text-sm py-1.5">Dismiss</button>
                      <button onClick={() => setResolving(null)} className="text-xs text-slate-400">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2 mt-3">
                    {c.status === 'open' && <button onClick={() => updateStatus(c.complaint_id, 'under_review')} disabled={busyId === c.complaint_id} className="btn-secondary text-sm py-1.5">Mark Under Review</button>}
                    <button onClick={() => setResolving(c.complaint_id)} className="btn-primary text-sm py-1.5">Resolve / Dismiss</button>
                  </div>
                )
              )}
            </div>
          ))}
        </div>
      )}
      {list && <Pagination page={list.page} pages={list.pages} onChange={setPage} />}
    </div>
  );
}
