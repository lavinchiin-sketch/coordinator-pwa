import React from 'react';
import { api } from '../api';
import { usePagedList } from '../hooks.js';
import { Spinner, EmptyState, Pagination, ErrorBanner } from '../components/ui.jsx';

export default function Notifications() {
  const { list, page, setPage, error, reload } = usePagedList(api.listNotifications);

  async function markAll() { await api.markAllRead(); reload(); }
  async function open(n) { if (!n.is_read) await api.markRead(n.notification_id); reload(); }

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">Notifications</h1>
        <button onClick={markAll} className="text-xs text-accent font-medium">Mark all read</button>
      </div>
      <ErrorBanner message={error} />
      {!list ? <Spinner /> : list.data.length === 0 ? <EmptyState icon="🔔" title="No notifications" /> : (
        <div className="card divide-y divide-slate-50">
          {list.data.map((n) => (
            <button key={n.notification_id} onClick={() => open(n)} className={`w-full text-left p-4 ${n.is_read ? '' : 'bg-blue-50/50'}`}>
              <p className="text-sm font-medium text-slate-700">{n.title}</p>
              <p className="text-sm text-slate-500">{n.message}</p>
              <p className="text-xs text-slate-400 mt-1">{new Date(n.created_at).toLocaleString()}</p>
            </button>
          ))}
        </div>
      )}
      {list && <Pagination page={list.page} pages={list.pages} onChange={setPage} />}
    </div>
  );
}
