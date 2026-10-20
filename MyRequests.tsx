import { useEffect, useState } from 'react';
import { supabase, BookingWithDetails } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Avatar, StatusBadge, Spinner, EmptyState } from '@/components/ui';
import { Inbox, MapPin, Calendar, Clock, Fuel, Phone, MessageSquare } from 'lucide-react';

export function MyRequests() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!user) return;
    setLoading(true);
    const { data, error: e } = await supabase
      .from('bookings')
      .select('*, ride:rides(*), passenger:profiles!bookings_passenger_id_fkey(*)')
      .eq('passenger_id', user.id)
      .order('created_at', { ascending: false });
    if (e) setError(e.message);
    setBookings((data ?? []) as BookingWithDetails[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) return <div className="max-w-2xl mx-auto"><Spinner /></div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-5">
      <h1 className="text-xl font-bold text-slate-900 mb-1">My requests</h1>
      <p className="text-xs text-slate-500 mb-4">Track the status of rides you've requested.</p>

      {error && (
        <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3.5 py-3 mb-4">{error}</div>
      )}

      {bookings.length === 0 ? (
        <EmptyState
          icon={<Inbox className="w-6 h-6" />}
          title="No requests yet"
          subtitle="When you request a seat on a ride, it will show up here with a live status."
        />
      ) : (
        <div className="space-y-3">
          {bookings.map((req) => {
            const ride = req.ride;
            const accepted = req.status === 'accepted';
            return (
              <div key={req.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Calendar className="w-3.5 h-3.5" />
                    {ride?.departure_date}
                    <span className="text-slate-300">·</span>
                    <Clock className="w-3.5 h-3.5" />
                    {ride ? formatTime(ride.departure_time) : ''}
                  </div>
                  <StatusBadge status={req.status} />
                </div>

                {ride && (
                  <div className="flex items-center gap-2 text-sm text-slate-800 font-medium mb-3">
                    <MapPin className="w-4 h-4 text-sky-500" />
                    <span className="truncate">{ride.origin}</span>
                    <span className="text-slate-300">→</span>
                    <MapPin className="w-4 h-4 text-emerald-500" />
                    <span className="truncate">{ride.destination}</span>
                  </div>
                )}

                {req.pickup_note && (
                  <div className="bg-slate-50 rounded-xl px-3 py-2 mb-3 flex items-start gap-2">
                    <MessageSquare className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-slate-600">{req.pickup_note}</p>
                  </div>
                )}

                {accepted ? (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3.5 py-3">
                    <p className="text-xs font-semibold text-emerald-700 mb-1.5">Your seat is confirmed</p>
                    {ride?.fuel_note && (
                      <p className="text-xs text-emerald-700/90 flex items-center gap-1.5 mb-1.5">
                        <Fuel className="w-3.5 h-3.5" />
                        {ride.fuel_note}
                      </p>
                    )}
                    <p className="text-xs text-emerald-700/90 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5" />
                      Contact your driver to coordinate pickup.
                    </p>
                  </div>
                ) : req.status === 'rejected' ? (
                  <p className="text-xs text-slate-500">The driver declined this request. Try searching for another ride.</p>
                ) : (
                  <p className="text-xs text-amber-600 font-medium flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    Waiting for the driver to respond
                  </p>
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
