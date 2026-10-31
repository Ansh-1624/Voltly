import React, { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { api } from '../services/api';
import { QrCode, Camera, AlertCircle, CheckCircle2, Zap, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';

interface HostQRScannerProps {
  onSessionStarted: (session: any) => void;
  onClose: () => void;
}

export const HostQRScanner: React.FC<HostQRScannerProps> = ({ onSessionStarted, onClose }) => {
  const [tokenInput, setTokenInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;
    try {
      scanner = new Html5QrcodeScanner(
        'qr-reader-container',
        { fps: 10, qrbox: { width: 220, height: 220 } },
        false
      );

      scanner.render(
        (decodedText) => {
          handleScanToken(decodedText);
          if (scanner) {
            scanner.clear();
          }
        },
        (_errorMessage) => {
          // ignore scan frame errors
        }
      );
    } catch (e) {
      console.warn('Camera scanner initialization bypassed:', e);
    }

    return () => {
      if (scanner) {
        scanner.clear().catch(() => {});
      }
    };
  }, []);

  const handleScanToken = async (rawToken: string) => {
    if (!rawToken || loading) return;
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await api.scanQR(rawToken.trim());
      if (res.success && res.session) {
        setSuccessMessage(res.message);
        try {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.7 },
          });
        } catch (_) {}

        setTimeout(() => {
          onSessionStarted(res.session);
        }, 1200);
      } else {
        setError(res.error || 'Failed to authorize QR token');
      }
    } catch (err: any) {
      setError(err.message || 'Verification error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Scan Guest QR Code</h3>
              <p className="text-[11px] text-slate-500">Authorize and start charging session</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-xs font-semibold px-2 py-1 rounded"
          >
            Close
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Camera Feed Container */}
        <div className="mb-4 bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
          <div id="qr-reader-container" className="w-full text-xs" />
        </div>

        {/* Manual Token Fallback */}
        <div className="space-y-3 pt-3 border-t border-slate-100">
          <label className="block text-[11px] font-bold text-slate-700">
            Or paste cryptographic token manually:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Paste 64-char QR token..."
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
            />
            <button
              onClick={() => handleScanToken(tokenInput)}
              disabled={loading || !tokenInput}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg disabled:opacity-50 transition-colors flex items-center gap-1"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Verify</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
