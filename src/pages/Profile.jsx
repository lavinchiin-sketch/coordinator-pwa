import React, { useState } from 'react';
import { api, auth } from '../api';
import { ErrorBanner, SuccessBanner, Field } from '../components/ui.jsx';

export default function Profile({ user }) {
  const [fullName, setFullName] = useState(user.full_name);
  const [phone, setPhone] = useState(user.phone_number || '');
  const [current, setCurrent] = useState(''); const [next, setNext] = useState(''); const [confirm, setConfirm] = useState('');
  const [error, setError] = useState(''); const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false);

  async function saveProfile(e) {
    e.preventDefault(); setError(''); setMessage(''); setBusy(true);
    try { const u = await api.updateMe({ full_name: fullName, phone_number: phone }); auth.setUser(u); setMessage('Profile updated.'); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  async function savePassword(e) {
    e.preventDefault(); setError(''); setMessage('');
    if (next.length < 8) return setError('New password must be at least 8 characters.');
    if (next !== confirm) return setError('Passwords do not match.');
    setBusy(true);
    try { await api.changePassword(current, next); setMessage('Password updated.'); setCurrent(''); setNext(''); setConfirm(''); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  }

  return (
    <div className="max-w-xl space-y-5">
      <h1 className="text-xl font-bold text-slate-800">Profile</h1>
      <ErrorBanner message={error} /><SuccessBanner message={message} />
      <form onSubmit={saveProfile} className="card p-5 space-y-3">
        <h2 className="font-semibold text-slate-800 text-sm">Account Details</h2>
        {user.school_id && <p className="text-xs text-slate-400">School ID: {user.school_id}</p>}
        <p className="text-xs text-slate-400">Email: {user.email}</p>
        <Field label="Full name"><input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} /></Field>
        <Field label="Phone number"><input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
        <button type="submit" disabled={busy} className="btn-primary">Save</button>
      </form>
      <form onSubmit={savePassword} className="card p-5 space-y-3">
        <h2 className="font-semibold text-slate-800 text-sm">Change Password</h2>
        <Field label="Current password"><input type="password" className="input" value={current} onChange={(e) => setCurrent(e.target.value)} /></Field>
        <Field label="New password"><input type="password" className="input" value={next} onChange={(e) => setNext(e.target.value)} /></Field>
        <Field label="Confirm new password"><input type="password" className="input" value={confirm} onChange={(e) => setConfirm(e.target.value)} /></Field>
        <button type="submit" disabled={busy} className="btn-primary">Update password</button>
      </form>
    </div>
  );
}
