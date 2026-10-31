import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  VisualReferenceSelector,
  Svg16ASocket,
  Svg6ASocket,
  SvgProperEarthing,
  SvgElectricityBill,
  SvgNotSure,
} from './VisualReferenceCard';
import {
  ShieldAlert,
  Zap,
  MapPin,
  CheckCircle,
  HelpCircle,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';

export const HostOnboarding: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const { user, refreshProfile } = useAuth();

  // Step state (1: Location & Power, 2: Electrical Verification, 3: Pod Setup)
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [householdLocation, setHouseholdLocation] = useState(
    'Indiranagar 100ft Road, Bengaluru, Karnataka'
  );
  const [latitude, setLatitude] = useState(12.9716);
  const [longitude, setLongitude] = useState(77.6412);
  const [supplyType, setSupplyType] = useState('SINGLE_PHASE');
  const [sanctionedLoadKw, setSanctionedLoadKw] = useState('5.0');
  const [electricityTariff, setElectricityTariff] = useState(8.5);

  // Visual Reference Selections
  const [selectedSocketType, setSelectedSocketType] = useState('16A_3PIN');
  const [selectedEarthing, setSelectedEarthing] = useState('PROPER');
  const [checkedByElectrician, setCheckedByElectrician] = useState(true);
  const [noVisibleDamage, setNoVisibleDamage] = useState(true);

  // Initial Pod
  const [podName, setPodName] = useState('Home Driveway Pod 1');
  const [availabilitySchedule, setAvailabilitySchedule] = useState('All days, 07:00 AM - 10:00 PM');

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(Number(pos.coords.latitude.toFixed(4)));
          setLongitude(Number(pos.coords.longitude.toFixed(4)));
        },
        () => {
          // Default to Bangalore
          setLatitude(12.9716);
          setLongitude(77.6412);
        }
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const earthingConfirmed = selectedEarthing === 'PROPER';

      // 1. Save Host Profile
      await api.saveHostProfile({
        household_location: householdLocation,
        latitude,
        longitude,
        electricity_supply_type: supplyType,
        sanctioned_load_kw: Number(sanctionedLoadKw) || 5.0,
        electricity_tariff: Number(electricityTariff),
        earthing_confirmed: earthingConfirmed,
        checked_by_electrician: checkedByElectrician,
        notes: noVisibleDamage ? 'Socket visual check confirmed.' : 'Requires safety check.',
      });

      // 2. Add Initial Pod
      await api.addHostPod({
        pod_name: podName,
        socket_type: selectedSocketType,
        rated_current_a: 16,
        rated_voltage_v: 230,
        verified_safe_power_kw: 3.3,
        earthing_status: selectedEarthing,
        availability_schedule: availabilitySchedule,
      });

      await refreshProfile();
      onComplete();
    } catch (err: any) {
      setError(err.message || 'Failed to complete host onboarding.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-3">
          <Zap className="w-3.5 h-3.5" />
          <span>Host Port Registration</span>
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">List Your Household Charging Port</h2>
        <p className="text-xs text-slate-500 mt-1 max-w-lg mx-auto">
          Share your 16A socket with EV owners and earn per kilowatt-hour. We guide you visually through every safety specification.
        </p>

        {/* Step Tabs */}
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            type="button"
            onClick={() => setStep(1)}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
              step === 1 ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            1. Location & Load
          </button>
          <span className="text-slate-300">/</span>
          <button
            type="button"
            onClick={() => setStep(2)}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
              step === 2 ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            2. Electrical Verification
          </button>
          <span className="text-slate-300">/</span>
          <button
            type="button"
            onClick={() => setStep(3)}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
              step === 3 ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            3. Charging Pod Details
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
        {/* STEP 1: Location & Supply */}
        {step === 1 && (
          <div className="space-y-5 animate-in fade-in">
            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1">Household Location / Street Address</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={householdLocation}
                  onChange={(e) => setHouseholdLocation(e.target.value)}
                  placeholder="e.g. 12th Main, HAL 2nd Stage, Indiranagar, Bengaluru"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 pr-24"
                />
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  className="absolute right-1.5 top-1.5 px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-medium flex items-center gap-1 transition-colors"
                >
                  <MapPin className="w-3 h-3 text-emerald-600" />
                  GPS Pin
                </button>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Coordinates: {latitude}, {longitude}
              </p>
            </div>

            {/* Supply Type */}
            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1">Electricity Supply Type</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'SINGLE_PHASE', label: 'Single Phase', desc: 'Standard 230V residential' },
                  { id: 'THREE_PHASE', label: 'Three Phase', desc: 'Commercial or heavy home 415V' },
                  { id: 'NOT_SURE', label: 'Not Sure', desc: 'We will inspect during review' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSupplyType(s.id)}
                    className={`p-3 text-left border rounded-xl transition-all ${
                      supplyType === s.id
                        ? 'border-emerald-600 bg-emerald-50/70 ring-1 ring-emerald-600'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <p className="text-xs font-bold text-slate-900">{s.label}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{s.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Sanctioned Load with Visual Bill Reference */}
            <VisualReferenceSelector
              title="Sanctioned Load from Electricity Bill"
              subtitle="Where sanctioned load appears on typical residential electricity bills (BESCOM, Tata Power, Adani, etc.)"
              selectedId={sanctionedLoadKw}
              onSelect={setSanctionedLoadKw}
              helperText="Sanctioned load is the maximum power your electrical meter is approved to draw. EV charging on 16A uses ~3.3 kW."
              options={[
                {
                  id: '5.0',
                  label: '5.0 kW (Recommended)',
                  subtitle: 'Ideal for 16A charging',
                  description: 'Safely accommodates household appliances plus 16A EV load.',
                  tag: 'Common',
                  visual: <SvgElectricityBill />,
                },
                {
                  id: '3.0',
                  label: '3.0 kW - 4.0 kW',
                  subtitle: 'Moderate Capacity',
                  description: 'Adequate for charging when heavy appliances (AC/geysers) are off.',
                  visual: <SvgElectricityBill />,
                },
                {
                  id: 'NOT_SURE',
                  label: 'Not Sure',
                  subtitle: 'Awaiting Bill Review',
                  description: 'Admin team will check from your bill copy.',
                  isNotSure: true,
                  visual: <SvgNotSure />,
                },
              ]}
            />

            {/* Electricity Tariff */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-900">Electricity Tariff (₹ per kWh)</label>
                <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  ₹{electricityTariff.toFixed(2)} / kWh
                </span>
              </div>
              <input
                type="range"
                min="5.0"
                max="15.0"
                step="0.5"
                value={electricityTariff}
                onChange={(e) => setElectricityTariff(parseFloat(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
              <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5 text-blue-500" />
                <span>
                  1 unit on your electricity bill = 1 kWh. For a 3.3 kW charging session, this equates to approx{' '}
                  <strong className="text-slate-800">₹{((3.3 / 60) * electricityTariff).toFixed(2)}/minute</strong>.
                </span>
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
              >
                <span>Continue to Electrical Verification</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Electrical Verification */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in">
            {/* Visual Socket Selector */}
            <VisualReferenceSelector
              title="Socket Type Identification"
              subtitle="Confirm you have a dedicated 16-Ampere 3-pin power outlet"
              selectedId={selectedSocketType}
              onSelect={setSelectedSocketType}
              helperText="16A sockets have noticeably thicker pin holes than regular 6A plug points used for mobile chargers."
              options={[
                {
                  id: '16A_3PIN',
                  label: '16A Power Socket (Large)',
                  subtitle: 'Heavy Duty 3-Pin Outlet',
                  description: 'Thick round pin holes, rated for continuous AC charging up to 3.68 kW.',
                  tag: 'Required',
                  visual: <Svg16ASocket />,
                },
                {
                  id: '6A_3PIN',
                  label: '6A Domestic Socket (Small)',
                  subtitle: 'Standard Home Socket',
                  description: 'Narrow pins. Incompatible with EVSE fast continuous draw.',
                  visual: <Svg6ASocket />,
                },
                {
                  id: 'NOT_SURE',
                  label: 'Not Sure / Other',
                  subtitle: 'Requires Review',
                  description: 'Our admin inspector will assist with socket identification.',
                  isNotSure: true,
                  visual: <SvgNotSure />,
                },
              ]}
            />

            {/* Visual Earthing Selector */}
            <VisualReferenceSelector
              title="Grounding & Earthing Verification"
              subtitle="Proper earthing is mandatory for EV charging safety and to prevent electric shock"
              selectedId={selectedEarthing}
              onSelect={setSelectedEarthing}
              helperText="EV portable chargers check for earthing impedance before delivering current. Charging will fail without proper ground."
              options={[
                {
                  id: 'PROPER',
                  label: 'Dedicated Proper Earthing',
                  subtitle: 'Earthing Pit / Ground Spike',
                  description: 'Third pin is bonded to a dedicated copper plate or pipe in the soil.',
                  tag: 'Safe',
                  visual: <SvgProperEarthing />,
                },
                {
                  id: 'UNCERTAIN',
                  label: 'Uncertain Earthing',
                  subtitle: 'Not Checked Recently',
                  description: 'Socket third pin is present but ground quality is untested.',
                  visual: <SvgNotSure />,
                },
                {
                  id: 'NONE',
                  label: 'No Earthing / 2-Wire',
                  subtitle: 'Unsafe for EV charging',
                  description: 'Old two-wire wiring without a physical earth connection.',
                  visual: <SvgNotSure />,
                },
              ]}
            />

            {/* Safety Declarations */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <h5 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-emerald-600" />
                <span>Host Safety Declarations</span>
              </h5>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checkedByElectrician}
                  onChange={(e) => setCheckedByElectrician(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-xs text-slate-700 leading-tight">
                  I confirm this socket and wiring installation has been checked by a qualified electrician with an appropriate MCB (Miniature Circuit Breaker).
                </span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={noVisibleDamage}
                  onChange={(e) => setNoVisibleDamage(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-xs text-slate-700 leading-tight">
                  No visible scorch marks, melted plastic, or loose wire connections on the socket faceplate.
                </span>
              </label>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold text-xs rounded-xl"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5"
              >
                <span>Continue to Pod Setup</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Charging Pod Setup */}
        {step === 3 && (
          <div className="space-y-5 animate-in fade-in">
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-900 leading-relaxed">
              <strong>Pod Limits:</strong> Each host household may list up to{' '}
              <strong>2 physical charging pods</strong>, with 1 simultaneous active session by default.
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1">Charging Pod Name / Location Identifier</label>
              <input
                type="text"
                required
                value={podName}
                onChange={(e) => setPodName(e.target.value)}
                placeholder="e.g. Ground Floor Driveway Port"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1">Availability Schedule</label>
              <input
                type="text"
                required
                value={availabilitySchedule}
                onChange={(e) => setAvailabilitySchedule(e.target.value)}
                placeholder="e.g. All days, 06:00 AM - 11:00 PM"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Responsibility Notice */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 leading-relaxed">
              <strong className="text-slate-900 block mb-1">Equipment Boundary:</strong>
              As host, you supply the approved 16A socket and parking spot. The guest brings their own portable EVSE cable. Voltly does not certify electrical installations; uncertain safety entries undergo manual verification.
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-between">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold text-xs rounded-xl"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow-md shadow-emerald-600/20 disabled:opacity-50"
              >
                {loading ? 'Submitting Application...' : 'Complete & Submit for Verification'}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};
