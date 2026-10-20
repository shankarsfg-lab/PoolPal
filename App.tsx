import { useState } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { AuthScreen } from '@/components/AuthScreen';
import { Header, BottomNav, Tab } from '@/components/Header';
import { FindRides } from '@/components/FindRides';
import { OfferRide } from '@/components/OfferRide';
import { MyRequests } from '@/components/MyRequests';
import { DriverDashboard } from '@/components/DriverDashboard';
import { Spinner } from '@/components/ui';

function AppInner() {
  const { session, loading } = useAuth();
  const [tab, setTab] = useState<Tab>('find');

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-7 h-7 border-2 border-slate-300 border-t-sky-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) return <AuthScreen />;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header tab={tab} onTab={setTab} />
      <main className="pb-20 md:pb-8 min-h-[calc(100vh-3.5rem)]">
        {tab === 'find' && <FindRides />}
        {tab === 'offer' && <OfferRide onDone={() => setTab('dashboard')} />}
        {tab === 'requests' && <MyRequests />}
        {tab === 'dashboard' && <DriverDashboard />}
      </main>
      <BottomNav tab={tab} onTab={setTab} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
