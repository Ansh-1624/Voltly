import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { HostQRScanner } from './HostQRScanner';
import {
  Zap,
  Plus,
  QrCode,
  ShieldCheck,
  Clock,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  PowerOff,
  BatteryCharging,
  Settings,
  RefreshCw,
} from 'lucide-react';
import { HostPod, ChargingSession } from '../types';

export const HostDashboard: React.FC<{ onNeedOnboarding: () => void }> = ({ onNeedOnboarding }) => {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [addPodOpen, setAddPodOpen] = useState(false);
  const [newPodName, setNewPodName] = useState('');
  const [newPodSchedule, setNewPodSchedule] = useState('All days, 08:00 AM - 08:00 PM');
  const [submittingPod, setSubmittingPod] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchDashboard = async () => {
    try {
      const res = await api.getHostDashboard();
      if (!res.profileComplete) {
        onNeedOnboarding();
        return;
      }
      setData(res);
    } catch (err) {
      console.error('Failed to load host dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 6000); // Live poll for active sessions
    return () => clearInterval(interval);
  }, []);

  const handleTogglePodStatus = async (pod: HostPod) => {
    const nextStatus = pod.status === 'AVAILABLE' ? 'TEMPORARILY_UNAVAILABLE' : 'AVAILABLE';
    try {
      await api.updatePodStatus(pod.id, nextStatus);
      setActionMessage(`Pod ${pod.pod_name} is now ${nextStatus.replace('_', ' ')}.`);
      fetchDashboard();
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  const handleAddPod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPodName) return;
    setSubmittingPod(true);
    try {
      await api.addHostPod({
        pod_name: newPodName,
        socket_type: '16A_3PIN',
        rated_current_a: 16,
        rated_voltage_v: 230,
        verified_safe_power_kw: 3.3,
        earthing_status: 'PROPER',
        availability_schedule: newPodSchedule,
      });
      setAddPodOpen(false);
      setNewPodName('');
      setActionMessage('Second pod registered and submitted for electrical safety verification.');
      fetchDashboard();
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to add pod');
    } finally {
      setSubmittingPod(false);
    }
  };

  const handleStopSession = async (sessionId: string) => {
    if (!window.confirm('Are you sure you want to stop this active charging session?')) return;
    try {
      const res = await api.stopSession(sessionId);
      setActionMessage(res.message);
      fetchDashboard();
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to stop session');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-2">
          <RefreshCw className="w-6 h-6 text-emerald-600 animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Loading host ports & sessions...</p>
        </div>
      </div>
    );
  }

  const { host, pods = [], activeSessions = [], stats, recentSessions = [] } = data || {};

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Top Banner & Quick Actions */}
      <div className="bg-gradient-to-r from-emerald-700 via-emerald-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-white/5 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/10 text-emerald-300 text-xs font-semibold mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Host Dashboard ({host?.verification_status})</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{user?.name}'s Charging Station</h1>
            <p className="text-xs sm:text-sm text-emerald-100/80 mt-1 max-w-xl">
              {host?.household_location} • Tariff: ₹{host?.electricity_tariff}/kWh
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => setScannerOpen(true)}
              className="w-full sm:w-auto justify-center px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold text-xs rounded-xl shadow-lg shadow-emerald-950/20 flex items-center gap-2 transition-transform active:scale-95"
            >
              <QrCode className="w-4 h-4 text-slate-900" />
              <span>Scan Guest QR</span>
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8 pt-6 border-t border-white/10">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
            <p className="text-[10px] uppercase font-bold text-emerald-200">Total Earnings</p>
            <p className="text-xl font-black mt-0.5">₹{stats?.totalEarnings || 0}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
            <p className="text-[10px] uppercase font-bold text-emerald-200">Active Charging</p>
            <p className="text-xl font-black mt-0.5 text-emerald-300">{stats?.activeSessionsCount || 0}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
            <p className="text-[10px] uppercase font-bold text-emerald-200">Available Pods</p>
            <p className="text-xl font-black mt-0.5">{stats?.availablePods || 0} / {stats?.totalPods || 0}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
            <p className="text-[10px] uppercase font-bold text-emerald-200">Completed Sessions</p>
            <p className="text-xl font-black mt-0.5">{stats?.completedSessionsCount || 0}</p>
          </div>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* ACTIVE CHARGING SESSIONS */}
      {activeSessions.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            Live Active Charging Sessions ({activeSessions.length})
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeSessions.map((session: ChargingSession) => {
              const pod = pods.find((p: HostPod) => p.id === session.pod_id);
              const startTime = new Date(session.started_at).getTime();
              const elapsedMinutes = Math.max(1, Math.round((Date.now() - startTime) / 60000));
              const currentCost = (elapsedMinutes * session.locked_price_per_minute).toFixed(2);
              const energyKwh = ((session.effective_power_kw * elapsedMinutes) / 60).toFixed(2);
              const limitReached = session.status === 'LIMIT_REACHED' || elapsedMinutes >= session.max_duration_minutes;

              return (
                <div
                  key={session.id}
                  className={`bg-white rounded-2xl border-2 p-5 shadow-sm space-y-4 ${
                    limitReached ? 'border-amber-400 bg-amber-50/20' : 'border-emerald-500 bg-emerald-50/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        {session.status}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 mt-1">{pod?.pod_name || 'Charging Pod'}</h3>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-900">₹{session.locked_price_per_minute.toFixed(3)}/min</p>
                      <p className="text-[10px] text-slate-500">Locked Rate</p>
                    </div>
                  </div>

                  {/* Progress & Live Numbers */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                    <div>
                      <p className="text-[10px] text-slate-400 font-medium uppercase">Elapsed</p>
                      <p className="text-sm font-black text-slate-900">{elapsedMinutes} min</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-medium uppercase">Est. Energy</p>
                      <p className="text-sm font-black text-emerald-600">{energyKwh} kWh</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-medium uppercase">Current Bill</p>
                      <p className="text-sm font-black text-blue-600">₹{currentCost}</p>
                    </div>
                  </div>

                  {limitReached && (
                    <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs leading-snug">
                      <strong>Session Limit Reached:</strong> Vehicle has reached category maximum (
                      {session.max_duration_minutes} min). Please physically disconnect charging and stop the session.
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2">
                    <p className="text-[11px] text-slate-500">
                      Power output: <strong className="text-slate-800">{session.effective_power_kw} kW</strong>
                    </p>
                    <button
                      onClick={() => handleStopSession(session.id)}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow-sm"
                    >
                      <PowerOff className="w-3.5 h-3.5" />
                      <span>Stop Charging</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CHARGING POD MANAGEMENT */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Your Charging Pods</h2>
            <p className="text-xs text-slate-500">
              Manage your physical 16A sockets ({pods.length} of 2 max pods registered)
            </p>
          </div>

          {pods.length < 2 && (
            <button
              onClick={() => setAddPodOpen(true)}
              className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Pod #2</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pods.map((pod: HostPod) => {
            const isApproved = pod.verification_status === 'APPROVED';
            const isAvailable = pod.status === 'AVAILABLE';

            return (
              <div
                key={pod.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 hover:border-slate-300 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-sm">{pod.pod_name}</h3>
                      <span
                        className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${
                          pod.verification_status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : pod.verification_status === 'PENDING'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {pod.verification_status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{pod.availability_schedule}</p>
                  </div>

                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded-lg ${
                      pod.status === 'AVAILABLE'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : pod.status === 'OCCUPIED'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {pod.status.replace('_', ' ')}
                  </span>
                </div>

                {/* Specs Box */}
                <div className="grid grid-cols-3 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Socket</span>
                    <strong className="text-slate-800">{pod.socket_type}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Safe Power</span>
                    <strong className="text-slate-800">{pod.verified_safe_power_kw} kW</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Earthing</span>
                    <strong className="text-slate-800">{pod.earthing_status}</strong>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-[11px] text-slate-500">
                    {isApproved
                      ? 'Approved for recommendations'
                      : 'Pending admin electrical check'}
                  </span>

                  {isApproved && pod.status !== 'OCCUPIED' && (
                    <button
                      onClick={() => handleTogglePodStatus(pod)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${
                        isAvailable
                          ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                    >
                      {isAvailable ? 'Disable Temporarily' : 'Make Available'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RECENT SESSION HISTORY */}
      {recentSessions.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-base font-bold text-slate-900">Recent Completed Sessions</h2>

          {/* Mobile Card View (visible on < 640px) */}
          <div className="sm:hidden space-y-3">
            {recentSessions.map((s: any) => (
              <div key={s.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs">{s.pod?.pod_name || 'Pod'}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    {s.bill?.payment_status || 'PAID'} ({s.bill?.payment_method || 'UPI'})
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs bg-slate-50 p-2 rounded-lg">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Duration</span>
                    <strong className="text-slate-800">{s.bill?.duration_minutes || '-'} min</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Energy</span>
                    <strong className="text-emerald-700">{s.bill?.estimated_energy_kwh || '-'} kWh</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Amount</span>
                    <strong className="text-slate-900">₹{s.bill?.final_amount || 0}</strong>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 font-mono">Session ID: {s.id.slice(0, 12)}...</p>
              </div>
            ))}
          </div>

          {/* Desktop Table (hidden on mobile) */}
          <div className="hidden sm:block bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">Session ID</th>
                  <th className="p-3">Pod</th>
                  <th className="p-3">Duration</th>
                  <th className="p-3">Energy (Est.)</th>
                  <th className="p-3">Final Amount</th>
                  <th className="p-3">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentSessions.map((s: any) => (
                  <tr key={s.id} className="hover:bg-slate-50/50">
                    <td className="p-3 font-mono text-[11px] text-slate-500">{s.id.slice(0, 8)}...</td>
                    <td className="p-3 font-medium text-slate-900">{s.pod?.pod_name || 'Pod'}</td>
                    <td className="p-3 text-slate-600">{s.bill?.duration_minutes || '-'} min</td>
                    <td className="p-3 text-emerald-700 font-semibold">{s.bill?.estimated_energy_kwh || '-'} kWh</td>
                    <td className="p-3 font-bold text-slate-900">₹{s.bill?.final_amount || 0}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {s.bill?.payment_status || 'PAID'} ({s.bill?.payment_method || 'UPI'})
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Pod Modal (Limit 2) */}
      {addPodOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">Add Second Charging Pod</h3>
            <p className="text-xs text-slate-500 mb-4">
              Add pod #2 (maximum 2 physical pods permitted per host household).
            </p>

            <form onSubmit={handleAddPod} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Pod Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Garage Secondary Socket"
                  value={newPodName}
                  onChange={(e) => setNewPodName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Availability Schedule</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Weekends only, 09:00 AM - 06:00 PM"
                  value={newPodSchedule}
                  onChange={(e) => setNewPodSchedule(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAddPodOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPod}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"
                >
                  {submittingPod ? 'Saving...' : 'Add Pod'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Scanner Modal */}
      {scannerOpen && (
        <HostQRScanner
          onSessionStarted={(_session) => {
            setScannerOpen(false);
            fetchDashboard();
          }}
          onClose={() => setScannerOpen(false)}
        />
      )}
    </div>
  );
};

