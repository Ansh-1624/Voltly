import React, { useState } from 'react';
import { api } from '../services/api';
import {
  Compass,
  Zap,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  HelpCircle,
  AlertCircle,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Sliders,
} from 'lucide-react';
import { RecommendationData, RejectionReason } from '../types';

interface GuardianAngelProps {
  onAccept: (rec: RecommendationData) => void;
}

export const GuardianAngelRecommendation: React.FC<GuardianAngelProps> = ({ onAccept }) => {
  // Input search parameters
  const [batteryPct, setBatteryPct] = useState(35);
  const [estimatedRangeKm, setEstimatedRangeKm] = useState(48);
  const [guestLat, setGuestLat] = useState(12.9716);
  const [guestLng, setGuestLng] = useState(77.5946);
  const [locationName, setLocationName] = useState('MG Road / Central Bengaluru');

  // Recommendation State
  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<RecommendationData | null>(null);
  const [unavailabilityReason, setUnavailabilityReason] = useState<string | null>(null);
  const [searchTriggered, setSearchTriggered] = useState(false);

  // Rejection Dialog State
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState<RejectionReason>('TOO_EXPENSIVE');
  const [customNotes, setCustomNotes] = useState('');
  const [rejecting, setRejecting] = useState(false);

  const handleFetchCurrentGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGuestLat(Number(pos.coords.latitude.toFixed(4)));
          setGuestLng(Number(pos.coords.longitude.toFixed(4)));
          setLocationName(`GPS: ${pos.coords.latitude.toFixed(3)}, ${pos.coords.longitude.toFixed(3)}`);
        },
        () => {
          setGuestLat(12.9716);
          setGuestLng(77.5946);
          setLocationName('Indiranagar, Bengaluru');
        }
      );
    }
  };

  const handleFindCharger = async () => {
    setLoading(true);
    setSearchTriggered(true);
    setUnavailabilityReason(null);

    try {
      const res = await api.findRecommendation({
        guestLat,
        guestLng,
        batteryPct,
        estimatedRangeKm,
      });

      if (res.hasRecommendation && res.recommendation) {
        setRecommendation(res.recommendation);
      } else {
        setRecommendation(null);
        setUnavailabilityReason(
          res.unavailabilityReason || 'No suitable charging pod found matching your vehicle constraints.'
        );
      }
    } catch (err: any) {
      setRecommendation(null);
      setUnavailabilityReason(err.message || 'Error executing Guardian Angel search');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!recommendation) return;
    try {
      await api.acceptRecommendation(recommendation.id);
      onAccept(recommendation);
    } catch (err: any) {
      alert(err.message || 'Failed to accept recommendation');
    }
  };

  const handleConfirmReject = async () => {
    if (!recommendation) return;
    setRejecting(true);
    try {
      const res = await api.rejectRecommendation(recommendation.id, rejectionReason, customNotes);
      setRejectModalOpen(false);

      if (res.hasNext && res.nextRecommendation) {
        setRecommendation(res.nextRecommendation);
        setUnavailabilityReason(null);
      } else {
        setRecommendation(null);
        setUnavailabilityReason(
          res.unavailabilityReason || 'All available charging pods have been evaluated. No further options remain.'
        );
      }
    } catch (err: any) {
      alert(err.message || 'Failed to submit rejection');
    } finally {
      setRejecting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Search Input Box */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Guardian Angel Intelligent Search</h3>
              <p className="text-xs text-slate-500">
                Determines the single optimal charging match considering range safety reserve and verified socket ratings
              </p>
            </div>
          </div>

          <button
            onClick={handleFetchCurrentGPS}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <MapPin className="w-3.5 h-3.5 text-blue-600" />
            <span>{locationName}</span>
          </button>
        </div>

        {/* Battery & Range Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-1">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-slate-700">Current Battery State of Charge (SoC)</label>
              <span className="text-xs font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                {batteryPct}%
              </span>
            </div>
            <input
              type="range"
              min="5"
              max="95"
              value={batteryPct}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                setBatteryPct(val);
                setEstimatedRangeKm(Math.round((val / 100) * 140));
              }}
              className="w-full accent-blue-600 cursor-pointer"
            />
            <p className="text-[10px] text-slate-400 mt-1">Adjust to match your dashboard gauge</p>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-slate-700">Estimated Remaining Range</label>
              <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                {estimatedRangeKm} km
              </span>
            </div>
            <input
              type="range"
              min="5"
              max="250"
              value={estimatedRangeKm}
              onChange={(e) => setEstimatedRangeKm(parseInt(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Engine enforces a mandatory <strong className="text-slate-600">+20% distance buffer</strong>
            </p>
          </div>
        </div>

        <button
          onClick={handleFindCharger}
          disabled={loading}
          className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition-transform active:scale-[0.99] disabled:opacity-50"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Guardian Angel is evaluating safety constraints & routes...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Find Best Compatible Charging Pod</span>
            </>
          )}
        </button>
      </div>

      {/* Unavailability State */}
      {searchTriggered && !loading && !recommendation && (
        <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-3 animate-in fade-in">
          <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-900">No Suitable Charging Pod Available</h4>
          <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">{unavailabilityReason}</p>
          <div className="pt-2">
            <button
              onClick={handleFindCharger}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded-lg"
            >
              Retry Search with Wider Range
            </button>
          </div>
        </div>
      )}

      {/* SINGLE BEST RECOMMENDATION CARD */}
      {recommendation && (
        <div className="bg-white rounded-3xl border-2 border-emerald-500 p-6 sm:p-8 shadow-xl space-y-6 relative overflow-hidden animate-in fade-in slide-in-from-bottom-2">
          {/* Top Badge */}
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>GUARDIAN ANGEL OPTIMAL RECOMMENDATION</span>
            </div>
            <span className="text-xs font-mono font-bold text-slate-400">
              Score: {recommendation.ranking_score || 95}/100
            </span>
          </div>

          {/* Host & Location Summary */}
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              {recommendation.pod?.pod_name || 'Verified Household Pod'}
            </h2>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{recommendation.host?.household_location} (Approximate Area)</span>
            </p>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-bold">Driving Distance</p>
              <p className="text-lg font-black text-slate-900 mt-0.5">{recommendation.estimated_distance_km} km</p>
              <p className="text-[10px] text-slate-500">~{recommendation.estimated_eta_minutes} min travel</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-bold">Charging Power</p>
              <p className="text-lg font-black text-emerald-600 mt-0.5">{recommendation.pricing?.effectivePowerKw} kW</p>
              <p className="text-[10px] text-slate-500">Safe Continuous AC</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-bold">Rate Per Minute</p>
              <p className="text-lg font-black text-blue-600 mt-0.5">
                ₹{recommendation.pricing?.pricePerMinute.toFixed(2)}/min
              </p>
              <p className="text-[10px] text-slate-500">₹{recommendation.host?.electricity_tariff}/kWh</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-bold">Est. Total Max</p>
              <p className="text-lg font-black text-slate-900 mt-0.5">
                ₹{recommendation.pricing?.estimatedTotalCost.toFixed(2)}
              </p>
              <p className="text-[10px] text-slate-500">Max {recommendation.pricing?.maxSessionMinutes} min</p>
            </div>
          </div>

          {/* Rationale & Explainability Box */}
          <div className="p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-2xl space-y-2">
            <h4 className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Why Guardian Angel Selected This Charger</span>
            </h4>
            <p className="text-xs text-emerald-900 leading-relaxed font-medium">
              {recommendation.explanation}
            </p>
            <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {recommendation.matchReasons?.map((reason, idx) => (
                <div key={idx} className="flex items-start gap-1.5 text-[11px] text-emerald-800">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>{reason}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Safety Notice */}
          <p className="text-[11px] text-slate-500 text-center">
            🔒 Exact private host address is unlocked upon acceptance. Charging port is not reserved until host verifies your QR code on arrival.
          </p>

          {/* Actions: Accept vs Reject */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={handleAccept}
              className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-transform active:scale-[0.99]"
            >
              <span>Accept Recommendation & Navigate</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setRejectModalOpen(true)}
              className="px-6 py-3.5 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
            >
              Not Right For Me (Reject)
            </button>
          </div>
        </div>
      )}

      {/* Adaptive Rejection Reason Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Why are you rejecting this match?</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Guardian Angel adapts its ranking weights based on your feedback.
              </p>
            </div>

            <div className="space-y-2">
              {[
                { id: 'TOO_EXPENSIVE', label: 'Too expensive / High tariff' },
                { id: 'TOO_FAR_DETOUR', label: 'Too far or inconvenient detour' },
                { id: 'OUTSIDE_REACHABLE_RANGE', label: 'Outside my safe reachable range' },
                { id: 'SPEED_TOO_SLOW', label: 'Charging speed too slow' },
                { id: 'WAITING_TIME_TOO_LONG', label: 'Host availability or schedule inconvenient' },
                { id: 'INCOMPATIBLE_CONNECTOR', label: 'Incompatible socket or connector' },
                { id: 'OTHER', label: 'Other preferences' },
              ].map((opt) => (
                <label
                  key={opt.id}
                  onClick={() => setRejectionReason(opt.id as RejectionReason)}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-colors ${
                    rejectionReason === opt.id
                      ? 'border-blue-600 bg-blue-50/70 font-semibold text-blue-900'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="rejectionReason"
                    checked={rejectionReason === opt.id}
                    onChange={() => {}}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Additional Notes (Optional)</label>
              <textarea
                rows={2}
                placeholder="e.g. Prefer chargers under ₹8.50/kWh"
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRejectModalOpen(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={rejecting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg disabled:opacity-50"
              >
                {rejecting ? 'Adapting...' : 'Submit & Get Next Match'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
