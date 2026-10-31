import React, { useState } from 'react';
import { api } from '../services/api';
import {
  Receipt,
  CheckCircle2,
  Clock,
  Zap,
  ArrowRight,
  DollarSign,
  QrCode,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { SessionBill } from '../types';

interface SessionBillModalProps {
  bill: SessionBill;
  onClose: () => void;
  onPaymentUpdated?: () => void;
}

export const SessionBillModal: React.FC<SessionBillModalProps> = ({
  bill,
  onClose,
  onPaymentUpdated,
}) => {
  const [paymentStatus, setPaymentStatus] = useState(bill.payment_status);
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CASH'>('UPI');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleMarkPaid = async () => {
    setSaving(true);
    try {
      const res = await api.updatePaymentStatus(bill.session_id, 'PAID', paymentMethod);
      setPaymentStatus('PAID');
      setMessage(res.message);
      if (onPaymentUpdated) {
        onPaymentUpdated();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update payment');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Final Charging Bill</h3>
              <p className="text-[11px] text-slate-500 font-mono">Session #{bill.session_id.slice(0, 8)}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-xs font-semibold px-2 py-1"
          >
            Close
          </button>
        </div>

        {/* Bill Amount Spotlight */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-2xl p-6 text-center space-y-1 shadow-md">
          <p className="text-[11px] uppercase tracking-wider font-bold text-emerald-100">Total Payable Amount</p>
          <p className="text-4xl font-black tracking-tight">₹{bill.final_amount.toFixed(2)}</p>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-semibold mt-1">
            <Clock className="w-3 h-3" />
            <span>{bill.duration_minutes} Minutes Billed</span>
          </div>
        </div>

        {/* Itemized Energy & Rates Breakdown */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2 text-xs">
          <div className="flex justify-between py-1 border-b border-slate-200/60">
            <span className="text-slate-500">Charging Duration</span>
            <span className="font-bold text-slate-800">{bill.duration_minutes} min</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-200/60">
            <span className="text-slate-500">Estimated Energy Consumed</span>
            <span className="font-bold text-emerald-700">{bill.estimated_energy_kwh} kWh</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-200/60">
            <span className="text-slate-500">Payment Status</span>
            <span
              className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                paymentStatus === 'PAID'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {paymentStatus}
            </span>
          </div>
        </div>

        {/* Direct Payment Settlement Notice (Section 17) */}
        <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-xs text-blue-900 leading-relaxed space-y-1">
          <div className="flex items-center gap-1.5 font-bold">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>Direct P2P Settlement</span>
          </div>
          <p className="text-[11px] text-blue-800">
            Payment occurs directly between host and guest. Settle via host's personal UPI QR or Cash. Voltly charges 0% commission.
          </p>
        </div>

        {message && (
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {/* Self-reported settlement action */}
        {paymentStatus !== 'PAID' ? (
          <div className="space-y-3 pt-1">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('UPI')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${
                  paymentMethod === 'UPI'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-600'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                UPI QR Code
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('CASH')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${
                  paymentMethod === 'CASH'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-600'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                Cash
              </button>
            </div>

            <button
              onClick={handleMarkPaid}
              disabled={saving}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
            >
              {saving ? 'Updating...' : `Mark as Settled (Self-Reported ${paymentMethod})`}
            </button>
          </div>
        ) : (
          <div className="pt-2">
            <button
              onClick={onClose}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
