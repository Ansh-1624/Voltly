import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  VisualReferenceSelector,
  Svg16ASocket,
  Svg6ASocket,
  SvgType2Connector,
  SvgPortableEVSE,
  SvgNotSure,
} from './VisualReferenceCard';
import {
  Zap,
  Car,
  Bike,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { VehicleModel, VehicleCategory } from '../types';

export const DEFAULT_VEHICLE_MODELS: VehicleModel[] = [
  {
    id: 'vm-nexon-ev',
    manufacturer: 'Tata Motors',
    model: 'Nexon EV',
    variant: 'Empowered Plus LR',
    category: 'FOUR_WHEELER',
    battery_capacity_kwh: 40.5,
    ac_charging_supported: true,
    max_ac_charging_power_kw: 3.3,
    vehicle_connector: 'IEC_62196_TYPE_2',
    specification_verified: true,
    typical_range_km: 320,
  },
  {
    id: 'vm-mg-zs',
    manufacturer: 'MG',
    model: 'ZS EV',
    variant: 'Exclusive Pro',
    category: 'FOUR_WHEELER',
    battery_capacity_kwh: 50.3,
    ac_charging_supported: true,
    max_ac_charging_power_kw: 3.3,
    vehicle_connector: 'IEC_62196_TYPE_2',
    specification_verified: true,
    typical_range_km: 380,
  },
  {
    id: 'vm-tiago-ev',
    manufacturer: 'Tata Motors',
    model: 'Tiago EV',
    variant: 'XT LR',
    category: 'FOUR_WHEELER',
    battery_capacity_kwh: 24.0,
    ac_charging_supported: true,
    max_ac_charging_power_kw: 3.3,
    vehicle_connector: 'IEC_62196_TYPE_2',
    specification_verified: true,
    typical_range_km: 210,
  },
  {
    id: 'vm-ather-450x',
    manufacturer: 'Ather Energy',
    model: '450X',
    variant: 'Gen 3 Apex',
    category: 'TWO_WHEELER',
    battery_capacity_kwh: 3.7,
    ac_charging_supported: true,
    max_ac_charging_power_kw: 1.4,
    vehicle_connector: 'IEC_62196_TYPE_2',
    specification_verified: true,
    typical_range_km: 110,
  },
  {
    id: 'vm-ola-s1-pro',
    manufacturer: 'Ola Electric',
    model: 'S1 Pro',
    variant: 'Gen 2',
    category: 'TWO_WHEELER',
    battery_capacity_kwh: 4.0,
    ac_charging_supported: true,
    max_ac_charging_power_kw: 1.5,
    vehicle_connector: '16A_3PIN',
    specification_verified: true,
    typical_range_km: 145,
  },
  {
    id: 'vm-tvs-iqube',
    manufacturer: 'TVS',
    model: 'iQube',
    variant: 'ST 5.1 kWh',
    category: 'TWO_WHEELER',
    battery_capacity_kwh: 5.1,
    ac_charging_supported: true,
    max_ac_charging_power_kw: 1.0,
    vehicle_connector: '16A_3PIN',
    specification_verified: true,
    typical_range_km: 150,
  },
];

export const GuestOnboarding: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const { user, refreshProfile } = useAuth();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Catalogue
  const [catalogue, setCatalogue] = useState<VehicleModel[]>(DEFAULT_VEHICLE_MODELS);
  const [selectedCategory, setSelectedCategory] = useState<VehicleCategory>('FOUR_WHEELER');
  const [selectedModelId, setSelectedModelId] = useState<string>('vm-nexon-ev');

  // Custom vehicle fallback
  const [customManufacturer, setCustomManufacturer] = useState('');
  const [customModel, setCustomModel] = useState('');
  const [batteryCapacityKwh, setBatteryCapacityKwh] = useState(40.5);
  const [maxAcPowerKw, setMaxAcPowerKw] = useState(3.3);
  const [vehicleConnector, setVehicleConnector] = useState('IEC_62196_TYPE_2');

  // Portable EVSE Details
  const [evseMakeModel, setEvseMakeModel] = useState('OEM Portable 16A Charging Cable');
  const [evseSupplyPlug, setEvseSupplyPlug] = useState('16A_3PIN');
  const [evseRatedPowerKw, setEvseRatedPowerKw] = useState(3.3);
  const [evseVehicleConnector, setEvseVehicleConnector] = useState('IEC_62196_TYPE_2');

  useEffect(() => {
    api.getVehicleCatalogue()
      .then((res) => {
        if (res?.models && res.models.length > 0) {
          setCatalogue(res.models);
        }
      })
      .catch((err) => {
        console.warn('API catalogue fetch fallback to defaults:', err);
      });
  }, [selectedCategory]);

  const handleSelectModel = (id: string) => {
    setSelectedModelId(id);
    const m = catalogue.find((v) => v.id === id);
    if (m) {
      setBatteryCapacityKwh(m.battery_capacity_kwh);
      setMaxAcPowerKw(m.max_ac_charging_power_kw);
      setVehicleConnector(m.vehicle_connector);
      setEvseVehicleConnector(m.vehicle_connector);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await api.saveGuestOnboarding({
        vehicle_category: selectedCategory,
        vehicle_model_id: selectedModelId === 'custom' ? undefined : selectedModelId,
        custom_manufacturer: selectedModelId === 'custom' ? customManufacturer : undefined,
        custom_model: selectedModelId === 'custom' ? customModel : undefined,
        battery_capacity_kwh: batteryCapacityKwh,
        vehicle_connector: vehicleConnector,
        max_ac_power_kw: maxAcPowerKw,
        ac_charging_supported: true,
        evse_make_model: evseMakeModel,
        evse_supply_plug: evseSupplyPlug,
        evse_rated_power_kw: evseRatedPowerKw,
        evse_vehicle_connector: evseVehicleConnector,
      });

      await refreshProfile();
      onComplete();
    } catch (err: any) {
      setError(err.message || 'Failed to save vehicle details');
    } finally {
      setLoading(false);
    }
  };

  const filteredCatalogue = catalogue.filter((v) => v.category === selectedCategory);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold mb-3">
          <Zap className="w-3.5 h-3.5" />
          <span>Guest EV Onboarding</span>
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Register Your Electric Vehicle</h2>
        <p className="text-xs text-slate-500 mt-1 max-w-lg mx-auto">
          We match you only with verified hosts whose 16A sockets and power supplies are 100% compatible with your EV and portable cable.
        </p>

        {/* Steps */}
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            type="button"
            onClick={() => setStep(1)}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
              step === 1 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            1. Vehicle Selection
          </button>
          <span className="text-slate-300">/</span>
          <button
            type="button"
            onClick={() => setStep(2)}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
              step === 2 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            2. Portable EVSE & Plugs
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm space-y-6">
        {/* STEP 1: Vehicle Category & Model */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in">
            {/* Category Toggle */}
            <div>
              <label className="block text-xs font-bold text-slate-900 mb-2">Vehicle Category</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedCategory('FOUR_WHEELER')}
                  className={`p-4 rounded-xl border-2 flex items-center gap-3 transition-all ${
                    selectedCategory === 'FOUR_WHEELER'
                      ? 'border-blue-600 bg-blue-50/60 ring-1 ring-blue-600 text-blue-900'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <Car className="w-6 h-6 text-blue-600" />
                  <div className="text-left">
                    <p className="text-xs font-bold">Four-Wheeler (Car / SUV)</p>
                    <p className="text-[11px] text-slate-500">Max 120-min session duration</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedCategory('TWO_WHEELER')}
                  className={`p-4 rounded-xl border-2 flex items-center gap-3 transition-all ${
                    selectedCategory === 'TWO_WHEELER'
                      ? 'border-blue-600 bg-blue-50/60 ring-1 ring-blue-600 text-blue-900'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <Bike className="w-6 h-6 text-blue-600" />
                  <div className="text-left">
                    <p className="text-xs font-bold">Two-Wheeler (Scooter / Bike)</p>
                    <p className="text-[11px] text-slate-500">Max 60-min session duration</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Vehicle Model Catalogue Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-900 mb-2">
                Select Your EV Model (Verified Specifications Autofill)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {filteredCatalogue.map((m) => {
                  const isSelected = selectedModelId === m.id;
                  return (
                    <div
                      key={m.id}
                      onClick={() => handleSelectModel(m.id)}
                      className={`cursor-pointer rounded-xl border-2 p-3 transition-all ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/60 ring-1 ring-blue-600'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-slate-400">{m.manufacturer}</span>
                        {m.specification_verified && (
                          <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                        )}
                      </div>
                      <p className="text-xs font-bold text-slate-900 mt-0.5">{m.model}</p>
                      <p className="text-[10px] text-slate-500">{m.variant}</p>
                      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-medium text-slate-600">
                        <span>{m.battery_capacity_kwh} kWh</span>
                        <span>{m.max_ac_charging_power_kw} kW AC</span>
                      </div>
                    </div>
                  );
                })}

                {/* Custom entry option */}
                <div
                  onClick={() => setSelectedModelId('custom')}
                  className={`cursor-pointer rounded-xl border-2 p-3 transition-all flex flex-col justify-center items-center text-center ${
                    selectedModelId === 'custom'
                      ? 'border-blue-600 bg-blue-50/60 ring-1 ring-blue-600'
                      : 'border-slate-200 border-dashed hover:border-slate-300'
                  }`}
                >
                  <p className="text-xs font-bold text-slate-900">Custom EV</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Not in catalogue</p>
                </div>
              </div>
            </div>

            {/* Custom vehicle manual inputs if custom selected */}
            {selectedModelId === 'custom' && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <p className="text-xs font-bold text-slate-900">Enter Custom Vehicle Specifications:</p>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    required
                    placeholder="Manufacturer"
                    value={customManufacturer}
                    onChange={(e) => setCustomManufacturer(e.target.value)}
                    className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Model"
                    value={customModel}
                    onChange={(e) => setCustomModel(e.target.value)}
                    className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Battery (kWh)</label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={batteryCapacityKwh}
                      onChange={(e) => setBatteryCapacityKwh(parseFloat(e.target.value))}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Max AC Power (kW)</label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={maxAcPowerKw}
                      onChange={(e) => setMaxAcPowerKw(parseFloat(e.target.value))}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
              >
                <span>Continue to EVSE Cable Details</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Portable EVSE and Connector Ends */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in">
            {/* Visual EVSE Graphic Card */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center gap-4">
              <div className="p-2 bg-white rounded-lg border border-slate-200">
                <SvgPortableEVSE />
              </div>
              <div className="text-left text-xs">
                <h4 className="font-bold text-slate-900">Understanding Your Portable EVSE</h4>
                <p className="text-slate-500 mt-1 leading-relaxed">
                  Your portable cable has two ends: (1) The <strong>Wall End</strong> that plugs into the host's 16A socket, and (2) the <strong>Vehicle Gun</strong> that plugs into your car. Both must be verified for compatibility.
                </p>
              </div>
            </div>

            {/* Visual Supply-side Plug Selector */}
            <VisualReferenceSelector
              title="End 1: Supply Plug (Plugs into Host Household Socket)"
              subtitle="Identify the wall plug of your portable EVSE cable"
              selectedId={evseSupplyPlug}
              onSelect={setEvseSupplyPlug}
              helperText="Most OEM portable cables supplied by Tata, MG, Ather, and Ola feature a 16A heavy-duty 3-pin plug."
              options={[
                {
                  id: '16A_3PIN',
                  label: '16A 3-Pin Plug (Large)',
                  subtitle: 'Heavy Duty 3-Pin Plug',
                  description: 'Thick round brass/nickel pins with large earth prong.',
                  tag: 'Standard',
                  visual: <Svg16ASocket />,
                },
                {
                  id: '6A_3PIN',
                  label: '6A Domestic 3-Pin (Small)',
                  subtitle: 'Low Power Plug',
                  description: 'Narrow pins. Generally restricted to low-draw 2W trickle units.',
                  visual: <Svg6ASocket />,
                },
                {
                  id: 'NOT_SURE',
                  label: 'Not Sure',
                  subtitle: 'Requires Assistance',
                  description: 'Contact Voltly support to verify plug rating.',
                  isNotSure: true,
                  visual: <SvgNotSure />,
                },
              ]}
            />

            {/* Visual Vehicle Connector Selector */}
            <VisualReferenceSelector
              title="End 2: Vehicle Connector (Plugs into Your EV)"
              subtitle="Select your EV's AC charging port"
              selectedId={evseVehicleConnector}
              onSelect={setEvseVehicleConnector}
              helperText="Type 2 (IEC 62196 Mennekes) is the Indian national AC standard for 4-wheelers and high-speed 2-wheelers."
              options={[
                {
                  id: 'IEC_62196_TYPE_2',
                  label: 'Type 2 (IEC 62196)',
                  subtitle: '7-Pin Round Mennekes',
                  description: 'Used by Tata Nexon, MG ZS, Tiago EV, Ather 450X (Apex).',
                  tag: 'National Std',
                  visual: <SvgType2Connector />,
                },
                {
                  id: '16A_3PIN',
                  label: '16A Direct Port',
                  subtitle: '3-Pin Heavy Duty',
                  description: 'Direct three-pin socket used on Ola S1, TVS iQube.',
                  visual: <Svg16ASocket />,
                },
                {
                  id: 'PROPRIETARY',
                  label: 'Proprietary Connector',
                  subtitle: 'Custom OEM Adapter',
                  description: 'Requires dedicated portable converter block.',
                  visual: <SvgNotSure />,
                },
              ]}
            />

            <div className="pt-3 border-t border-slate-100 flex justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold text-xs rounded-xl"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow-md shadow-blue-600/20 disabled:opacity-50"
              >
                {loading ? 'Saving Vehicle...' : 'Complete Vehicle Registration'}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

