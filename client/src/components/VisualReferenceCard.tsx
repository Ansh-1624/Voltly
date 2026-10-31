import React from 'react';
import { CheckCircle2, HelpCircle } from 'lucide-react';

export interface VisualOption {
  id: string;
  label: string;
  subtitle: string;
  description: string;
  tag?: string;
  isNotSure?: boolean;
  visual: React.ReactNode;
}

interface VisualReferenceSelectorProps {
  title: string;
  subtitle: string;
  options: VisualOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  helperText?: string;
}

export const VisualReferenceSelector: React.FC<VisualReferenceSelectorProps> = ({
  title,
  subtitle,
  options,
  selectedId,
  onSelect,
  helperText,
}) => {
  return (
    <div className="space-y-3">
      <div>
        <h4 className="text-sm font-bold text-slate-900">{title}</h4>
        <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {options.map((opt) => {
          const isSelected = selectedId === opt.id;
          return (
            <div
              key={opt.id}
              onClick={() => onSelect(opt.id)}
              className={`relative cursor-pointer rounded-xl border-2 p-3 transition-all duration-200 flex flex-col justify-between ${
                isSelected
                  ? 'border-emerald-600 bg-emerald-50/60 shadow-sm ring-1 ring-emerald-600'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
              }`}
            >
              {isSelected && (
                <div className="absolute top-2.5 right-2.5 text-emerald-600">
                  <CheckCircle2 className="w-5 h-5 fill-emerald-100" />
                </div>
              )}

              {/* Visual Graphic */}
              <div className="h-28 w-full bg-slate-50 rounded-lg flex items-center justify-center p-2 mb-2 border border-slate-100 overflow-hidden">
                {opt.visual}
              </div>

              {/* Text Info */}
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-xs text-slate-900">{opt.label}</span>
                  {opt.tag && (
                    <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded">
                      {opt.tag}
                    </span>
                  )}
                </div>
                <p className="text-[11px] font-medium text-slate-600 mt-0.5">{opt.subtitle}</p>
                <p className="text-[10px] text-slate-500 mt-1 leading-snug">{opt.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      {helperText && (
        <div className="flex items-start gap-1.5 text-[11px] text-slate-500 bg-blue-50/60 border border-blue-100 rounded-lg p-2.5">
          <HelpCircle className="w-3.5 h-3.5 text-blue-600 mt-0.5 flex-shrink-0" />
          <span>{helperText}</span>
        </div>
      )}
    </div>
  );
};

// ========================================================
// PRE-BUILT VISUAL GRAPHICS (SVG illustrations)
// ========================================================

/** 16A Heavy Duty 3-Pin Socket (Large Earth pin, 16 Amp rated) */
export const Svg16ASocket = () => (
  <svg viewBox="0 0 120 120" className="w-20 h-20 text-slate-700">
    <rect x="15" y="15" width="90" height="90" rx="12" fill="#F1F5F9" stroke="#94A3B8" strokeWidth="3" />
    <circle cx="25" cy="25" r="3" fill="#CBD5E1" />
    <circle cx="95" cy="25" r="3" fill="#CBD5E1" />
    <circle cx="25" cy="95" r="3" fill="#CBD5E1" />
    <circle cx="95" cy="95" r="3" fill="#CBD5E1" />
    {/* Earth pin (Large hole top) */}
    <circle cx="60" cy="42" r="10" fill="#0F172A" />
    <circle cx="60" cy="42" r="6" fill="#16A34A" />
    {/* Live & Neutral pins */}
    <circle cx="42" cy="74" r="7" fill="#0F172A" />
    <circle cx="78" cy="74" r="7" fill="#0F172A" />
    <text x="60" y="100" textAnchor="middle" fontSize="9" fontWeight="700" fill="#2563EB">16A POWER</text>
  </svg>
);

/** 6A Standard Domestic 3-Pin Socket (Small pins, low power) */
export const Svg6ASocket = () => (
  <svg viewBox="0 0 120 120" className="w-20 h-20 text-slate-700">
    <rect x="20" y="20" width="80" height="80" rx="8" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="2.5" />
    {/* Earth pin (Small) */}
    <circle cx="60" cy="45" r="6" fill="#475569" />
    {/* Live & Neutral (Small) */}
    <circle cx="46" cy="72" r="4.5" fill="#475569" />
    <circle cx="74" cy="72" r="4.5" fill="#475569" />
    <text x="60" y="94" textAnchor="middle" fontSize="8" fontWeight="600" fill="#64748B">6A DOMESTIC</text>
  </svg>
);

/** Earthing: Proper Ground Pit Illustration */
export const SvgProperEarthing = () => (
  <svg viewBox="0 0 140 100" className="w-28 h-20">
    {/* Ground level */}
    <line x1="10" y1="55" x2="130" y2="55" stroke="#78350F" strokeWidth="3" strokeDasharray="4 2" />
    {/* Earth pipe & electrode */}
    <rect x="66" y="20" width="8" height="60" rx="2" fill="#16A34A" />
    {/* Earth pit copper plate */}
    <rect x="45" y="75" width="50" height="8" rx="2" fill="#B45309" />
    {/* Grounding symbol */}
    <line x1="60" y1="88" x2="80" y2="88" stroke="#16A34A" strokeWidth="2.5" />
    <line x1="65" y1="92" x2="75" y2="92" stroke="#16A34A" strokeWidth="2.5" />
    <line x1="68" y1="96" x2="72" y2="96" stroke="#16A34A" strokeWidth="2" />
    {/* Wire coming from socket */}
    <path d="M 30 20 L 66 35" fill="none" stroke="#16A34A" strokeWidth="3" />
    <circle cx="30" cy="20" r="4" fill="#16A34A" />
    <text x="70" y="15" textAnchor="middle" fontSize="8" fontWeight="700" fill="#166534">VERIFIED GROUND</text>
  </svg>
);

/** Electricity Bill Example: Showing Sanctioned Load */
export const SvgElectricityBill = () => (
  <svg viewBox="0 0 140 100" className="w-28 h-20">
    {/* Bill paper */}
    <rect x="15" y="10" width="110" height="80" rx="4" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="1.5" />
    {/* Header */}
    <rect x="20" y="15" width="50" height="6" rx="2" fill="#2563EB" />
    <line x1="20" y1="28" x2="105" y2="28" stroke="#E2E8F0" strokeWidth="2" />
    {/* Highlighted box for Sanctioned Load */}
    <rect x="20" y="36" width="100" height="24" rx="4" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="1.5" />
    <text x="25" y="46" fontSize="7" fontWeight="600" fill="#92400E">Sanctioned Load:</text>
    <text x="25" y="56" fontSize="9" fontWeight="800" fill="#B45309">5.0 kW (1-Phase)</text>
    {/* Lines for other bill text */}
    <line x1="20" y1="68" x2="90" y2="68" stroke="#CBD5E1" strokeWidth="2" />
    <line x1="20" y1="76" x2="75" y2="76" stroke="#CBD5E1" strokeWidth="2" />
  </svg>
);

/** Type 2 (Mennekes) 7-Pin AC EV Connector */
export const SvgType2Connector = () => (
  <svg viewBox="0 0 120 120" className="w-20 h-20">
    <circle cx="60" cy="60" r="45" fill="#1E293B" stroke="#2563EB" strokeWidth="3" />
    {/* 7 pins in circular arrangement */}
    <circle cx="60" cy="35" r="5" fill="#38BDF8" />
    <circle cx="40" cy="48" r="6" fill="#F8FAFC" />
    <circle cx="80" cy="48" r="6" fill="#F8FAFC" />
    <circle cx="45" cy="72" r="7" fill="#F8FAFC" />
    <circle cx="75" cy="72" r="7" fill="#F8FAFC" />
    <circle cx="60" cy="62" r="5" fill="#4ADE80" />
    <circle cx="60" cy="88" r="4" fill="#38BDF8" />
    <text x="60" y="112" textAnchor="middle" fontSize="8" fontWeight="700" fill="#2563EB">TYPE-2 (IEC 62196)</text>
  </svg>
);

/** Portable EVSE Cable Unit */
export const SvgPortableEVSE = () => (
  <svg viewBox="0 0 140 100" className="w-28 h-20">
    {/* Wall plug (left) */}
    <rect x="15" y="42" width="16" height="16" rx="3" fill="#334155" />
    <line x1="10" y1="46" x2="15" y2="46" stroke="#94A3B8" strokeWidth="2" />
    <line x1="10" y1="54" x2="15" y2="54" stroke="#94A3B8" strokeWidth="2" />
    {/* Cable segment 1 */}
    <path d="M 31 50 Q 42 50 48 50" fill="none" stroke="#0F172A" strokeWidth="4" />
    {/* Controller Brick in middle */}
    <rect x="48" y="32" width="44" height="36" rx="6" fill="#0F172A" stroke="#16A34A" strokeWidth="2" />
    {/* LEDs on brick */}
    <circle cx="60" cy="44" r="2.5" fill="#22C55E" />
    <circle cx="70" cy="44" r="2.5" fill="#38BDF8" />
    <circle cx="80" cy="44" r="2.5" fill="#E2E8F0" />
    <text x="70" y="58" textAnchor="middle" fontSize="6" fontWeight="700" fill="#94A3B8">EVSE 16A</text>
    {/* Cable segment 2 */}
    <path d="M 92 50 Q 102 50 110 50" fill="none" stroke="#0F172A" strokeWidth="4" />
    {/* Vehicle Gun (right) */}
    <path d="M 110 40 L 126 40 L 130 60 L 118 60 Z" fill="#334155" />
  </svg>
);

/** Question Mark / Not Sure Graphic */
export const SvgNotSure = () => (
  <div className="flex flex-col items-center justify-center text-slate-400">
    <HelpCircle className="w-10 h-10 text-amber-500 stroke-[1.5]" />
    <span className="text-[10px] font-bold text-slate-500 mt-1">Not Sure</span>
  </div>
);
