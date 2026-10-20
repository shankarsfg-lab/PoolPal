import { useState, useEffect, FormEvent } from 'react';
import { supabase, RideWithDriver } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Avatar, StatusBadge, Spinner, EmptyState } from '@/components/ui';
import { RequestSeatModal } from '@/components/RequestSeatModal';
import { Search, MapPin, Clock, Users, Fuel, Calendar, X } from 'lucide-react';

export function FindRides() {
  const { user } = useAuth();
  const [rides, setRides] = useState<RideWithDriver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState('');
  const [activeRide, setActiveRide] = useState<RideWithDriver | null>(null);
  const [pendingRideIds, setPendingRideIds] = useState<Set<string>>(new Set());

  async function loadRides() {
    setLoading(true);
    setError(null);
    let q = supabase
      .from('rides')
      .select('*, driver:profiles!rides_driver_id_fkey(*)')
      .order('departure_date', { ascending: true })
      .order('departure_time', { ascending: true });

    if (origin.trim()) q = q.ilike('origin', `%${origin.trim()}%`);
    if (destination.trim()) q = q.ilike('destination', `%${destination.trim()}%`);
    if (date) q = q.eq('departure_date', date);

    const { data, error: e } = await q;
    if (e) {
      setError(e.message);
      setLoading(false);
      return;
    }
    setRides((data ?? []) as RideWithDriver[]);
    setLoading(false);
  }

  async function loadMyBookings() {
    if (!user) return;
    const { data } = await supabase
      .from('bookings')
      .select('ride_id, status')
      .eq('passenger_id', user.id)
      .eq('status', 'pending');
    setPendingRideIds(new Set((data ?? []).map((r) => r.ride_id)));
  }

  useEffect(() => {
    loadRides();
    loadMyBookings();
  }, []);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    loadRides();
  }

  function clearFilters() {
    setOrigin('');
    setDestination('');
    setDate('');
    loadRides();
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-5">
      <h1 className="text-xl font-bold text-slate-900 mb-3">Find a ride</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 mb-4">
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">From</label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  placeholder="Origin"
                  className="w-full rounded-xl border border-slate-300 pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">To</label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="Destination"
                  className="w-full rounded-xl border border-slate-300 pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent"
                />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Date</label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-slate-300 pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 bg-sky-500 hover:bg-sky-600 text-white font-semibold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition"
            >
              <Search className="w-4 h-4" />
              Search
            </button>
            {(origin || destination || date) && (
              <button
                type="button"
                onClick={clearFilters}
                className="px-3 py-2.5 rounded-xl border border-slate-300 text-slate-600 text-sm flex items-center gap-1 hover:bg-slate-50"
              >
                <X className="w-4 h-4" />
                Clear
              </button>
            )}
          </div>
        </div>
      </form>

      {error && (
        <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3.5 py-3 mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <Spinner />
      ) : rides.length === 0 ? (
        <EmptyState
          icon={<Search className="w-6 h-6" />}
          title="No rides found"
          subtitle="Try adjusting your search filters, or be the first to offer a ride on this route."
        />
      ) : (
        <div className="space-y-3">
          {rides.map((ride) => {
            const full = ride.status === 'Full' || ride.available_seats <= 0;
            const hasPending = pendingRideIds.has(ride.id);
            const isOwnRide = ride.driver_id === user?.id;
            const canRequest = !full && !isOwnRide;
            return (
              <div key={ride.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                <div className="flex items-start gap-3">
                  <Avatar profile={ride.driver} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-slate-900 text-sm truncate">
                        {ride.driver?.full_name || 'Driver'}
                      </p>
                      <StatusBadge status={ride.status} />
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {ride.departure_date} · {formatTime(ride.departure_time)}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2 text-sm text-slate-700">
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <MapPin className="w-4 h-4 text-sky-500 flex-shrink-0" />
                    <span className="truncate">{ride.origin}</span>
                  </div>
                  <div className="text-slate-300">→</div>
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <MapPin className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span className="truncate">{ride.destination}</span>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    {ride.available_seats} of {ride.total_seats} seats left
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Fuel className="w-3.5 h-3.5" />
                    {ride.fuel_note || 'Free / Optional fuel share off-platform'}
                  </span>
                </div>

                <div className="mt-3.5 pt-3 border-t border-slate-100">
                  {isOwnRide ? (
                    <p className="text-xs text-slate-400 italic">This is your ride</p>
                  ) : hasPending ? (
                    <button
                      disabled
                      className="w-full bg-slate-100 text-slate-500 font-semibold py-2.5 rounded-xl text-sm cursor-not-allowed"
                    >
                      Already Requested
                    </button>
                  ) : full ? (
                    <p className="text-xs text-slate-400 font-medium">Ride is full</p>
                  ) : (
                    <button
                      onClick={() => setActiveRide(ride)}
                      className="w-full bg-sky-500 hover:bg-sky-600 text-white font-semibold py-2.5 rounded-xl text-sm transition"
                    >
                      Request Seat
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeRide && (
        <RequestSeatModal
          ride={activeRide}
          onClose={() => setActiveRide(null)}
          onRequested={() => {
            setPendingRideIds((prev) => new Set(prev).add(activeRide.id));
            setActiveRide(null);
          }}
        />
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
