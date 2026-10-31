import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { HostDashboard } from './components/HostDashboard';
import { HostOnboarding } from './components/HostOnboarding';
import { GuestDashboard } from './components/GuestDashboard';
import { GuestOnboarding } from './components/GuestOnboarding';
import { AdminDashboard } from './components/AdminDashboard';
import { RefreshCw, Zap, Car, Bike, ShieldCheck } from 'lucide-react';

export const MainApp: React.FC = () => {
  const { user, loading, hostProfile, guestProfile, switchRole } = useAuth();
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [forceOnboarding, setForceOnboarding] = useState(false);

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

  // Not logged in -> Show Landing Page
  if (!user) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Navbar />
        <LandingPage onGetStarted={() => setShowRoleSelection(true)} />

        {/* Role Selection Dialog */}
        {showRoleSelection && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6">
              <div className="text-center">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto mb-3">
                  <Zap className="w-5 h-5 text-emerald-600" />
                </div>
                <h3 className="text-lg font-black text-slate-900">Choose Your Role on Voltly</h3>
                <p className="text-xs text-slate-500 mt-1">
                  You can switch between Host and Guest roles anytime with the same account.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={async () => {
                    const { loginAsDemo } = (window as any).__voltly_auth || {};
                    // Quick start as Guest Vikram
                    setShowRoleSelection(false);
                  }}
                  className="p-4 rounded-2xl border-2 border-slate-200 hover:border-blue-600 hover:bg-blue-50/50 text-left transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <Car className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">EV Guest / Driver</p>
                      <p className="text-[11px] text-slate-500">I need verified, reachable charging for my electric vehicle.</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={async () => {
                    setShowRoleSelection(false);
                  }}
                  className="p-4 rounded-2xl border-2 border-slate-200 hover:border-emerald-600 hover:bg-emerald-50/50 text-left transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">Household Host</p>
                      <p className="text-[11px] text-slate-500">I have a 16A socket and want to earn by sharing power.</p>
                    </div>
                  </div>
                </button>
              </div>

              <div className="pt-2 text-center">
                <button
                  onClick={() => setShowRoleSelection(false)}
                  className="text-xs text-slate-400 hover:text-slate-600 font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Logged in: Render based on role
  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col">
      <Navbar />

      <main className="flex-1">
        {user.role === 'ADMIN' && <AdminDashboard />}

        {user.role === 'HOST' && (
          <>
            {!hostProfile || forceOnboarding ? (
              <HostOnboarding onComplete={() => setForceOnboarding(false)} />
            ) : (
              <HostDashboard onNeedOnboarding={() => setForceOnboarding(true)} />
            )}
          </>
        )}

        {user.role === 'GUEST' && (
          <>
            {!guestProfile || forceOnboarding ? (
              <GuestOnboarding onComplete={() => setForceOnboarding(false)} />
            ) : (
              <GuestDashboard onNeedOnboarding={() => setForceOnboarding(true)} />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">Voltly</span>
            <span>•</span>
            <span>AI-Powered Peer-to-Peer EV Charging Platform</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Deterministic Safety Logic</span>
            <span>•</span>
            <span>Zero In-App Platform Fees</span>
            <span>•</span>
            <span>Direct P2P Settlement</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
