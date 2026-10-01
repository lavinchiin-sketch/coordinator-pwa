import React, { useState } from 'react';

// One responsive shell: a persistent sidebar on md+ screens (real desktop/web use),
// collapsing to a top bar + slide-in drawer on small screens — so installing this
// on a phone adapts the layout instead of just shrinking a fixed-width card.
export default function AppShell({ appName, accentLabel, navItems, active, onNavigate, user, onLogout, badge, children }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const go = (key) => { onNavigate(key); setDrawerOpen(false); };

  const NavList = ({ onClickItem }) => (
    <nav className="flex-1 px-2 space-y-1 overflow-y-auto">
      {navItems.map((item) => (
        <button
          key={item.key}
          onClick={() => onClickItem(item.key)}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition text-left ${
            active === item.key ? 'bg-accent/10 text-accent font-semibold' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span className="w-5 text-center text-base">{item.icon}</span>
          <span className="flex-1">{item.label}</span>
          {item.count > 0 && (
            <span className={`text-xs rounded-full px-1.5 py-0.5 ${active === item.key ? 'bg-accent text-white' : 'bg-slate-200 text-slate-600'}`}>{item.count}</span>
          )}
        </button>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col w-64 shrink-0 border-r border-slate-200 bg-white min-h-screen sticky top-0 h-screen">
        <div className="px-5 py-5 border-b border-slate-100">
          <p className="font-bold text-slate-800 leading-none">{appName}</p>
          <p className="text-xs text-slate-400 mt-1">{accentLabel}</p>
        </div>
        <NavList onClickItem={go} />
        <UserFooter user={user} onLogout={onLogout} />
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setDrawerOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 bg-white flex flex-col shadow-xl">
            <div className="px-5 py-5 border-b border-slate-100 flex items-center justify-between">
              <div><p className="font-bold text-slate-800 leading-none">{appName}</p><p className="text-xs text-slate-400 mt-1">{accentLabel}</p></div>
              <button onClick={() => setDrawerOpen(false)} className="text-slate-400 text-xl leading-none px-2">×</button>
            </div>
            <NavList onClickItem={go} />
            <UserFooter user={user} onLogout={onLogout} />
          </aside>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top bar (all sizes) */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
          <div className="px-4 md:px-6 h-14 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button onClick={() => setDrawerOpen(true)} className="md:hidden text-slate-600 text-xl leading-none px-1" aria-label="Menu">☰</button>
              <p className="font-semibold text-slate-800 md:hidden truncate">{navItems.find((n) => n.key === active)?.label || appName}</p>
              <p className="hidden md:block text-sm text-slate-400">Welcome back, {user.full_name}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {badge}
            </div>
          </div>
        </header>

        {/* Content — fluid width, responsive padding, no forced narrow column */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-6 py-5">{children}</main>
      </div>
    </div>
  );
}

function UserFooter({ user, onLogout }) {
  return (
    <div className="px-4 py-4 border-t border-slate-100">
      <p className="text-sm font-medium text-slate-700 truncate">{user.full_name}</p>
      <p className="text-xs text-slate-400 truncate">{user.email}</p>
      <button onClick={onLogout} className="mt-2 text-xs text-slate-500 hover:text-red-600">Log out</button>
    </div>
  );
}
