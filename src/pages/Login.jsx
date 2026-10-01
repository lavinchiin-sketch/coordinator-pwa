import React, { useState } from 'react';
import { api, auth } from '../api';

export default function Login({ onLogin }) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const data = await api.login(identifier.trim(), password);
      if (data.user.role !== 'coordinator') { setError('This is not a coordinator account.'); setLoading(false); return; }
      auth.setToken(data.token); auth.setUser(data.user); onLogin(data.user);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-[#0F1B33] flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-accent/20 mx-auto mb-4 flex items-center justify-center text-3xl">🎓</div>
          <h1 className="text-white text-2xl font-bold">INTERNet</h1>
          <p className="text-slate-400 text-sm mt-1">Coordinator Console</p>
        </div>
        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          <label className="block"><span className="text-sm font-medium text-slate-700">Email</span>
            <input type="email" value={identifier} onChange={(e) => setIdentifier(e.target.value)} className="input mt-1" required /></label>
          <label className="block"><span className="text-sm font-medium text-slate-700">Password</span>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input mt-1" required /></label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? 'Signing in…' : 'Sign in'}</button>
        </form>
      </div>
    </div>
  );
}
