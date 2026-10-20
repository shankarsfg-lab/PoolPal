import { useState, FormEvent } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { CarFront, MapPin, Calendar, Clock, Users, Fuel, Loader2, CheckCircle2 } from 'lucide-react';

export function OfferRide({ onDone }: { onDone: () => void }) {
  const { user } = useAuth();
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [seats, setSeats] = useState(3);
  const [fuelNote, setFuelNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!user) return;
    if (!origin.trim() || !destination.trim() || !date || !time) {
      setError('Please fill in origin, destination, date, and time.');
      return;
    }
    if (seats < 1) {
      setError('There must be at least 1 seat.');
      return;
    }
    setBusy(true);
    const { error: insertErr } = await supabase.from('rides').insert({
      driver_id: user.id,
      origin: origin.trim(),
      destination: destination.trim(),
      departure_date: date,
      departure_time: time,
      total_seats: seats,
      available_seats: seats,
      fuel_note: fuelNote.trim(),
      status: 'Open',
    });
    setBusy(false);
    if (insertErr) {
      setError(insertErr.message);
      return;
    }
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      reset();
      onDone();
    }, 1100);
  }

  function reset() {
    setOrigin(''); setDestination(''); setDate(''); setTime('');
    setSeats(3); setFuelNote('');
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Ride posted!</h2>
        <p className="text-sm text-slate-500 mt-1">Passengers can now request seats on your trip.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center">
          <CarFront className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Offer a ride</h1>
          <p className="text-xs text-slate-500">Post your trip and let passengers join you.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Origin" icon={<MapPin className="w-4 h-4 text-sky-500" />}>
            <input
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              placeholder="Pickup city"
              className={inputCls}
            />
          </Field>
          <Field label="Destination" icon={<MapPin className="w-4 h-4 text-emerald-500" />}>
            <input
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Drop-off city"
              className={inputCls}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Date" icon={<Calendar className="w-4 h-4 text-slate-400" />}>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Departure time" icon={<Clock className="w-4 h-4 text-slate-400" />}>
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={inputCls} />
          </Field>
        </div>

        <Field label="Total seats" icon={<Users className="w-4 h-4 text-slate-400" />}>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setSeats((s) => Math.max(1, s - 1))} className="w-9 h-9 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 text-lg leading-none">−</button>
            <span className="w-12 text-center font-semibold text-slate-900">{seats}</span>
            <button type="button" onClick={() => setSeats((s) => Math.min(8, s + 1))} className="w-9 h-9 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 text-lg leading-none">+</button>
            <span className="text-xs text-slate-400 ml-1">max 8</span>
          </div>
        </Field>

        <Field label="Fuel cost sharing note" icon={<Fuel className="w-4 h-4 text-slate-400" />} optional>
          <textarea
            value={fuelNote}
            onChange={(e) => setFuelNote(e.target.value)}
            rows={2}
            placeholder="e.g. ~$5 per person, or 'Free / optional fuel share off-platform'"
            className={`${inputCls} resize-none`}
          />
        </Field>

        {error && (
          <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{error}</p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full bg-sky-500 hover:bg-sky-600 text-white font-semibold py-3 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {busy && <Loader2 className="w-4 h-4 animate-spin" />}
          Post Ride
        </button>
      </form>
    </div>
  );
}

const inputCls =
  'w-full rounded-xl border border-slate-300 pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent';

function Field({
  label,
  icon,
  optional,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1.5">
        {label} {optional && <span className="text-slate-400">(optional)</span>}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-3 flex items-center justify-center">{icon}</span>
        {children}
      </div>
    </div>
  );
}
