import React, { useEffect, useState } from 'react';
import { auth, api } from './api';
import Login from './pages/Login.jsx';
import ForcePasswordChange from './pages/ForcePasswordChange.jsx';
import AppShell from './components/AppShell.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Students from './pages/Students.jsx';
import Placements from './pages/Placements.jsx';
import Companies from './pages/Companies.jsx';
import Users from './pages/Users.jsx';
import Requirements from './pages/Requirements.jsx';
import Documents from './pages/Documents.jsx';
import Complaints from './pages/Complaints.jsx';
import Reports from './pages/Reports.jsx';
import Notifications from './pages/Notifications.jsx';
import Profile from './pages/Profile.jsx';

const PAGES = {
  dashboard: Dashboard, students: Students, placements: Placements, companies: Companies, users: Users,
  requirements: Requirements, documents: Documents, complaints: Complaints, reports: Reports,
  notifications: Notifications, profile: Profile,
};

export default function App() {
  const [user, setUser] = useState(auth.getUser());
  const [view, setView] = useState('dashboard');
  const [unread, setUnread] = useState(0);
  const [pendingPlacements, setPendingPlacements] = useState(0);

  useEffect(() => { setUser(auth.getUser()); }, []);
  useEffect(() => {
    if (!user || user.must_change_password) return;
    const load = () => {
      api.unreadCount().then((d) => setUnread(d.unread)).catch(() => {});
      api.listPlacements({ status: 'pending', limit: 1 }).then((d) => setPendingPlacements(d.total)).catch(() => {});
    };
    load(); const t = setInterval(load, 30000); return () => clearInterval(t);
  }, [user, view]);

  if (!user) return <Login onLogin={setUser} />;
  if (user.must_change_password) return <ForcePasswordChange user={user} onDone={setUser} />;

  const NAV = [
    { key: 'dashboard', label: 'Dashboard', icon: '⌂' },
    { key: 'students', label: 'Students', icon: '🎓' },
    { key: 'placements', label: 'Placements', icon: '📋', count: pendingPlacements },
    { key: 'companies', label: 'Companies', icon: '🏢' },
    { key: 'users', label: 'Supervisors & Staff', icon: '👥' },
    { key: 'requirements', label: 'Requirements', icon: '📄' },
    { key: 'documents', label: 'Document Review', icon: '🗂' },
    { key: 'complaints', label: 'Complaints', icon: '!' },
    { key: 'reports', label: 'Analytics & Reports', icon: '📊' },
    { key: 'notifications', label: 'Notifications', icon: '🔔', count: unread },
    { key: 'profile', label: 'Profile', icon: '⚙' },
  ];
  const Page = PAGES[view] || Dashboard;
  return (
    <AppShell appName="INTERNet" accentLabel="Coordinator Console" navItems={NAV} active={view} onNavigate={setView}
      user={user} onLogout={() => { auth.setToken(null); auth.setUser(null); setUser(null); }}>
      <Page user={user} navigate={setView} />
    </AppShell>
  );
}
