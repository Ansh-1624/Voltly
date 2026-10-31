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
} from 'lucide-react';

export const LandingPage: React.FC<{ onGetStarted: () => void }> = ({ onGetStarted }) => {
  const { loginWithGoogle } = useAuth();
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');
  const [showManualLogin, setShowManualLogin] = useState(false);

  const handleCustomGoogle = (e: React.FormEvent) => {
    e.preventDefault();
    if (googleEmail && googleName) {
      loginWithGoogle(googleEmail, googleName, 'GUEST');
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

            {/* CTA & Quick Demo Row */}
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={onGetStarted}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 group"
              >
                <span>Get Started Now</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                onClick={() => setShowManualLogin(!showManualLogin)}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-colors flex items-center justify-center gap-2"
              >
                <img
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                  alt="Google"
                  className="w-4 h-4"
                />
                <span>Sign in with Google</span>
              </button>
            </div>

            {/* Manual Google modal / inline login */}
            {showManualLogin && (
              <form
                onSubmit={handleCustomGoogle}
                className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-xl max-w-md mx-auto text-left space-y-3 shadow-inner"
              >
                <p className="text-xs font-bold text-slate-800">Sign in with any Google account:</p>
                <input
                  type="text"
                  placeholder="Full Name"
                  required
                  value={googleName}
                  onChange={(e) => setGoogleName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
                <input
                  type="email"
                  placeholder="Google Email (e.g. yourname@gmail.com)"
                  required
                  value={googleEmail}
                  onChange={(e) => setGoogleEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
                <button
                  type="submit"
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors"
                >
                  Continue with Google
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

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
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">Step 1</span>
              <h4 className="text-base font-bold text-slate-900 mt-1">Guardian Angel</h4>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Enter remaining battery. The AI filters out incompatible plugs and calculates reachable driving routes with a 20% safety margin.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold mb-4">
                <Zap className="w-5 h-5 text-emerald-600" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Step 2</span>
              <h4 className="text-base font-bold text-slate-900 mt-1">Accept & Navigate</h4>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Accept the recommended host. Review ETA and real-time pod availability. The pod remains unreserved until verified in person.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold mb-4">
                <QrCode className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600">Step 3</span>
              <h4 className="text-base font-bold text-slate-900 mt-1">QR Verification</h4>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                On arrival, guest generates a single-use cryptographic QR code. Host scans to authorize and atomically initiate the session.
              </p>
            </div>

            {/* Step 4 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold mb-4">
                <Receipt className="w-5 h-5 text-amber-600" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Step 4</span>
              <h4 className="text-base font-bold text-slate-900 mt-1">Charge & Settle</h4>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Enforced duration limits (60m 2W / 120m 4W). Transparent billing based on verified kW and host electricity tariff. Pay host directly via UPI or Cash.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Pillars */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0 text-emerald-600">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Visual Electrical Safety</h4>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Image-based onboarding ensures hosts and guests correctly identify 16A 3-pin sockets, verified earthing, and compatible EVSE plugs without technical jargon.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0 text-blue-600">
                <Gauge className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Dynamic Power Pricing</h4>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Price locked when charging starts using{' '}
                  <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px] font-mono">
                    min(P_vehicle, P_evse, P_host)
                  </code>
                  . Fair per-minute billing directly reflecting actual electricity consumed.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center flex-shrink-0 text-teal-600">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Adaptive Rejection Learning</h4>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  If you reject a recommendation due to detour, cost, or charging speed, Guardian Angel remembers your preference signals across sessions to tailor better matches.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

