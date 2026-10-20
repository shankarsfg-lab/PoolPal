import { Profile } from '@/lib/supabase';

const COLOR_MAP: Record<string, string> = {
  sky: 'bg-sky-500',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  rose: 'bg-rose-500',
  violet: 'bg-violet-500',
  teal: 'bg-teal-500',
  indigo: 'bg-indigo-500',
  cyan: 'bg-cyan-500',
};

export function Avatar({ profile, size = 'md' }: { profile: Profile | null; size?: 'sm' | 'md' | 'lg' }) {
  const dims = size === 'sm' ? 'w-8 h-8 text-xs' : size === 'lg' ? 'w-14 h-14 text-lg' : 'w-10 h-10 text-sm';
  const colorClass = COLOR_MAP[profile?.avatar_color ?? 'sky'] ?? 'bg-sky-500';
  const initials = (profile?.full_name || '?')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <div className={`${dims} ${colorClass} rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0`}>
      {initials}
    </div>
  );
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
  Open: 'Open',
  Full: 'Full',
};

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700 border-amber-200',
    accepted: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    rejected: 'bg-rose-100 text-rose-700 border-rose-200',
    cancelled: 'bg-slate-200 text-slate-600 border-slate-300',
    Open: 'bg-sky-100 text-sky-700 border-sky-200',
    Full: 'bg-slate-200 text-slate-600 border-slate-300',
  };
  const label = STATUS_LABELS[status] ?? status;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${map[status] ?? 'bg-slate-100 text-slate-600 border-slate-200'}`}>
      {label}
    </span>
  );
}

export function EmptyState({
  icon,
  title,
  subtitle,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-slate-800">{title}</h3>
      {subtitle && <p className="text-sm text-slate-500 mt-1 max-w-xs">{subtitle}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Spinner() {
  return (
    <div className="flex items-center justify-center py-20 text-slate-400">
      <div className="w-6 h-6 border-2 border-slate-300 border-t-sky-500 rounded-full animate-spin" />
    </div>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="mx-4 my-3 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3.5 py-3">
      {message}
    </div>
  );
}
