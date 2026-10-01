import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { Spinner, ErrorBanner } from '../components/ui.jsx';

export default function Dashboard({ navigate }) {
  const [d, setD] = useState(null); const [error, setError] = useState('');
  useEffect(() => { api.coordinatorDashboard().then(setD).catch((e) => setError(e.message)); }, []);
  if (error) return <ErrorBanner message={error} />;
  if (!d) return <Spinner />;
  const s = d.students; const p = d.pending;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-sm text-slate-500">{d.term ? `${d.term.school_year} · ${d.term.semester}` : 'No active term set'}</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card label="Total Students" value={s.total} onClick={() => navigate('students')} />
        <Card label="Ongoing OJT" value={s.ongoing} tone="green" onClick={() => navigate('students')} />
        <Card label="Need Placement" value={s.looking + s.not_started} tone="amber" onClick={() => navigate('students')} />
        <Card label="Pending Approvals" value={p.placements} tone="amber" onClick={() => navigate('placements')} />
        <Card label="Flagged Logs" value={p.flagged_logs} tone="red" onClick={() => navigate('students')} />
        <Card label="Open Complaints" value={p.complaints} tone="amber" onClick={() => navigate('complaints')} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <button onClick={() => navigate('students')} className="card p-5 text-left hover:border-accent transition">
          <p className="font-semibold text-slate-800">Import students</p>
          <p className="text-sm text-slate-500 mt-1">Add many students at once by Student ID + school email.</p>
        </button>
        <button onClick={() => navigate('placements')} className="card p-5 text-left hover:border-accent transition">
          <p className="font-semibold text-slate-800">Review placement requests</p>
          <p className="text-sm text-slate-500 mt-1">{p.placements} student(s) proposed their own OJT company.</p>
        </button>
        <button onClick={() => navigate('reports')} className="card p-5 text-left hover:border-accent transition">
          <p className="font-semibold text-slate-800">View analytics</p>
          <p className="text-sm text-slate-500 mt-1">Attendance, complaints, and company ratings.</p>
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h2 className="font-semibold text-slate-800 text-sm mb-3">Students by Program</h2>
          {d.byProgram.length === 0 ? <p className="text-sm text-slate-400">No data yet.</p> : (
            <div className="space-y-2">
              {d.byProgram.map((p) => (
                <div key={p.program}>
                  <div className="flex justify-between text-xs text-slate-500 mb-1"><span>{p.program}</span><span>{p.students} students · {p.avg_progress || 0}% avg</span></div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-accent" style={{ width: `${Math.min(100, p.avg_progress || 0)}%` }} /></div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="card p-5">
          <h2 className="font-semibold text-slate-800 text-sm mb-3">Recent Activity</h2>
          {d.activity.length === 0 ? <p className="text-sm text-slate-400">No activity yet.</p> : (
            <div className="space-y-2 text-sm">
              {d.activity.map((a) => (
                <div key={a.log_id} className="flex justify-between border-b border-slate-50 last:border-0 pb-2">
                  <span className="text-slate-600">{a.action.replace(/\./g, ' ')} {a.details ? `— ${a.details}` : ''}</span>
                  <span className="text-xs text-slate-400 whitespace-nowrap ml-2">{new Date(a.created_at).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Card({ label, value, tone, onClick }) {
  const cls = { green: 'border-emerald-200 bg-emerald-50', amber: 'border-amber-200 bg-amber-50', red: 'border-red-200 bg-red-50' }[tone] || 'border-slate-100 bg-white';
  return (
    <button onClick={onClick} className={`card p-4 text-left hover:shadow-md transition ${cls}`}>
      <p className="text-2xl font-bold text-slate-800">{value}</p><p className="text-xs text-slate-500 mt-1">{label}</p>
    </button>
  );
}
