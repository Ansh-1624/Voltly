import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Zap,
  ShieldCheck,
  Compass,
  QrCode,
  Gauge,
  Receipt,
  ArrowRight,
  CheckCircle,
  Sparkles,
  X,
  RefreshCw,
  Lock,
  KeyRound,
  AlertCircle,
} from 'lucide-react';

export const LandingPage: React.FC<{ onGetStarted: () => void }> = ({ onGetStarted }) => {
  const { loginWithGoogle, loginAsAdmin, authModal, openAuthModal, closeAuthModal } = useAuth();
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPasscode, setAdminPasscode] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [notFoundPrompt, setNotFoundPrompt] = useState(false);
  const [existsPrompt, setExistsPrompt] = useState(false);

  const handleGoogleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleEmail) return;
    setAuthLoading(true);
    setAuthError(null);
    setNotFoundPrompt(false);
    setExistsPrompt(false);

    const isLogin = authModal.mode === 'LOGIN';
    try {
      const name = googleName.trim() || googleEmail.split('@')[0];
      await loginWithGoogle(googleEmail.trim(), name, 'GUEST', isLogin ? 'login' : 'signup');
      closeAuthModal();
    } catch (err: any) {
      if (err.message && err.message.includes('No Voltly account found')) {
        setNotFoundPrompt(true);
      }
      if (err.message && (err.message.includes('already exists') || err.message.includes('account exist'))) {
        setExistsPrompt(true);
      }
      setAuthError(err.message || (isLogin ? 'Failed to log in. Please check your email.' : 'Failed to register account.'));
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminEmail || !adminPasscode) return;
    setAuthLoading(true);
    setAuthError(null);
    try {
      await loginAsAdmin(adminEmail.trim(), adminPasscode.trim());
      closeAuthModal();
    } catch (err: any) {
      setAuthError(err.message || 'Invalid admin credentials or security passcode.');
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-16 lg:pt-24 border-b border-slate-100">
        <div className="absolute inset-0 bg-[radial-gradient(#16A34A_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto">
            {/* Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-semibold mb-6 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Next-Gen Peer-to-Peer EV Infrastructure</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 leading-tight">
              Share Power.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600">
                Charge Anywhere.
              </span>
            </h1>

            <p className="mt-6 text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
              Voltly connects EV owners needing a charge with households with verified 16A sockets.
              Powered by our <span className="font-semibold text-slate-900">Guardian Angel</span> engine for
              explainable, electrically verified, reachable recommendations.
            </p>

            {/* Clear Split CTAs: Sign Up (New Users) vs Log In (Existing Users) */}
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => {
                  setAuthError(null);
                  setNotFoundPrompt(false);
                  openAuthModal('SIGNUP');
                }}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 group"
              >
                <span>Get Started (Sign Up)</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                onClick={() => {
                  setAuthError(null);
                  setNotFoundPrompt(false);
                  openAuthModal('LOGIN');
                }}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-colors flex items-center justify-center gap-2.5 shadow-xs"
              >
                <img
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                  alt="Google"
                  className="w-4 h-4"
                />
                <span>Log In (Existing Users)</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Step 1: Auth Modal with Clear Log In vs Sign Up vs Admin Mode */}
      {authModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 relative">
            <button
              onClick={closeAuthModal}
              className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {authModal.mode === 'ADMIN' ? (
              <>
                <div className="text-center">
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center mx-auto mb-3 shadow-xs">
                    <ShieldCheck className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900">Administrator & Compliance Login</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Enter official compliance credentials to access pod verification and safety controls.
                  </p>
                </div>

                {authError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
                    {authError}
                  </div>
                )}

                <form onSubmit={handleAdminSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Admin Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="admin@voltly.com"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Security Passcode / Key</label>
                    <input
                      type="password"
                      required
                      placeholder="Enter admin passcode"
                      value={adminPasscode}
                      onChange={(e) => setAdminPasscode(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Passcode: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-600 font-mono">voltly2026</code>
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full py-3 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl shadow-md shadow-purple-700/25 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {authLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Verify & Sign in as Admin</span>
                      </>
                    )}
                  </button>
                </form>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthError(null);
                      openAuthModal('LOGIN');
                    }}
                    className="text-slate-500 hover:text-slate-800 font-semibold hover:underline flex items-center gap-1"
                  >
                    <span>← Back to Driver & Host Sign-In</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Mode Selector Tabs: Log In vs Sign Up */}
                <div className="flex rounded-2xl bg-slate-100 p-1 border border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      openAuthModal('LOGIN');
                      setAuthError(null);
                      setNotFoundPrompt(false);
                    }}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                      authModal.mode === 'LOGIN'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Log In (Existing)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      openAuthModal('SIGNUP');
                      setAuthError(null);
                      setNotFoundPrompt(false);
                    }}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                      authModal.mode === 'SIGNUP'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Sign Up (New User)
                  </button>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto mb-3 shadow-xs">
                    <img
                      src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                      alt="Google"
                      className="w-6 h-6"
                    />
                  </div>
                  <h3 className="text-xl font-black text-slate-900">
                    {authModal.mode === 'LOGIN' ? 'Welcome Back!' : 'Join Voltly Network'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {authModal.mode === 'LOGIN'
                      ? 'Sign in with your registered Google email to access your EV Hub.'
                      : 'Create a new account with your Google email to start sharing or charging.'}
                  </p>
                </div>

                {authError && (
                  <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium space-y-2">
                    <p className="flex items-center gap-1.5 font-bold">
                      <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                      <span>{authError}</span>
                    </p>
                    {notFoundPrompt && (
                      <button
                        type="button"
                        onClick={() => {
                          setAuthError(null);
                          setNotFoundPrompt(false);
                          openAuthModal('SIGNUP');
                        }}
                        className="text-xs font-bold text-emerald-700 hover:text-emerald-800 underline block"
                      >
                        Click here to create a new account with this email →
                      </button>
                    )}
                    {existsPrompt && (
                      <button
                        type="button"
                        onClick={() => {
                          setAuthError(null);
                          setExistsPrompt(false);
                          openAuthModal('LOGIN');
                        }}
                        className="text-xs font-bold text-blue-700 hover:text-blue-800 underline block"
                      >
                        This account exists. Click here to Log In instead →
                      </button>
                    )}
                  </div>
                )}

                <form onSubmit={handleGoogleSubmit} className="space-y-4">
                  {/* Full Name field only required when Signing Up as new user */}
                  {authModal.mode === 'SIGNUP' && (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Full Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Ansh Goyal"
                        value={googleName}
                        onChange={(e) => setGoogleName(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      {authModal.mode === 'LOGIN' ? 'Registered Google Email Address' : 'Google Email Address'}
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="yourname@gmail.com"
                      value={googleEmail}
                      onChange={(e) => setGoogleEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {authLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <img
                          src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                          alt=""
                          className="w-4 h-4 bg-white rounded-full p-0.5"
                        />
                        <span>
                          {authModal.mode === 'LOGIN' ? 'Log In with Google' : 'Sign Up with Google'}
                        </span>
                      </>
                    )}
                  </button>
                </form>

                {/* Subtext Switcher */}
                <div className="text-center text-xs text-slate-500">
                  {authModal.mode === 'LOGIN' ? (
                    <p>
                      New to Voltly?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setAuthError(null);
                          setNotFoundPrompt(false);
                          openAuthModal('SIGNUP');
                        }}
                        className="font-bold text-blue-600 hover:underline"
                      >
                        Create an Account
                      </button>
                    </p>
                  ) : (
                    <p>
                      Already have an account?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setAuthError(null);
                          setNotFoundPrompt(false);
                          openAuthModal('LOGIN');
                        }}
                        className="font-bold text-blue-600 hover:underline"
                      >
                        Log In here
                      </button>
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Compliance & Safety Admin?</span>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthError(null);
                      setNotFoundPrompt(false);
                      openAuthModal('ADMIN');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold border border-purple-200 transition-colors flex items-center gap-1.5"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                    <span>Admin Login →</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* 4-Step Journey */}
      <section className="py-16 bg-slate-50/50 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-600">The Voltly Flow</h2>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              How Peer-to-Peer Charging Works
            </h3>
            <p className="text-sm text-slate-500 mt-2">
              From discovering reachable chargers to scanning on arrival and transparent billing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Step 1 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold mb-4">
                <Compass className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Step 1</span>
              <h4 className="text-base font-bold text-slate-900 mt-1">Guardian Angel Match</h4>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Enter your battery % and destination. Our engine verifies electrical compatibility, reserve range, and host status to recommend the optimal pod.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold mb-4">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
              </div>
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Step 2</span>
              <h4 className="text-base font-bold text-slate-900 mt-1">Live Navigation</h4>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Drive to the host address with live status rechecks. The unreserved socket warning ensures complete transparency before arrival.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold mb-4">
                <QrCode className="w-5 h-5 text-emerald-600" />
              </div>
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Step 3</span>
              <h4 className="text-base font-bold text-slate-900 mt-1">256-Bit QR Handshake</h4>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Guest generates a single-use cryptographic QR code on arrival. Host scans with camera to atomically verify safety limits and lock rates.
              </p>
            </div>

            {/* Step 4 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative">
              <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold mb-4">
                <Receipt className="w-5 h-5 text-teal-600" />
              </div>
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Step 4</span>
              <h4 className="text-base font-bold text-slate-900 mt-1">Safe Charge & Settle</h4>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Strict duration caps (60m 2W / 120m 4W) protect home circuits. Settle directly with host via UPI or Cash at zero platform commission.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer & Admin Compliance Access */}
      <footer className="py-8 bg-slate-900 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <Zap className="w-3.5 h-3.5 fill-current" />
            </div>
            <span className="font-bold text-slate-200">Voltly</span>
            <span className="text-slate-600">|</span>
            <span>Peer-to-Peer EV Charging Infrastructure</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                setAuthError(null);
                setNotFoundPrompt(false);
                openAuthModal('ADMIN');
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-purple-950/80 hover:text-purple-300 border border-slate-700 text-slate-300 font-semibold transition-all shadow-sm group"
            >
              <ShieldCheck className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
              <span>Compliance & Admin Portal</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
