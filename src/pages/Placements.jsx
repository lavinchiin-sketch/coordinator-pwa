import React, { useEffect, useState } from 'react';
import { api, fileUrl } from '../api';
import { StatusBadge, ErrorBanner, SuccessBanner, Spinner, EmptyState, Field, Modal, Pagination } from '../components/ui.jsx';
import { usePagedList } from '../hooks.js';

export default function Placements() {
  const [status, setStatus] = useState('pending');
  const [message, setMessage] = useState('');
  const [reviewing, setReviewing] = useState(null); const [showAssign, setShowAssign] = useState(false);
  const { list, page, setPage, error, setError, reload } = usePagedList(api.listPlacements, { status: status || undefined });
  const load = reload;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold text-slate-800">Placements</h1>
        <button onClick={() => setShowAssign(true)} className="btn-primary text-sm">Assign Students Directly</button>
      </div>
      <ErrorBanner message={error} /><SuccessBanner message={message} />

      <select value={status} onChange={(e) => setStatus(e.target.value)} className="input max-w-[10rem]">
        <option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="">All</option>
      </select>

      {!list ? <Spinner /> : list.data.length === 0 ? <EmptyState icon="📋" title="Nothing here" /> : (
        <div className="space-y-3">
          {list.data.map((p) => (
            <div key={p.placement_id} className="card p-4">
              <div className="flex justify-between items-start flex-wrap gap-2">
                <div>
                  <p className="font-medium text-slate-700">{p.student_name} <span className="text-xs text-slate-400 font-normal">{p.school_id}</span></p>
                  <p className="text-sm text-slate-600">{p.company_name || p.proposed_company_name} {p.source === 'self_sourced' && <span className="text-xs text-blue-600">(student-sourced)</span>}</p>
                  {p.proposed_supervisor_name && <p className="text-xs text-slate-400">Supervisor: {p.proposed_supervisor_name} · {p.proposed_supervisor_email}</p>}
                  {p.student_remarks && <p className="text-xs text-slate-500 mt-1 italic">"{p.student_remarks}"</p>}
                  {p.acceptance_letter && <a href={fileUrl(p.acceptance_letter)} target="_blank" rel="noreferrer" className="text-xs text-accent">View acceptance letter →</a>}
                </div>
                <StatusBadge status={p.status} />
              </div>
              {p.reviewer_remarks && <p className="text-xs text-slate-500 mt-2 bg-slate-50 rounded p-2">Note: {p.reviewer_remarks}</p>}
              {p.status === 'pending' && (
                <div className="flex gap-2 mt-3">
                  <button onClick={() => setReviewing(p)} className="btn-primary text-sm py-1.5">Review & Approve</button>
                  <RejectButton id={p.placement_id} onDone={() => { load(); setMessage('Request rejected.'); }} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {list && <Pagination page={list.page} pages={list.pages} onChange={setPage} />}
      {reviewing && <ApproveModal placement={reviewing} onClose={() => setReviewing(null)} onDone={(msg) => { setReviewing(null); load(); setMessage(msg); }} />}
      {showAssign && <AssignModal onClose={() => setShowAssign(false)} onDone={() => { setShowAssign(false); load(); setMessage('Students assigned.'); }} />}
    </div>
  );
}

function RejectButton({ id, onDone }) {
  const [open, setOpen] = useState(false); const [remarks, setRemarks] = useState(''); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  async function submit() {
    if (!remarks.trim()) return setError('Explain why, so the student knows what to fix.');
    setBusy(true);
    try { await api.rejectPlacement(id, remarks); onDone(); } catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  if (!open) return <button onClick={() => setOpen(true)} className="btn-secondary bg-red-50 text-red-700 text-sm py-1.5">Reject</button>;
  return (
    <div className="flex gap-2 items-start">
      <input value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Reason" className="input text-sm" />
      <button onClick={submit} disabled={busy} className="btn-secondary bg-red-50 text-red-700 text-sm py-1.5 whitespace-nowrap">Confirm</button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

// Approve: choose an existing company/supervisor, or accept the student's proposal as a new (partner or not) company.
function ApproveModal({ placement: p, onClose, onDone }) {
  const [companies, setCompanies] = useState([]);
  const [companyId, setCompanyId] = useState(p.company_id || '');
  const [isPartner, setIsPartner] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false);

  useEffect(() => { api.listCompanies({ all: 1 }).then((r) => setCompanies(r.data)); }, []);

  async function submit(e) {
    e.preventDefault(); setError(''); setBusy(true);
    try {
      const payload = { start_date: startDate || undefined, reviewer_remarks: remarks || undefined };
      if (companyId) payload.company_id = companyId; else payload.is_partner = isPartner;
      const res = await api.approvePlacement(p.placement_id, payload);
      onDone(res.new_supervisor
        ? `Approved. New supervisor account: ${res.new_supervisor.email} / ${res.new_supervisor.temp_password}`
        : 'Approved.');
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }

  return (
    <Modal open onClose={onClose} title={`Approve — ${p.student_name}`} wide>
      <form onSubmit={submit} className="space-y-3">
        <div className="bg-slate-50 rounded-lg p-3 text-sm">
          <p className="font-medium text-slate-700">{p.proposed_company_name || p.company_name}</p>
          <p className="text-slate-500">Supervisor: {p.proposed_supervisor_name} · {p.proposed_supervisor_email}</p>
        </div>
        <Field label="Link to an existing company instead? (optional)">
          <select className="input" value={companyId} onChange={(e) => setCompanyId(e.target.value)}>
            <option value="">— Create a new company from the student's proposal —</option>
            {companies.map((c) => <option key={c.company_id} value={c.company_id}>{c.company_name}</option>)}
          </select>
        </Field>
        {!companyId && (
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={isPartner} onChange={(e) => setIsPartner(e.target.checked)} />
            Mark this as an official school partner (creates a MOA record)
          </label>
        )}
        <Field label="Start date"><input type="date" className="input" value={startDate || p.start_date || ''} onChange={(e) => setStartDate(e.target.value)} /></Field>
        <Field label="Notes (optional)"><textarea className="input" rows={2} value={remarks} onChange={(e) => setRemarks(e.target.value)} /></Field>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={busy} className="btn-primary w-full">{busy ? 'Approving…' : 'Approve Placement'}</button>
      </form>
    </Modal>
  );
}

function AssignModal({ onClose, onDone }) {
  const [students, setStudents] = useState([]); const [companies, setCompanies] = useState([]); const [supervisors, setSupervisors] = useState([]);
  const [studentIds, setStudentIds] = useState([]); const [companyId, setCompanyId] = useState(''); const [supervisorId, setSupervisorId] = useState('');
  const [startDate, setStartDate] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);

  useEffect(() => { api.listStudents({ unassigned: 1, all: 1 }).then((r) => setStudents(r.data)); api.listCompanies({ all: 1 }).then((r) => setCompanies(r.data)); }, []);
  useEffect(() => { if (companyId) api.listUsers({ role: 'supervisor', company_id: companyId, all: 1 }).then((r) => setSupervisors(r.data)); else setSupervisors([]); }, [companyId]);

  function toggle(id) { setStudentIds((c) => c.includes(id) ? c.filter((x) => x !== id) : [...c, id]); }
  async function submit(e) {
    e.preventDefault(); setError('');
    if (!studentIds.length || !companyId || !supervisorId) return setError('Choose students, a company, and a supervisor.');
    setBusy(true);
    try { const r = await api.assignPlacements({ student_ids: studentIds, company_id: companyId, supervisor_id: supervisorId, start_date: startDate || undefined }); onDone(`${r.assigned} student(s) assigned.`); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  }

  return (
    <Modal open onClose={onClose} title="Assign Students to a Company" wide>
      <form onSubmit={submit} className="space-y-3">
        <Field label={`Students without a placement (${students.length})`}>
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto border border-slate-200 rounded-lg p-2">
            {students.length === 0 ? <p className="text-xs text-slate-400">Everyone already has a placement.</p> :
              students.map((s) => (
                <button type="button" key={s.student_id} onClick={() => toggle(s.student_id)}
                  className={`text-xs px-2.5 py-1.5 rounded-full border ${studentIds.includes(s.student_id) ? 'bg-accent text-white border-accent' : 'border-slate-300 text-slate-600'}`}>
                  {s.full_name}
                </button>
              ))}
          </div>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Company">
            <select className="input" value={companyId} onChange={(e) => { setCompanyId(e.target.value); setSupervisorId(''); }}>
              <option value="">Select…</option>{companies.map((c) => <option key={c.company_id} value={c.company_id}>{c.company_name}</option>)}
            </select>
          </Field>
          <Field label="Supervisor">
            <select className="input" value={supervisorId} onChange={(e) => setSupervisorId(e.target.value)} disabled={!companyId}>
              <option value="">Select…</option>{supervisors.map((s) => <option key={s.supervisor_id} value={s.supervisor_id}>{s.full_name}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Start date"><input type="date" className="input" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></Field>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={busy} className="btn-primary w-full">{busy ? 'Assigning…' : `Assign ${studentIds.length || 0} student(s)`}</button>
      </form>
    </Modal>
  );
}
