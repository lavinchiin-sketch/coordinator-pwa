import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { StatusBadge, ErrorBanner, SuccessBanner, Spinner, EmptyState, Modal, Field, Pagination } from '../components/ui.jsx';
import { usePagedList } from '../hooks.js';

const STATUSES = ['not_started', 'looking', 'pending_approval', 'ongoing', 'completed', 'dropped'];

export default function Students() {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [showImport, setShowImport] = useState(false); const [showAdd, setShowAdd] = useState(false);
  const [active, setActive] = useState(null);

  // Debounce the search box only; status changes apply immediately.
  useEffect(() => { const t = setTimeout(() => setSearch(searchInput.trim()), 300); return () => clearTimeout(t); }, [searchInput]);

  const { list, page, setPage, error, reload } = usePagedList(
    (params) => api.listStudents({ ...params, sort: 'name' }),
    { search: search || undefined, status: status || undefined }
  );
  const load = reload;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold text-slate-800">Students</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowAdd(true)} className="btn-secondary text-sm">+ Add one</button>
          <button onClick={() => setShowImport(true)} className="btn-primary text-sm">Bulk Import</button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search name, ID, or email…" className="input sm:max-w-xs" />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="input sm:max-w-[10rem]">
          <option value="">All statuses</option>{STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
      </div>

      <ErrorBanner message={error} />
      {!list ? <Spinner /> : list.data.length === 0 ? <EmptyState icon="🎓" title="No students found" hint="Try Bulk Import to add your class list." /> : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead><tr className="text-left text-slate-400 border-b border-slate-100">
              <th className="px-4 py-2 font-medium">Student</th><th className="px-4 py-2 font-medium">Program</th>
              <th className="px-4 py-2 font-medium">Company</th><th className="px-4 py-2 font-medium">Progress</th><th className="px-4 py-2 font-medium">Status</th>
            </tr></thead>
            <tbody>
              {list.data.map((s) => (
                <tr key={s.student_id} onClick={() => setActive(s.student_id)} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 cursor-pointer">
                  <td className="px-4 py-2.5"><p className="font-medium text-slate-700">{s.full_name}</p><p className="text-xs text-slate-400">{s.school_id}</p></td>
                  <td className="px-4 py-2.5 text-slate-600">{s.program}</td>
                  <td className="px-4 py-2.5 text-slate-600">{s.company_name || '—'}{s.is_partner === 0 && s.company_name ? <span className="text-xs text-slate-400"> (non-partner)</span> : ''}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2"><div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-accent" style={{ width: `${Math.min(100, s.progress_percent || 0)}%` }} /></div><span className="text-xs text-slate-500">{s.progress_percent || 0}%</span></div>
                  </td>
                  <td className="px-4 py-2.5"><StatusBadge status={s.ojt_status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {list && <Pagination page={list.page} pages={list.pages} onChange={setPage} />}

      {showImport && <BulkImportModal onClose={() => setShowImport(false)} onDone={() => { setShowImport(false); load(); }} />}
      {showAdd && <AddOneModal onClose={() => setShowAdd(false)} onDone={() => { setShowAdd(false); load(); }} />}
      {active && <StudentDetailModal id={active} onClose={() => setActive(null)} onChanged={load} />}
    </div>
  );
}

// ---------- Bulk import: paste CSV-like lines, preview, submit in batches ----------
function parseRows(text) {
  return text.split('\n').map((l) => l.trim()).filter(Boolean).map((line, i) => {
    const [school_id, full_name, email, program, year_level, section] = line.split(',').map((s) => s?.trim());
    return { _row: i + 1, school_id, full_name, email, program, year_level, section };
  });
}

function BulkImportModal({ onClose, onDone }) {
  const [text, setText] = useState('');
  const [passwordMode, setPasswordMode] = useState('student_id');
  const [rows, setRows] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const [progress, setProgress] = useState(null);

  function preview() {
    const parsed = parseRows(text);
    if (!parsed.length) return setError('Paste at least one row.');
    const bad = parsed.filter((r) => !r.school_id || !r.full_name || !r.email);
    if (bad.length) return setError(`Row(s) missing data: ${bad.map((r) => r._row).join(', ')}. Format: student_id, full name, email, program, year level, section`);
    setError(''); setRows(parsed);
  }

  async function submit() {
    setBusy(true); setError(''); const created = []; const skipped = [];
    for (let i = 0; i < rows.length; i += 50) {
      const batch = rows.slice(i, i + 50);
      setProgress(`Importing ${i + 1}–${Math.min(i + 50, rows.length)} of ${rows.length}…`);
      try { const r = await api.importStudents(batch, { password_mode: passwordMode }); created.push(...r.created); skipped.push(...r.skipped); }
      catch (e) { setError(e.message); setBusy(false); return; }
    }
    setProgress(null); setBusy(false); setResult({ created, skipped });
  }

  return (
    <Modal open onClose={onClose} title="Bulk Import Students" wide>
      {result ? (
        <div className="space-y-3">
          <p className="text-sm text-emerald-700">{result.created.length} student(s) created.</p>
          {result.skipped.length > 0 && (
            <div>
              <p className="text-sm text-amber-700 mb-1">{result.skipped.length} skipped:</p>
              <div className="max-h-32 overflow-y-auto text-xs text-slate-500 space-y-0.5">
                {result.skipped.map((s, i) => <p key={i}>Row {s.index + 1} ({s.school_id}): {s.reason}</p>)}
              </div>
            </div>
          )}
          <p className="text-xs text-slate-400">Default password = student ID (or a random one, if you chose that). Students are required to change it on first login.</p>
          <button onClick={onDone} className="btn-primary w-full">Done</button>
        </div>
      ) : rows.length === 0 ? (
        <div className="space-y-3">
          <p className="text-sm text-slate-500">Paste one student per line: <code className="bg-slate-100 px-1 rounded text-xs">student_id, full name, email, program, year level, section</code></p>
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={10} placeholder={"21-00123, Juan Dela Cruz, juan.delacruz@psu.edu.ph, BSIT, 4th Year, BSIT-4A\n21-00124, Maria Reyes, maria.reyes@psu.edu.ph, BSIT, 4th Year, BSIT-4A"} className="input font-mono text-xs" />
          <Field label="Temporary password">
            <select className="input" value={passwordMode} onChange={(e) => setPasswordMode(e.target.value)}>
              <option value="student_id">Use the Student ID as password</option>
              <option value="random">Generate a random password</option>
            </select>
          </Field>
          {error && <p className="text-sm text-red-600 whitespace-pre-wrap">{error}</p>}
          <button onClick={preview} className="btn-primary w-full">Preview</button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-slate-600">{rows.length} student(s) ready to import.</p>
          <div className="max-h-64 overflow-y-auto border border-slate-100 rounded-lg">
            <table className="w-full text-xs"><thead><tr className="text-left text-slate-400 bg-slate-50"><th className="px-3 py-2">ID</th><th className="px-3 py-2">Name</th><th className="px-3 py-2">Email</th><th className="px-3 py-2">Program</th></tr></thead>
              <tbody>{rows.map((r) => <tr key={r._row} className="border-t border-slate-50"><td className="px-3 py-1.5">{r.school_id}</td><td className="px-3 py-1.5">{r.full_name}</td><td className="px-3 py-1.5">{r.email}</td><td className="px-3 py-1.5">{r.program}</td></tr>)}</tbody>
            </table>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {progress && <p className="text-sm text-slate-500">{progress}</p>}
          <div className="flex gap-2">
            <button onClick={submit} disabled={busy} className="btn-primary flex-1">{busy ? 'Importing…' : `Import ${rows.length} student(s)`}</button>
            <button onClick={() => setRows([])} disabled={busy} className="btn-secondary">Back</button>
          </div>
        </div>
      )}
    </Modal>
  );
}

function AddOneModal({ onClose, onDone }) {
  const [f, setF] = useState({ school_id: '', full_name: '', email: '', program: '', year_level: '', section: '', required_hours: 486 });
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const [result, setResult] = useState(null);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  async function submit(e) {
    e.preventDefault(); setError('');
    if (!f.school_id || !f.full_name || !f.email) return setError('Student ID, name, and email are required.');
    setBusy(true);
    try { const res = await api.createStudent(f); setResult(res); } catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  if (result) {
    return (
      <Modal open onClose={onDone} title="Student Added">
        <div className="space-y-3">
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm text-emerald-800">
            Account created. Share these login details with the student:<br />
            <span className="font-mono">{result.email}</span> (or ID {result.school_id}) / <span className="font-mono">{result.temp_password}</span>
          </div>
          <p className="text-xs text-slate-400">They'll be asked to set their own password on first login.</p>
          <button onClick={onDone} className="btn-primary w-full">Done</button>
        </div>
      </Modal>
    );
  }
  return (
    <Modal open onClose={onClose} title="Add a Student">
      <form onSubmit={submit} className="space-y-3">
        <Field label="Student ID"><input className="input" value={f.school_id} onChange={set('school_id')} /></Field>
        <Field label="Full name"><input className="input" value={f.full_name} onChange={set('full_name')} /></Field>
        <Field label="School email"><input type="email" className="input" value={f.email} onChange={set('email')} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Program"><input className="input" value={f.program} onChange={set('program')} /></Field>
          <Field label="Year level"><input className="input" value={f.year_level} onChange={set('year_level')} /></Field>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={busy} className="btn-primary w-full">{busy ? 'Adding…' : 'Add Student'}</button>
      </form>
    </Modal>
  );
}

function StudentDetailModal({ id, onClose, onChanged }) {
  const [d, setD] = useState(null); const [error, setError] = useState('');
  function load() { api.getStudent(id).then(setD).catch((e) => setError(e.message)); }
  useEffect(load, [id]);

  async function changeStatus(ojt_status) {
    try { await api.setStudentStatus(id, ojt_status); load(); onChanged(); } catch (e) { setError(e.message); }
  }

  if (!d) return <Modal open onClose={onClose} title="Loading…"><Spinner /></Modal>;
  return (
    <Modal open onClose={onClose} title={d.full_name} wide>
      <div className="space-y-4 text-sm">
        <ErrorBanner message={error} />
        <div className="grid grid-cols-2 gap-3">
          <div><p className="text-slate-400">Student ID</p><p className="font-medium">{d.school_id}</p></div>
          <div><p className="text-slate-400">Email</p><p className="font-medium">{d.email}</p></div>
          <div><p className="text-slate-400">Program</p><p className="font-medium">{d.program} {d.year_level}</p></div>
          <div><p className="text-slate-400">Company</p><p className="font-medium">{d.company_name || 'Not placed'}{d.is_partner === 0 && d.company_name ? ' (non-partner)' : ''}</p></div>
          <div><p className="text-slate-400">Supervisor</p><p className="font-medium">{d.supervisor_name || '—'}</p></div>
          <div><p className="text-slate-400">Progress</p><p className="font-medium">{d.completed_hours} / {d.required_hours} hrs ({d.progress_percent || 0}%)</p></div>
        </div>

        <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-100 text-center">
          <div><p className="text-lg font-bold text-slate-800">{d.attendance.total_logs || 0}</p><p className="text-xs text-slate-400">Attendance logs</p></div>
          <div><p className="text-lg font-bold text-slate-800">{d.tasks.completed || 0}</p><p className="text-xs text-slate-400">Tasks done</p></div>
          <div><p className="text-lg font-bold text-slate-800">{d.documents.approved || 0}</p><p className="text-xs text-slate-400">Docs approved</p></div>
        </div>

        <div className="pt-2 border-t border-slate-100">
          <p className="text-xs text-slate-400 mb-1">Change status</p>
          <div className="flex flex-wrap gap-2">
            {STATUSES.map((s) => <button key={s} onClick={() => changeStatus(s)} className={`badge border ${d.ojt_status === s ? 'bg-accent text-white border-accent' : 'border-slate-200 text-slate-500'}`}>{s.replace('_', ' ')}</button>)}
          </div>
        </div>

        {d.placements.length > 0 && (
          <div className="pt-2 border-t border-slate-100">
            <p className="text-xs text-slate-400 mb-1">Placement history</p>
            <div className="space-y-1">{d.placements.map((p) => <p key={p.placement_id} className="text-xs text-slate-500">{p.company_name || p.proposed_company_name} — {p.status} ({p.source.replace('_', ' ')})</p>)}</div>
          </div>
        )}
      </div>
    </Modal>
  );
}
