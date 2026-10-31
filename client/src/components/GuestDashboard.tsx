import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { GuardianAngelRecommendation } from './GuardianAngelRecommendation';
import { NavigationModal } from './NavigationModal';
import { GuestQRModal } from './GuestQRModal';
import { ActiveSessionView } from './ActiveSessionView';
import { SessionBillModal } from './SessionBillModal';
import {
  Car,
  Bike,
  Zap,
  BatteryCharging,
  Compass,
  MapPin,
  Clock,
  ShieldCheck,
  Receipt,
  QrCode,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { RecommendationData, SessionBill } from '../types';

export const GuestDashboard: React.FC<{ onNeedOnboarding: () => void }> = ({ onNeedOnboarding }) => {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Workflow states
  const [activeRecommendation, setActiveRecommendation] = useState<RecommendationData | null>(null);
  const [navigationOpen, setNavigationOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState<SessionBill | null>(null);

  const fetchDashboard = async () => {
    try {
      const res = await api.getGuestDashboard();
      if (!res.profileComplete) {
        onNeedOnboarding();
        return;
      }
      setData(res);
    } catch (err) {
      console.error('Failed to load guest dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 5000); // Poll for live active session updates
    return () => clearInterval(interval);
  }, []);

  const handleRecommendationAccepted = (rec: RecommendationData) => {
    setActiveRecommendation(rec);
    setNavigationOpen(true);
  };

  const handleArrivalConfirmed = () => {
    setNavigationOpen(false);
    setQrModalOpen(true);
  };

  const handleSessionAuthorized = (session: any) => {
    setQrModalOpen(false);
    fetchDashboard();
  };

  const handleSessionEnded = (bill: any) => {
    fetchDashboard();
    setSelectedBill(bill);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-2">
          <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Loading your vehicle profile...</p>
        </div>
      </div>
    );
  }

  const { guestProfile, guestVehicle, activeSession, bills = [] } = data || {};
  const is2W = guestProfile?.vehicle_category === 'TWO_WHEELER';

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Top Banner & Vehicle Overview */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-white/5 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/10 text-blue-200 text-xs font-semibold mb-2">
              {is2W ? <Bike className="w-3.5 h-3.5" /> : <Car className="w-3.5 h-3.5" />}
              <span>{is2W ? 'Two-Wheeler EV' : 'Four-Wheeler EV'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{user?.name}'s EV Hub</h1>
            <p className="text-xs sm:text-sm text-blue-100/80 mt-1 max-w-xl">
              EVSE: {guestVehicle?.evse_supply_plug} Wall Plug • {guestVehicle?.vehicle_connector} Vehicle Inlet
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onNeedOnboarding}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold transition-colors"
            >
              Edit Vehicle / EVSE
            </button>
          </div>
        </div>

        {/* Vehicle Specs Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8 pt-6 border-t border-white/10">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
            <p className="text-[10px] uppercase font-bold text-blue-200">Battery Pack</p>
            <p className="text-xl font-black mt-0.5">{guestVehicle?.battery_capacity_kwh} kWh</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
            <p className="text-[10px] uppercase font-bold text-blue-200">Max AC Power</p>
            <p className="text-xl font-black mt-0.5 text-blue-300">{guestVehicle?.max_ac_power_kw} kW</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
            <p className="text-[10px] uppercase font-bold text-blue-200">Supply Plug</p>
            <p className="text-xl font-black mt-0.5">{guestVehicle?.evse_supply_plug}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
            <p className="text-[10px] uppercase font-bold text-blue-200">Session Limit</p>
            <p className="text-xl font-black mt-0.5">{is2W ? '60 Min' : '120 Min'}</p>
          </div>
        </div>
      </div>

      {/* ACTIVE CHARGING SESSION IF CURRENTLY CHARGING */}
      {activeSession ? (
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            Live Charging in Progress
          </h2>
          <ActiveSessionView
            sessionId={activeSession.id}
            onSessionEnded={handleSessionEnded}
          />
        </div>
      ) : (
        /* GUARDIAN ANGEL RECOMMENDATION ENGINE */
        <div className="space-y-4">
          <GuardianAngelRecommendation onAccept={handleRecommendationAccepted} />
        </div>
      )}

      {/* CHARGING HISTORY & BILLS */}
      {bills.length > 0 && (
        <div className="space-y-4 pt-6 border-t border-slate-200">
          <h2 className="text-base font-bold text-slate-900">Your Past Charging Sessions & Bills</h2>
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">Session ID</th>
                  <th className="p-3">Host Location</th>
                  <th className="p-3">Duration</th>
                  <th className="p-3">Energy (Est.)</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Payment</th>
                  <th className="p-3 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bills.map((item: any) => (
                  <tr key={item.session.id} className="hover:bg-slate-50/50">
                    <td className="p-3 font-mono text-[11px] text-slate-500">
                      {item.session.id.slice(0, 8)}...
                    </td>
                    <td className="p-3 font-medium text-slate-900">
                      {item.pod?.pod_name || 'Host Pod'}
                    </td>
                    <td className="p-3 text-slate-600">{item.bill?.duration_minutes || '-'} min</td>
                    <td className="p-3 text-emerald-700 font-semibold">
                      {item.bill?.estimated_energy_kwh || '-'} kWh
                    </td>
                    <td className="p-3 font-bold text-slate-900">₹{item.bill?.final_amount || 0}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {item.bill?.payment_status || 'PAID'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {item.bill && (
                        <button
                          onClick={() => setSelectedBill(item.bill)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                        >
                          View Bill
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Navigation Modal */}
      {navigationOpen && activeRecommendation && (
        <NavigationModal
          recommendation={activeRecommendation}
          onArrived={handleArrivalConfirmed}
          onClose={() => setNavigationOpen(false)}
        />
      )}

      {/* Guest QR Code Generator Modal */}
      {qrModalOpen && activeRecommendation && (
        <GuestQRModal
          recommendation={activeRecommendation}
          onSessionAuthorized={handleSessionAuthorized}
          onClose={() => setQrModalOpen(false)}
        />
      )}

      {/* Bill Receipt Modal */}
      {selectedBill && (
        <SessionBillModal
          bill={selectedBill}
          onClose={() => setSelectedBill(null)}
          onPaymentUpdated={fetchDashboard}
        />
      )}
    </div>
  );
};
