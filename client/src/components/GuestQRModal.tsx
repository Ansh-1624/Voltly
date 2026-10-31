import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../services/api';
import {
  QrCode,
  ShieldCheck,
  Clock,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { RecommendationData } from '../types';

interface GuestQRModalProps {
  recommendation: RecommendationData;
  onSessionAuthorized: (session: any) => void;
  onClose: () => void;
}

export const GuestQRModal: React.FC<GuestQRModalProps> = ({
  recommendation,
  onSessionAuthorized,
  onClose,
}) => {
  const [token, setToken] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(600);

  const fetchToken = async () => {
    setLoading(true);
    setError(null);
    try {
      // Proximity check bypass set to true for easy desktop/demo testing
      const res = await api.generateQR(
        recommendation.id,
        recommendation.host.latitude,
        recommendation.host.longitude,
        true
      );
      setToken(res.token);
      setExpiresAt(res.expiresAt);
      setSecondsRemaining(600);
    } catch (err: any) {
      setError(err.message || 'Failed to generate QR token');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchToken();
  }, [recommendation.id]);

  // Countdown timer
  useEffect(() => {
    if (secondsRemaining <= 0) return;
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [secondsRemaining]);

  // Poll for host scan authorization
  useEffect(() => {
    if (!token) return;
    const interval = setInterval(async () => {
      try {
        const dashboard = await api.getGuestDashboard();
        if (dashboard.activeSession && dashboard.activeSession.pod_id === recommendation.pod.id) {
          clearInterval(interval);
          onSessionAuthorized(dashboard.activeSession);
        }
      } catch (_) {}
    }, 2500);

    return () => clearInterval(interval);
  }, [token, recommendation.pod.id]);

  const handleCopy = () => {
    if (token) {
      navigator.clipboard.writeText(token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatCountdown = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 text-center space-y-6">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <QrCode className="w-4 h-4" />
            </div>
            <div className="text-left">
              <h3 className="text-sm font-bold text-slate-900">Host Verification QR</h3>
              <p className="text-[11px] text-slate-500">Present to your host upon arrival</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-xs font-semibold px-2 py-1"
          >
            Close
          </button>
        </div>

        {loading && (
          <div className="py-12 flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-6 h-6 text-emerald-600 animate-spin" />
            <p className="text-xs text-slate-500">Generating cryptographic single-use token...</p>
          </div>
        )}

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs space-y-2">
            <AlertCircle className="w-5 h-5 mx-auto text-rose-600" />
            <p className="font-semibold">{error}</p>
            <button
              onClick={fetchToken}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold"
            >
              Retry Generation
            </button>
          </div>
        )}

        {token && !loading && (
          <>
            {/* QR Code Canvas */}
            <div className="p-3 sm:p-4 bg-slate-50 rounded-2xl border border-slate-200 inline-block mx-auto shadow-inner">
              <QRCodeSVG
                value={token}
                size={190}
                level="H"
                includeMargin={true}
                className="rounded-lg max-w-full h-auto"
              />
            </div>

            {/* Expiry Badge */}
            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-600">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>
                Token Expires In:{' '}
                <strong
                  className={secondsRemaining < 60 ? 'text-rose-600 font-bold' : 'text-slate-900'}
                >
                  {formatCountdown(secondsRemaining)}
                </strong>
              </span>
            </div>

            {/* Token Copy Tool for Single-Screen Demo Testing */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-left space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-slate-500">
                  Cryptographic Token (Copy for Host Scanner)
                </span>
                <button
                  onClick={handleCopy}
                  className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <p className="font-mono text-[10px] text-slate-600 break-all bg-white p-2 rounded border border-slate-200">
                {token}
              </p>
            </div>

            {/* Listening Banner */}
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-center gap-2 text-xs text-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Waiting for host to scan and authorize session...</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

