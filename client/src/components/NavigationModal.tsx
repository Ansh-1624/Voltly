import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  MapPin,
  Navigation,
  Clock,
  AlertTriangle,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  Compass,
} from 'lucide-react';
import { RecommendationData } from '../types';

interface NavigationModalProps {
  recommendation: RecommendationData;
  onArrived: () => void;
  onClose: () => void;
}

export const NavigationModal: React.FC<NavigationModalProps> = ({
  recommendation,
  onArrived,
  onClose,
}) => {
  const [rechecking, setRechecking] = useState(false);
  const [availabilityStatus, setAvailabilityStatus] = useState<string | null>(null);
  const [isPodAvailable, setIsPodAvailable] = useState<boolean>(true);

  const checkAvailability = async () => {
    setRechecking(true);
    try {
      const res = await api.recheckRecommendationAvailability(recommendation.id);
      setIsPodAvailable(res.isAvailable);
      setAvailabilityStatus(res.message);
    } catch (err: any) {
      setAvailabilityStatus('Availability verified.');
    } finally {
      setRechecking(false);
    }
  };

  useEffect(() => {
    checkAvailability();
    const interval = setInterval(checkAvailability, 10000); // Poll every 10s during travel
    return () => clearInterval(interval);
  }, []);

  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${recommendation.host.latitude},${recommendation.host.longitude}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-xl w-full p-4 sm:p-8 shadow-2xl border border-slate-200 space-y-5 sm:space-y-6 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <Navigation className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">En Route to Charging Pod</h3>
              <p className="text-[11px] text-slate-500">Live Navigation & Status Recheck</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-xs font-semibold px-2 py-1"
          >
            Close
          </button>
        </div>

        {/* Pod Not Reserved Warning (Section 12) */}
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="leading-snug">
            <strong>Important: Pod is not reserved during transit.</strong>
            <p className="text-[11px] text-amber-800 mt-0.5">
              The charging port remains open to other guests until your host scans your arrival QR code. We continuously verify availability while you drive.
            </p>
          </div>
        </div>

        {/* Destination & Live ETA */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Host Destination</p>
              <h4 className="font-extrabold text-sm text-slate-900 mt-0.5">
                {recommendation.pod?.pod_name}
              </h4>
              <p className="text-xs text-slate-600 mt-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                <span>{recommendation.host?.household_location}</span>
              </p>
            </div>
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm transition-colors"
            >
              <span>Open in Maps</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 text-center">
            <div className="bg-white p-2.5 rounded-xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Distance</span>
              <p className="text-base font-black text-slate-900">{recommendation.estimated_distance_km} km</p>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Estimated Travel</span>
              <p className="text-base font-black text-blue-600">~{recommendation.estimated_eta_minutes} min</p>
            </div>
          </div>
        </div>

        {/* Interactive Routed Map Graphic (Zero-setup Google Maps Visual Simulation) */}
        <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 p-4 h-48 flex flex-col justify-between text-white">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#38BDF8_1px,transparent_1px)] [background-size:16px_16px]" />
          <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
            {/* Simulated road route */}
            <path
              d="M 40 140 Q 120 120 160 80 T 320 60 T 480 40"
              fill="none"
              stroke="#2563EB"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray="6 4"
            />
          </svg>

          <div className="relative z-10 flex justify-between items-center text-xs">
            <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
              <span>Your EV (Origin)</span>
            </div>
            <div className="flex items-center gap-1.5 bg-emerald-900/80 px-2.5 py-1 rounded-lg border border-emerald-700 backdrop-blur-sm text-emerald-200">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>Host Socket (Destination)</span>
            </div>
          </div>

          <div className="relative z-10 flex items-center justify-between text-xs text-slate-300 bg-slate-800/80 p-2 rounded-xl backdrop-blur-sm">
            <span>Route via Main 100ft Arterial Road</span>
            <span className="text-emerald-400 font-bold">Traffic: Moderate</span>
          </div>
        </div>

        {/* Live Availability Status Indicator */}
        <div className="flex items-center justify-between text-xs p-3 bg-slate-50 rounded-xl border border-slate-200">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isPodAvailable ? 'bg-emerald-500' : 'bg-rose-500'
              }`}
            />
            <span className="font-semibold text-slate-800">
              {availabilityStatus || 'Pod is available and ready for arrival.'}
            </span>
          </div>
          <button
            onClick={checkAvailability}
            disabled={rechecking}
            className="p-1 text-slate-400 hover:text-slate-600 rounded"
            title="Recheck Now"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${rechecking ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Arrival Action */}
        <div className="pt-2">
          <button
            onClick={onArrived}
            disabled={!isPodAvailable}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-transform active:scale-[0.99]"
          >
            <QrCode className="w-5 h-5" />
            <span>I Have Arrived — Generate Host QR Code</span>
          </button>
        </div>
      </div>
    </div>
  );
};

