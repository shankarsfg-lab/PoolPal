import { useEffect, useState, useCallback } from 'react';
import { supabase, Ride, BookingWithDetails } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Avatar, StatusBadge, Spinner, EmptyState, ErrorBanner } from '@/components/ui';
import { UserCircle, MapPin, Calendar, Clock, Users, Check, X, MessageSquare, Loader2 } from 'lucide-react';

interface RideWithBookings {
  ride: Ride;
  bookings: BookingWithDetails[];
}

export function DriverDashboard() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<RideWithBookings[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    const { data: rides, error: re } = await supabase
      .from('rides')
      .select('*')
      .eq('driver_id', user.id)
      .order('departure_date', { ascending: true })
      .order('departure_time', { ascending: true });
    if (re) { setError(re.message); setLoading(false); return; }
    if (!rides || rides.length === 0) {
      setGroups([]); setLoading(false); return;
    }
    const rideIds = rides.map((r) => r.id);
    const { data: reqs, error: qe } = await supabase
      .from('bookings')
      .select('*, passenger:profiles!bookings_passenger_id_fkey(*)')
      .in('ride_id', rideIds)
      .order('created_at', { ascending: false });
    if (qe) { setError(qe.message); setLoading(false); return; }
    const grouped: RideWithBookings[] = rides.map((ride) => ({
      ride: ride as Ride,
      bookings: (reqs ?? []).filter((r) => r.ride_id === ride.id) as BookingWithDetails[],
    }));
    setGroups(grouped);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  async function handleAccept(bookingId: string) {
    setActionId(bookingId);
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'accepted' })
      .eq('id', bookingId);
    if (error) {
      alert('Accept Error: ' + error.message);
    } else {
      await fetchRequests();
    }
    setActionId(null);
  }

  async function handleReject(bookingId: string) {
    setActionId(bookingId);
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'rejected' })
      .eq('id', bookingId);
    if (error) {
      alert('Reject Error: ' + error.message);
    } else {
      await fetchRequests();
    }
    setActionId(null);
  }

  if (loading) return <div className="max-w-2xl mx-auto"><Spinner /></div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-5">
      <h1 className="text-xl font-bold text-slate-900 mb-1">Driver dashboard</h1>
      <p className="text-xs text-slate-500 mb-4">Manage ride requests from passengers.</p>

      {error && <ErrorBanner message={error} />}

      {groups.length === 0 ? (
        <EmptyState
          icon={<UserCircle className="w-6 h-6" />}
          title="No rides posted yet"
          subtitle="Offer a ride first, then incoming seat requests will appear here for you to accept or reject."
        />
      ) : (
        <div className="space-y-4">
          {groups.map(({ ride, bookings }) => {
            const pending = bookings.filter((r) => r.status === 'pending');
            const full = ride.status === 'Full' || ride.available_seats <= 0;
            return (
              <div key={ride.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Calendar className="w-3.5 h-3.5" />{ride.departure_date}
                      <span className="text-slate-300">·</span>
                      <Clock className="w-3.5 h-3.5" />{formatTime(ride.departure_time)}
                    </div>
                    <StatusBadge status={ride.status} />
                  </div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <MapPin className="w-4 h-4 text-sky-500" />
                    <span className="truncate">{ride.origin}</span>
                    <span className="text-slate-300">→</span>
                    <MapPin className="w-4 h-4 text-emerald-500" />
                    <span className="truncate">{ride.destination}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                    <Users className="w-3.5 h-3.5" />
                    {ride.available_seats} of {ride.total_seats} seats remaining
                    {pending.length > 0 && (
                      <span className="ml-2 inline-flex items-center gap-1 text-amber-600 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        {pending.length} pending
                      </span>
                    )}
                  </div>
                </div>

                {bookings.length === 0 ? (
                  <p className="px-4 py-5 text-sm text-slate-400 text-center">No requests yet for this ride.</p>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {bookings.map((req) => (
                      <li key={req.id} className="p-4">
                        <div className="flex items-start gap-3">
                          <Avatar profile={req.passenger} size="md" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-semibold text-slate-900 text-sm truncate">
                                {req.passenger?.full_name || 'Passenger'}
                              </p>
                              <StatusBadge status={req.status} />
                            </div>
                            {req.pickup_note ? (
                              <div className="mt-1.5 flex items-start gap-1.5">
                                <MessageSquare className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                                <p className="text-xs text-slate-600">{req.pickup_note}</p>
                              </div>
                            ) : (
                              <p className="mt-1.5 text-xs text-slate-400 italic">No pickup note provided</p>
                            )}
                          </div>
                        </div>

                        {req.status === 'pending' && (
                          <div className="mt-3.5 pt-3 border-t border-slate-100">
                            <p className="text-xs text-slate-500 mb-2.5 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                              Awaiting your decision
                            </p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleReject(req.id)}
                                disabled={actionId === req.id}
                                className="flex-1 py-2.5 rounded-xl border-2 border-slate-200 text-slate-700 font-semibold text-sm flex items-center justify-center gap-1.5 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 active:scale-[0.98] transition disabled:opacity-60 disabled:hover:border-slate-200 disabled:hover:bg-transparent disabled:hover:text-slate-700"
                              >
                                {actionId === req.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-4 h-4" />}
                                Reject
                              </button>
                              <button
                                onClick={() => handleAccept(req.id)}
                                disabled={actionId === req.id || full}
                                className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm flex items-center justify-center gap-1.5 active:scale-[0.98] transition disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-emerald-500"
                              >
                                {actionId === req.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-4 h-4" />}
                                Accept
                              </button>
                            </div>
                          </div>
                        )}
                        {req.status === 'pending' && full && (
                          <p className="mt-2 text-xs text-rose-500">Ride is full — accepting is disabled.</p>
                        )}
                        {req.status === 'accepted' && (
                          <p className="mt-2 text-xs text-emerald-600 font-medium">Seat confirmed for this passenger.</p>
                        )}
                        {req.status === 'rejected' && (
                          <p className="mt-2 text-xs text-slate-400">You declined this request.</p>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number);
  if (isNaN(h)) return t;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hr = h % 12 === 0 ? 12 : h % 12;
  return `${hr}:${String(m).padStart(2, '0')} ${ampm}`;
}
