import { useState, FormEvent, useEffect } from 'react';
import { supabase, RideWithDriver } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Avatar } from '@/components/ui';
import { X, MapPin, Clock, Users, Fuel, Loader2, CheckCircle2 } from 'lucide-react';

export function RequestSeatModal({
  ride,
  onClose,
  onRequested,
}: {
  ride: RideWithDriver;
  onClose: () => void;
  onRequested: () => void;
}) {
  const { user } = useAuth();
  const [pickupNote, setPickupNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    setError(null);
    const { error: insertErr } = await supabase.from('bookings').insert({
      ride_id: ride.id,
      passenger_id: user.id,
      pickup_note: pickupNote.trim(),
    });
    setBusy(false);
    if (insertErr) {
      setError(insertErr.message);
      return;
    }
    setSuccess(true);
    setTimeout(onRequested, 900);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-xl max-h-[90vh] overflow-y-auto animate-[slideUp_0.2s_ease-out]">
        <style>{`@keyframes slideUp { from { transform: translateY(20px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }`}</style>
        <div className="sticky top-0 bg-white px-5 pt-4 pb-3 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-900">Request a seat</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-100">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {success ? (
          <div className="px-6 py-12 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="font-semibold text-slate-900">Request sent!</h3>
            <p className="text-sm text-slate-500 mt-1">The driver will review your request shortly.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
            <div className="bg-slate-50 rounded-2xl p-3.5">
              <div className="flex items-center gap-3 mb-2.5">
                <Avatar profile={ride.driver} size="sm" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{ride.driver?.full_name || 'Driver'}</p>
                  <p className="text-xs text-slate-500">{ride.departure_date} · {formatTime(ride.departure_time)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <MapPin className="w-4 h-4 text-sky-500 flex-shrink-0" />
                <span className="truncate">{ride.origin}</span>
                <span className="text-slate-300">→</span>
                <MapPin className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span className="truncate">{ride.destination}</span>
              </div>
              <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{ride.available_seats} seat{ride.available_seats !== 1 ? 's' : ''} left</span>
                <span className="flex items-center gap-1"><Fuel className="w-3.5 h-3.5" />{ride.fuel_note || 'Free'}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Pickup note <span className="text-slate-400">(optional)</span>
              </label>
              <textarea
                value={pickupNote}
                onChange={(e) => setPickupNote(e.target.value)}
                rows={3}
                placeholder="e.g. I'll meet you at the bus stop on 5th Ave at 8:10 AM"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent resize-none"
              />
              <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                The driver sees your note and can accept or reject your request.
              </p>
            </div>

            {error && (
              <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{error}</p>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-600 font-medium text-sm hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="flex-1 bg-sky-500 hover:bg-sky-600 text-white font-semibold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                Send Request
              </button>
            </div>
          </form>
        )}
      </div>
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
