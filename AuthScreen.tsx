import { useState, FormEvent } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Car, Loader2, ArrowLeft } from 'lucide-react';

export function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setBusy(true);
    const res =
      mode === 'signin'
        ? await signIn(email.trim(), password)
        : await signUp(email.trim(), password, fullName.trim() || 'Rider');
    setBusy(false);
    if (res.error) setError(res.error);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex flex-col">
      <div className="flex-1 flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-sm">
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-sky-500 text-white flex items-center justify-center shadow-lg shadow-sky-500/30 mb-3">
              <Car className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">PoolPal</h1>
            <p className="text-sm text-slate-500 mt-1">Share the ride, split the cost.</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex bg-slate-100 rounded-xl p-1 mb-5">
              <button
                type="button"
                onClick={() => { setMode('signin'); setError(null); }}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${
                  mode === 'signin' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setMode('signup'); setError(null); }}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${
                  mode === 'signup' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                }`}
              >
                Sign Up
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Full name</label>
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Alex Morgan"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent"
                />
              </div>

              {error && (
                <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={busy}
                className="w-full bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white font-semibold py-2.5 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                {mode === 'signin' ? 'Sign In' : 'Create Account'}
              </button>
            </form>
          </div>

          <button
            onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
            className="mt-4 w-full flex items-center justify-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {mode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
}
