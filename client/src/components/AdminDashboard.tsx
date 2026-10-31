import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Zap,
  Users,
  Clock,
  DollarSign,
  RefreshCw,
  FileText,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [rejectingPodId, setRejectingPodId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('Earthing unverified or wiring lacks 16A continuous rating');
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchOverview = async () => {
    try {
      const res = await api.getAdminOverview();
      setData(res);
    } catch (err) {
      console.error('Failed to load admin overview:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const handleApprove = async (podId: string) => {
    try {
      const res = await api.approvePod(podId);
      setActionMessage(res.message);
      fetchOverview();
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Approval failed');
    }
  };

  const handleReject = async (podId: string) => {
    try {
      const res = await api.rejectPod(podId, rejectReason);
      setRejectingPodId(null);
      setActionMessage(res.message);
      fetchOverview();
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Rejection failed');
    }
  };

  const handleFlag = async (podId: string) => {
    try {
      const res = await api.flagPod(podId, 'Requires certificate upload or physical inspection');
      setActionMessage(res.message);
      fetchOverview();
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Flagging failed');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-2">
          <RefreshCw className="w-6 h-6 text-purple-600 animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Loading compliance dashboard...</p>
        </div>
      </div>
    );
  }

  const { metrics, pendingPods = [], recentSessions = [], users = [] } = data || {};

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-800 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 text-purple-300 text-xs font-semibold mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Voltly Electrical Safety & Compliance</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black">Administrator Control Panel</h1>
            <p className="text-xs text-purple-200 mt-1">
              Review host installations, verify 16A earthing safety, and oversee platform activity.
            </p>
          </div>
          <button
            onClick={fetchOverview}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8 pt-6 border-t border-white/10">
          <div className="bg-white/10 rounded-xl p-3">
            <p className="text-[10px] uppercase font-bold text-purple-200">Registered Users</p>
            <p className="text-xl font-black mt-0.5">{metrics?.totalUsers || 0}</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3">
            <p className="text-[10px] uppercase font-bold text-purple-200">Pending Review</p>
            <p className="text-xl font-black mt-0.5 text-amber-300">{metrics?.pendingVerifications || 0}</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3">
            <p className="text-[10px] uppercase font-bold text-purple-200">Approved Pods</p>
            <p className="text-xl font-black mt-0.5 text-emerald-300">{metrics?.approvedPods || 0}</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3">
            <p className="text-[10px] uppercase font-bold text-purple-200">Total Settled</p>
            <p className="text-xl font-black mt-0.5">₹{metrics?.totalRevenue || 0}</p>
          </div>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* PENDING VERIFICATION PODS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Host Pod Applications Requiring Review ({pendingPods.length})
            </h2>
            <p className="text-xs text-slate-500">
              Only approved pods are recommended to EV drivers by Guardian Angel.
            </p>
          </div>
        </div>

        {pendingPods.length === 0 ? (
          <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl text-center text-xs text-slate-500">
            ✅ All host charging pods are fully reviewed and processed.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingPods.map((pod: any) => (
              <div
                key={pod.id}
                className="bg-white rounded-2xl border-2 border-amber-300 p-5 shadow-sm space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                      {pod.verification_status}
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm mt-1">{pod.pod_name}</h3>
                    <p className="text-xs text-slate-500">{pod.host?.household_location}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-900">{pod.hostUser?.name}</p>
                    <p className="text-[10px] text-slate-400">{pod.hostUser?.phone || pod.hostUser?.email}</p>
                  </div>
                </div>

                {/* Technical Safety Data */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Socket Specification:</span>
                    <strong className="text-slate-800">{pod.socket_type} (16A / 230V)</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Earthing Status:</span>
                    <strong
                      className={
                        pod.earthing_status === 'PROPER' ? 'text-emerald-700' : 'text-amber-700 font-bold'
                      }
                    >
                      {pod.earthing_status}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Electrician Certified:</span>
                    <strong
                      className={
                        pod.host?.checked_by_electrician ? 'text-emerald-700' : 'text-rose-600 font-bold'
                      }
                    >
                      {pod.host?.checked_by_electrician ? 'Yes, Confirmed' : 'No / Self-Declaration Only'}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Sanctioned Load:</span>
                    <strong className="text-slate-800">{pod.host?.sanctioned_load_kw} kW</strong>
                  </div>
                  {pod.admin_notes && (
                    <div className="pt-1 text-[11px] text-slate-600 border-t border-slate-200">
                      <strong>Flag Note:</strong> {pod.admin_notes}
                    </div>
                  )}
                </div>

                {/* Review Actions */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => handleFlag(pod.id)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors"
                  >
                    Flag Review
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setRejectingPodId(pod.id)}
                      className="px-3 py-1.5 border border-rose-300 text-rose-700 hover:bg-rose-50 font-semibold text-xs rounded-lg transition-colors"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleApprove(pod.id)}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors shadow-sm"
                    >
                      Approve Pod
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reject Reason Dialog */}
      {rejectingPodId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Reject Pod Application</h3>
            <p className="text-xs text-slate-500">
              Provide an official compliance reason for rejecting this household socket.
            </p>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectingPodId(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleReject(rejectingPodId)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
