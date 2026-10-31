import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Zap,
  BatteryCharging,
  Clock,
  ShieldCheck,
  AlertTriangle,
  PowerOff,
  Receipt,
  User,
  MapPin,
  RefreshCw,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ActiveSessionViewProps {
  sessionId: string;
  onSessionEnded: (bill: any) => void;
}

export const ActiveSessionView: React.FC<ActiveSessionViewProps> = ({
  sessionId,
  onSessionEnded,
}) => {
  const { user } = useAuth();
  const [sessionData, setSessionData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [stopping, setStopping] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSession = async () => {
    try {
      const data = await api.getSession(sessionId);
      setSessionData(data);
      if (data.session.status === 'COMPLETED' || data.session.status === 'STOPPED_BY_HOST') {
        try {
          confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
        } catch (_) {}
        if (data.bill) {
          onSessionEnded(data.bill);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch session details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
    const interval = setInterval(fetchSession, 3000); // 3s real-time poll
    return () => clearInterval(interval);
  }, [sessionId]);

  const handleHostStop = async () => {
    if (!window.confirm('Confirm stopping the EV charging session?')) return;
    setStopping(true);
    try {
      const res = await api.stopSession(sessionId);
      if (res.bill) {
        onSessionEnded(res.bill);
      }
    } catch (err: any) {
      alert(err.message || 'Error stopping session');
    } finally {
      setStopping(false);
    }
  };

  const handleConfirmShutdown = async () => {
    setStopping(true);
    try {
      const res = await api.confirmShutdown(sessionId);
      if (res.bill) {
        onSessionEnded(res.bill);
      }
    } catch (err: any) {
      alert(err.message || 'Error confirming shutdown');
    } finally {
      setStopping(false);
    }
  };

  if (loading && !sessionData) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
        <p className="text-xs text-slate-500 font-semibold">Connecting to active charging session...</p>
      </div>
    );
  }

  const { session, pod, host, guest, liveStats } = sessionData || {};
  const isLimitReached = session?.status === 'LIMIT_REACHED';
  const isHost = user?.role === 'HOST' || user?.role === 'ADMIN';

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 animate-in fade-in">
      {/* Active Charging Card */}
      <div className="bg-white rounded-3xl border-2 border-emerald-500 p-6 sm:p-8 shadow-xl space-y-6">
        {/* Animated Charging Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/30">
                <BatteryCharging className="w-6 h-6 animate-pulse" />
              </div>
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-white animate-ping" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {session?.status}
                </span>
                <span className="text-xs text-slate-400 font-mono">ID: {session?.id.slice(0, 8)}</span>
              </div>
              <h2 className="text-xl font-black text-slate-900 mt-0.5">{pod?.pod_name}</h2>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xl font-black text-slate-900">
              ₹{liveStats?.currentEstimatedCost || '0.00'}
            </span>
            <p className="text-[10px] text-slate-400">Current Metered Total</p>
          </div>
        </div>

        {/* Live Gauges */}
        <div className="grid grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase">Elapsed Time</p>
            <p className="text-xl font-black text-slate-900 mt-0.5">{liveStats?.elapsedMinutes} min</p>
            <p className="text-[10px] text-slate-500">Max {session?.max_duration_minutes} min</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase">Charging Speed</p>
            <p className="text-xl font-black text-emerald-600 mt-0.5">{session?.effective_power_kw} kW</p>
            <p className="text-[10px] text-slate-500">Verified Safe Limit</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase">Estimated Energy</p>
            <p className="text-xl font-black text-blue-600 mt-0.5">{liveStats?.currentEstimatedEnergyKwh} kWh</p>
            <p className="text-[10px] text-slate-500">Continuous Draw</p>
          </div>
        </div>

        {/* Session Limits Warning Banner */}
        {isLimitReached && (
          <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl space-y-2 text-amber-950">
            <div className="flex items-center gap-2 font-bold text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>Category Maximum Duration Reached ({session?.max_duration_minutes} Minutes)</span>
            </div>
            <p className="text-xs text-amber-900 leading-relaxed">
              Charging duration limit has been reached. Host must physically disconnect the portable charger safely and confirm shutdown.
            </p>
            {isHost && (
              <button
                onClick={handleConfirmShutdown}
                disabled={stopping}
                className="mt-2 w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow transition-colors"
              >
                Confirm Physical Shutdown & Finalize Bill
              </button>
            )}
          </div>
        )}

        {/* Rate Locking Transparency Note (Section 13) */}
        <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-[11px] text-blue-900 flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <strong>Locked Rate Guarantee:</strong> Electricity billing rate is locked at{' '}
            <strong className="underline">₹{session?.locked_price_per_minute.toFixed(4)}/minute</strong> (₹{host?.electricity_tariff}/kWh). Host tariff edits cannot alter ongoing or completed sessions.
          </div>
        </div>

        {/* Host & Guest Details */}
        <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-slate-100">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Host</span>
            <p className="font-semibold text-slate-800 mt-0.5">{host?.name || 'Voltly Host'}</p>
            <p className="text-[11px] text-slate-500">{host?.phone || host?.household_location}</p>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Guest</span>
            <p className="font-semibold text-slate-800 mt-0.5">{guest?.name || 'EV Guest'}</p>
            <p className="text-[11px] text-slate-500">{guest?.phone || 'Verified Guest'}</p>
          </div>
        </div>

        {/* Stop Action for Host */}
        {isHost && !isLimitReached && (
          <div className="pt-2">
            <button
              onClick={handleHostStop}
              disabled={stopping}
              className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md shadow-rose-600/20 flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              <PowerOff className="w-4 h-4" />
              <span>{stopping ? 'Stopping Session...' : 'Stop Charging & Generate Final Bill'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
