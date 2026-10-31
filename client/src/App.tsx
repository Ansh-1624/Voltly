import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { HostDashboard } from './components/HostDashboard';
import { HostOnboarding } from './components/HostOnboarding';
import { GuestDashboard } from './components/GuestDashboard';
import { GuestOnboarding } from './components/GuestOnboarding';
import { AdminDashboard } from './components/AdminDashboard';
import { RefreshCw, Zap, Car, ShieldCheck, Mail, UserCheck } from 'lucide-react';
import { UserRole } from './types';

export const MainApp: React.FC = () => {
  const { user, loading, hostProfile, guestProfile, switchRole, login } = useAuth();
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [forceOnboarding, setForceOnboarding] = useState(false);

  // Sign in / Sign up form state
  const [selectedRole, setSelectedRole] = useState<UserRole>('GUEST');
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

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

  const handleStartSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail) return;
    setSubmitting(true);
    setAuthError(null);
    try {
      await login(authEmail, authName || authEmail.split('@')[0], selectedRole);
      setShowRoleSelection(false);
    } catch (err: any) {
      setAuthError(err.message || 'Failed to sign in. Please verify your connection.');
    } finally {
      setSubmitting(false);
    }
  };

  // Not logged in -> Show Landing Page
  if (!user) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Navbar />
        <LandingPage onGetStarted={() => setShowRoleSelection(true)} />

        {/* Sign In / Sign Up Dialog */}
        {showRoleSelection && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6">
              <div className="text-center">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto mb-3">
                  <Zap className="w-5 h-5 text-emerald-600" />
                </div>
                <h3 className="text-xl font-black text-slate-900">Get Started with Voltly</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Join the peer-to-peer EV charging community.
                </p>
              </div>

              {authError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
                  {authError}
                </div>
              )}

              {/* Role Picker */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedRole('GUEST')}
                  className={`p-3 rounded-2xl border-2 text-left transition-all ${
                    selectedRole === 'GUEST'
                      ? 'border-blue-600 bg-blue-50/60 text-blue-900'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center mb-1.5">
                    <Car className="w-4 h-4" />
                  </div>
                  <p className="text-xs font-bold text-slate-900">EV Driver / Guest</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Find & charge at verified sockets</p>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRole('HOST')}
                  className={`p-3 rounded-2xl border-2 text-left transition-all ${
                    selectedRole === 'HOST'
                      ? 'border-emerald-600 bg-emerald-50/60 text-emerald-900'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center mb-1.5">
                    <Zap className="w-4 h-4" />
                  </div>
                  <p className="text-xs font-bold text-slate-900">Household Host</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Share your 16A socket & earn</p>
                </button>
              </div>

              {/* Input Form */}
              <form onSubmit={handleStartSubmit} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Your Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors disabled:opacity-50 mt-2 flex items-center justify-center gap-1.5"
                >
                  {submitting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Continue as {selectedRole === 'GUEST' ? 'EV Driver' : 'Household Host'}</span>
                  )}
                </button>
              </form>

              <div className="pt-1 text-center">
                <button
                  type="button"
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

  // Logged in as ADMIN
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

  // Logged in as HOST
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

  // Logged in as GUEST
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
