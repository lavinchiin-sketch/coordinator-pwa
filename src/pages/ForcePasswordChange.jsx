import React, { useState } from 'react';
import { api, auth } from '../api';

// Shown right after login when the account still has a temporary/default password
// (bulk-imported students, newly created supervisors, or a coordinator reset).
export default function ForcePasswordChange({ user, onDone }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (next.length < 8) return setError('New password must be at least 8 characters.');
    if (next !== confirm) return setError('Passwords do not match.');
    setLoading(true);
    try {
      const res = await api.changePassword(current, next);
      auth.setUser(res.user);
      onDone(res.user);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
      <div className="w-full max-w-sm card p-6 space-y-4">
        <div>
          <h1 className="font-bold text-slate-800 text-lg">Set a new password</h1>
          <p className="text-sm text-slate-500 mt-1">For security, please set your own password before continuing, {user.full_name.split(' ')[0]}.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="block"><span className="text-sm text-slate-600">Current (temporary) password</span>
            <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} className="input mt-1" required /></label>
          <label className="block"><span className="text-sm text-slate-600">New password</span>
            <input type="password" value={next} onChange={(e) => setNext(e.target.value)} className="input mt-1" required /></label>
          <label className="block"><span className="text-sm text-slate-600">Confirm new password</span>
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="input mt-1" required /></label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? 'Saving…' : 'Continue'}</button>
        </form>
      </div>
    </div>
  );
}
