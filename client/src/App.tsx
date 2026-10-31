import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { HostDashboard } from './components/HostDashboard';
import { HostOnboarding } from './components/HostOnboarding';
import { GuestDashboard } from './components/GuestDashboard';
import { GuestOnboarding } from './components/GuestOnboarding';
import { AdminDashboard } from './components/AdminDashboard';
import { RefreshCw, Zap, Car, ShieldCheck, ArrowRight, UserCheck } from 'lucide-react';
import { UserRole } from './types';

export const MainApp: React.FC = () => {
  const { user, loading, hostProfile, guestProfile, switchRole, refreshProfile } = useAuth();
  const [forceOnboarding, setForceOnboarding] = useState(false);
  const [roleSubmitting, setRoleSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-blue-600 flex items-center justify-center text-white shadow-lg animate-pulse">
          <Zap className="w-6 h-6" />
        </div>
        <p className="text-xs font-semibold text-slate-500">Loading Voltly Network...</p>
      </div>
    );
  }

  // Step 1: Not logged in -> Show Landing Page with Google Auth
  if (!user) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Navbar />
        <LandingPage onGetStarted={() => {}} />
      </div>
    );
  }

  // Admin access
  if (user.role === 'ADMIN') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <main className="flex-1">
          <AdminDashboard />
        </main>
      </div>
    );
  }

  // Step 2: User is authenticated with Google, but has not completed either profile yet
  // Present dedicated Role Selection screen: Choose EV Driver (Guest) or Household Host
  const hasCompletedProfile = Boolean(hostProfile || guestProfile);

  if (!hasCompletedProfile && !forceOnboarding) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-4 py-12">
          <div className="max-w-xl w-full bg-white rounded-3xl p-6 sm:p-10 shadow-xl border border-slate-200/80 space-y-8 animate-in fade-in">
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-800 text-xs font-bold border border-blue-100">
                <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>Step 2 of 2 • Role Assignment</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Welcome, {user.name}!
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                How do you want to participate on the Voltly Peer-to-Peer EV Charging network?
              </p>
            </div>

            {/* Role Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Option 1: EV Driver / Guest */}
              <button
                type="button"
                disabled={roleSubmitting}
                onClick={async () => {
                  setRoleSubmitting(true);
                  try {
                    await switchRole('GUEST');
                    setForceOnboarding(true);
                  } finally {
                    setRoleSubmitting(false);
                  }
                }}
                className="p-5 rounded-2xl border-2 border-slate-200 hover:border-blue-600 hover:bg-blue-50/50 text-left transition-all group flex flex-col justify-between space-y-4 hover:shadow-md"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors mb-3">
                    <Car className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900">EV Driver (Guest)</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    I drive an electric vehicle (car or 2-wheeler) and need verified, reachable 16A charging sockets on the go.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600 group-hover:translate-x-1 transition-transform">
                  <span>Continue as Driver</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </button>

              {/* Option 2: Household Host */}
              <button
                type="button"
                disabled={roleSubmitting}
                onClick={async () => {
                  setRoleSubmitting(true);
                  try {
                    await switchRole('HOST');
                    setForceOnboarding(true);
                  } finally {
                    setRoleSubmitting(false);
                  }
                }}
                className="p-5 rounded-2xl border-2 border-slate-200 hover:border-emerald-600 hover:bg-emerald-50/50 text-left transition-all group flex flex-col justify-between space-y-4 hover:shadow-md"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors mb-3">
                    <Zap className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900">Household Host</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    I have a verified 16A socket at my house and want to earn by sharing power with EV drivers in my neighborhood.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 group-hover:translate-x-1 transition-transform">
                  <span>Continue as Host</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </button>
            </div>

            <p className="text-[11px] text-slate-400 text-center">
              🔒 Your selected role determines your dashboard and permissions. You will act exclusively in this role.
            </p>
          </div>
        </main>
      </div>
    );
  }

  // Logged in as HOST -> ACTS AS HOST ONLY
  if (user.role === 'HOST') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <main className="flex-1">
          {!hostProfile || forceOnboarding ? (
            <HostOnboarding onComplete={() => setForceOnboarding(false)} />
          ) : (
            <HostDashboard onNeedOnboarding={() => setForceOnboarding(true)} />
          )}
        </main>
      </div>
    );
  }

  // Logged in as GUEST -> ACTS AS GUEST ONLY
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <main className="flex-1">
        {!guestProfile || forceOnboarding ? (
          <GuestOnboarding onComplete={() => setForceOnboarding(false)} />
        ) : (
          <GuestDashboard onNeedOnboarding={() => setForceOnboarding(true)} />
        )}
      </main>
    </div>
  );
};
