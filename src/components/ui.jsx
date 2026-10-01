import React from 'react';

export function StatusBadge({ status, map }) {
  const styles = map || {
    pending: 'bg-amber-100 text-amber-700', verified: 'bg-emerald-100 text-emerald-700', flagged: 'bg-red-100 text-red-700',
    approved: 'bg-emerald-100 text-emerald-700', rejected: 'bg-red-100 text-red-700', assigned: 'bg-blue-100 text-blue-700',
    submitted: 'bg-amber-100 text-amber-700', revision: 'bg-orange-100 text-orange-700', completed: 'bg-emerald-100 text-emerald-700',
    open: 'bg-amber-100 text-amber-700', under_review: 'bg-blue-100 text-blue-700', resolved: 'bg-emerald-100 text-emerald-700',
    dismissed: 'bg-slate-100 text-slate-500', not_started: 'bg-slate-100 text-slate-500', looking: 'bg-blue-100 text-blue-700',
    pending_approval: 'bg-amber-100 text-amber-700', ongoing: 'bg-emerald-100 text-emerald-700', dropped: 'bg-red-100 text-red-700',
    cancelled: 'bg-slate-100 text-slate-500', active: 'bg-emerald-100 text-emerald-700', inactive: 'bg-slate-100 text-slate-500',
  };
  return <span className={`badge ${styles[status] || 'bg-slate-100 text-slate-600'}`}>{String(status || '').replace(/_/g, ' ')}</span>;
}

export function EmptyState({ icon = '—', title, hint }) {
  return (
    <div className="text-center py-10 text-slate-400">
      <div className="text-3xl mb-2">{icon}</div>
      <p className="text-sm font-medium text-slate-500">{title}</p>
      {hint && <p className="text-xs mt-1">{hint}</p>}
    </div>
  );
}

export function Spinner({ label = 'Loading…' }) {
  return <div className="flex items-center gap-2 text-sm text-slate-400 py-6 justify-center"><span className="animate-spin inline-block w-4 h-4 border-2 border-slate-300 border-t-accent rounded-full" />{label}</div>;
}

export function ErrorBanner({ message }) {
  if (!message) return null;
  return <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 mb-3">{message}</div>;
}
export function SuccessBanner({ message }) {
  if (!message) return null;
  return <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg p-3 mb-3">{message}</div>;
}

export function Modal({ open, onClose, title, children, wide }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className={`relative bg-white rounded-t-2xl md:rounded-2xl shadow-xl w-full ${wide ? 'md:max-w-2xl' : 'md:max-w-md'} max-h-[90vh] overflow-y-auto`}>
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white">
          <h3 className="font-semibold text-slate-800">{title}</h3>
          <button onClick={onClose} className="text-slate-400 text-xl leading-none">×</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function Field({ label, children, hint }) {
  return (
    <label className="block">
      <span className="text-sm text-slate-600 font-medium">{label}</span>
      <div className="mt-1">{children}</div>
      {hint && <span className="text-xs text-slate-400">{hint}</span>}
    </label>
  );
}

export function Pagination({ page, pages, onChange }) {
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 pt-4 text-sm">
      <button disabled={page <= 1} onClick={() => onChange(page - 1)} className="btn-secondary px-3 py-1.5 disabled:opacity-40">‹ Prev</button>
      <span className="text-slate-500">Page {page} of {pages}</span>
      <button disabled={page >= pages} onClick={() => onChange(page + 1)} className="btn-secondary px-3 py-1.5 disabled:opacity-40">Next ›</button>
    </div>
  );
}

export function StarRating({ value, onChange, readOnly }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" disabled={readOnly} onClick={() => onChange && onChange(n)}
          className={`text-2xl leading-none ${n <= value ? 'text-amber-400' : 'text-slate-200'} ${readOnly ? '' : 'cursor-pointer'}`}>★</button>
      ))}
    </div>
  );
}
