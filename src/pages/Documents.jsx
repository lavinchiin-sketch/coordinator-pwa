import React, { useState } from 'react';
import { api, fileUrl } from '../api';
import { StatusBadge, ErrorBanner, Spinner, EmptyState, Pagination } from '../components/ui.jsx';
import { usePagedList } from '../hooks.js';

export default function Documents() {
  const [status, setStatus] = useState('pending');
  const [busyId, setBusyId] = useState(null);
  const [rejecting, setRejecting] = useState(null); const [remarks, setRemarks] = useState('');
  const { list, page, setPage, error, setError, reload } = usePagedList(api.listDocuments, { status: status || undefined });
  const load = reload;

  async function approve(id) {
    setBusyId(id);
    try { await api.reviewDocument(id, 'approved'); load(); } catch (e) { setError(e.message); } finally { setBusyId(null); }
  }
  async function reject(id) {
    if (!remarks.trim()) return setError('Explain why it was rejected.');
    setBusyId(id);
    try { await api.reviewDocument(id, 'rejected', remarks); setRejecting(null); setRemarks(''); load(); } catch (e) { setError(e.message); } finally { setBusyId(null); }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold text-slate-800">Document Review</h1>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="input max-w-[10rem]">
          <option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="">All</option>
        </select>
      </div>
      <ErrorBanner message={error} />
      {!list ? <Spinner /> : list.data.length === 0 ? <EmptyState icon="🗂" title="Nothing here" /> : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {list.data.map((d) => (
            <div key={d.document_id} className="card p-4">
              <div className="flex justify-between items-start gap-2"><p className="text-sm font-medium text-slate-700">{d.doc_type}</p><StatusBadge status={d.status} /></div>
              <p className="text-xs text-slate-400 mt-1">{d.student_name} · {d.school_id}</p>
              <a href={fileUrl(d.file_path)} target="_blank" rel="noreferrer" className="text-xs text-accent">View file →</a>
              {d.status === 'pending' && (
                rejecting === d.document_id ? (
                  <div className="mt-2 space-y-2">
                    <input value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Reason" className="input text-xs" />
                    <div className="flex gap-2"><button onClick={() => reject(d.document_id)} disabled={busyId === d.document_id} className="btn-secondary bg-red-50 text-red-700 text-xs py-1">Confirm</button><button onClick={() => setRejecting(null)} className="text-xs text-slate-400">Cancel</button></div>
                  </div>
                ) : (
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => approve(d.document_id)} disabled={busyId === d.document_id} className="btn-primary text-xs py-1.5">Approve</button>
                    <button onClick={() => setRejecting(d.document_id)} className="btn-secondary bg-red-50 text-red-700 text-xs py-1.5">Reject</button>
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
