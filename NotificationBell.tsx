import { useState, useRef, useEffect, useCallback } from 'react';
import { supabase, Notification } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Bell, BellOff } from 'lucide-react';

export function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  // Snapshot of unread notification IDs captured when the menu opens,
  // so blue dots persist on items until the menu closes even though the
  // badge count is cleared immediately.
  const [seenOnOpen, setSeenOnOpen] = useState<Set<string>>(new Set());
  const ref = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30);
    if (error) return;
    const list = (data ?? []) as Notification[];
    setNotifications(list);
    setUnreadCount(list.filter((n) => !n.is_read).length);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Subscribe to realtime inserts/updates on notifications for this user.
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const n = payload.new as Notification;
          setNotifications((prev) =>
            [n, ...prev.filter((p) => p.id !== n.id)].slice(0, 30)
          );
          setUnreadCount((c) => c + (n.is_read ? 0 : 1));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const n = payload.new as Notification;
          setNotifications((prev) =>
            prev.map((p) => (p.id === n.id ? n : p))
          );
          setUnreadCount((c) => Math.max(0, c - (n.is_read ? 1 : 0)));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Close dropdown when clicking outside.
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  // Clear the "seen on open" snapshot when the menu closes.
  useEffect(() => {
    if (!open) setSeenOnOpen(new Set());
  }, [open]);

  async function handleBellClick() {
    const willOpen = !open;
    setOpen(willOpen);
    if (!willOpen || !user || unreadCount === 0) return;

    // Snapshot which items were unread so blue dots persist while open.
    setSeenOnOpen(
      new Set(notifications.filter((n) => !n.is_read).map((n) => n.id))
    );
    // Clear the badge immediately for instant visual feedback.
    setUnreadCount(0);

    // Mark all unread as read in the database.
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);
  }

  function isDotVisible(n: Notification) {
    return !n.is_read || seenOnOpen.has(n.id);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleBellClick}
        aria-label="Notifications"
        className="relative p-2 rounded-full hover:bg-slate-100 transition"
      >
        <Bell className="w-5 h-5 text-slate-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <h3 className="font-semibold text-sm text-slate-900">Notifications</h3>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="px-4 py-8 text-center text-xs text-slate-400">
                Loading...
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-8 flex flex-col items-center text-center">
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mb-2">
                  <BellOff className="w-5 h-5" />
                </div>
                <p className="text-xs text-slate-500">No notifications yet</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-50">
                {notifications.map((n) => {
                  const dot = isDotVisible(n);
                  return (
                    <li
                      key={n.id}
                      className={`px-4 py-3 flex gap-3 ${dot ? 'bg-sky-50/40' : ''}`}
                    >
                      <span className="mt-1.5 w-2 flex-shrink-0">
                        {dot && (
                          <span className="block w-2 h-2 rounded-full bg-sky-500" />
                        )}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {n.title}
                        </p>
                        <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                          {n.message}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1">
                          {formatRelative(n.created_at)}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function formatRelative(iso: string) {
  const then = new Date(iso).getTime();
  if (isNaN(then)) return '';
  const diff = Date.now() - then;
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'Just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return new Date(iso).toLocaleDateString();
}
