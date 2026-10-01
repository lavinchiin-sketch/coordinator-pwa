import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { Spinner, ErrorBanner } from '../components/ui.jsx';

export default function Reports() {
  const [d, setD] = useState(null); const [error, setError] = useState('');
  useEffect(() => { api.reportsData().then(setD).catch((e) => setError(e.message)); }, []);
  if (error) return <ErrorBanner message={error} />;
  if (!d) return <Spinner />;

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-slate-800">Analytics & Reports</h1>
      <div className="grid md:grid-cols-2 gap-4">
        <ReportCard title="Attendance by Status"><BarList items={d.attendanceByStatus} colors={{ verified: 'bg-emerald-500', pending: 'bg-amber-500', flagged: 'bg-red-500' }} /></ReportCard>
        <ReportCard title="Students by OJT Status"><BarList items={d.studentsByStatus} /></ReportCard>
        <ReportCard title="Complaints by Category"><BarList items={d.complaintsByCategory} /></ReportCard>
        <ReportCard title="Complaints by Status"><BarList items={d.complaintsByStatus} colors={{ open: 'bg-amber-500', resolved: 'bg-emerald-500', dismissed: 'bg-slate-400', under_review: 'bg-blue-500' }} /></ReportCard>
        <ReportCard title="Placements: School-Assigned vs Self-Sourced"><BarList items={d.placementsBySource} /></ReportCard>
        <ReportCard title="Interns: Partner vs Non-Partner Companies"><BarList items={d.internsByPartnership} /></ReportCard>
        <ReportCard title="Tasks by Status"><BarList items={d.tasksByStatus} /></ReportCard>
        <ReportCard title="Progress by Program"><BarList items={d.progressByProgram} suffix="%" max={100} /></ReportCard>
        <ReportCard title="Avg. Supervisor Rating by Program" full><BarList items={d.avgRatingByProgram} max={5} suffix="/ 5" /></ReportCard>
        <ReportCard title="Avg. Company Rating (from students)" full>
          {d.avgRatingByCompany.length === 0 ? <p className="text-sm text-slate-400">No ratings yet.</p> : <BarList items={d.avgRatingByCompany} max={5} suffix="/ 5" />}
        </ReportCard>
      </div>
    </div>
  );
}

function ReportCard({ title, children, full }) {
  return <div className={`card p-5 ${full ? 'md:col-span-2' : ''}`}><h2 className="font-semibold text-slate-800 mb-4 text-sm">{title}</h2>{children}</div>;
}

function BarList({ items, colors = {}, max, suffix = '' }) {
  if (!items || items.length === 0) return <p className="text-sm text-slate-400">No data yet.</p>;
  const maxValue = max || Math.max(...items.map((i) => Number(i.value) || 0), 1);
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.label}>
          <div className="flex justify-between text-xs text-slate-500 mb-1"><span className="capitalize">{String(item.label).replace(/_/g, ' ')}</span><span>{item.value} {suffix}</span></div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className={`h-full rounded-full ${colors[item.label] || 'bg-accent'}`} style={{ width: `${Math.min(100, (Number(item.value) / maxValue) * 100)}%` }} /></div>
        </div>
      ))}
    </div>
  );
}
