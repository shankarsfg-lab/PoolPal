import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Avatar } from '@/components/ui';
import { Car, Search, CarFront, Inbox, UserCircle, LogOut, Menu, X } from 'lucide-react';
import { NotificationBell } from '@/components/NotificationBell';

export type Tab = 'find' | 'offer' | 'requests' | 'dashboard';

const NAV: { key: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'find', label: 'Find Rides', icon: Search },
  { key: 'offer', label: 'Offer a Ride', icon: CarFront },
  { key: 'requests', label: 'My Requests', icon: Inbox },
  { key: 'dashboard', label: 'Driver Dashboard', icon: UserCircle },
];

export function Header({ tab, onTab }: { tab: Tab; onTab: (t: Tab) => void }) {
  const { profile, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-slate-200">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        <button onClick={() => onTab('find')} className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-sky-500 text-white flex items-center justify-center">
            <Car className="w-5 h-5" />
          </div>
          <span className="font-bold text-slate-900">PoolPal</span>
        </button>

        <nav className="hidden md:flex items-center gap-1">
          {NAV.map((n) => (
            <button
              key={n.key}
              onClick={() => onTab(n.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                tab === n.key ? 'bg-sky-50 text-sky-700' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <n.icon className="w-4 h-4" />
              {n.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <NotificationBell />

          <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2 rounded-full hover:bg-slate-100 p-1 pr-2 transition"
          >
            <Avatar profile={profile} size="sm" />
            {menuOpen ? <X className="w-4 h-4 text-slate-500" /> : <Menu className="w-4 h-4 text-slate-500" />}
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-2">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="text-sm font-semibold text-slate-800 truncate">
                  {profile?.full_name || 'Rider'}
                </p>
                <p className="text-xs text-slate-500 truncate">Signed in</p>
              </div>
              {NAV.map((n) => (
                <button
                  key={n.key}
                  onClick={() => { onTab(n.key); setMenuOpen(false); }}
                  className={`md:hidden w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left ${
                    tab === n.key ? 'text-sky-700 bg-sky-50' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <n.icon className="w-4 h-4" />
                  {n.label}
                </button>
              ))}
              <button
                onClick={() => signOut()}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left text-rose-600 hover:bg-rose-50 mt-1 border-t border-slate-100"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          )}
          </div>
        </div>
      </div>
    </header>
  );
}

export function BottomNav({ tab, onTab }: { tab: Tab; onTab: (t: Tab) => void }) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200">
      <div className="grid grid-cols-4">
        {NAV.map((n) => (
          <button
            key={n.key}
            onClick={() => onTab(n.key)}
            className={`flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium ${
              tab === n.key ? 'text-sky-600' : 'text-slate-400'
            }`}
          >
            <n.icon className={`w-5 h-5 ${tab === n.key ? 'text-sky-600' : 'text-slate-400'}`} />
            {n.label.split(' ')[0]}
          </button>
        ))}
      </div>
    </nav>
  );
}
