import { VehicleCategory } from '../types';

export interface PricingCalculation {
  effectivePowerKw: number;
  energyPerMinuteKwh: number;
  hostTariffPerKwh: number;
  pricePerMinute: number;
  maxSessionMinutes: number;
  estimatedTotalMaxCost: number;
  estimatedTotalEnergyKwh: number;
}

/**
 * Calculates dynamic electricity-cost based pricing
 */
export function calculatePricing(
  effectivePowerKw: number,
  hostTariffPerKwh: number,
  vehicleCategory: VehicleCategory
): PricingCalculation {
  if (effectivePowerKw <= 0 || hostTariffPerKwh <= 0) {
    throw new Error('Invalid charging power or tariff provided for pricing calculation');
  }

  // Energy consumed per minute: kW / 60
  const energyPerMinuteKwh = effectivePowerKw / 60;

  // Base price per minute: Energy_per_minute_kWh * Host_tariff (in ₹)
  const pricePerMinute = energyPerMinuteKwh * hostTariffPerKwh;

  // Enforce session duration limit by category
  const maxSessionMinutes = vehicleCategory === 'TWO_WHEELER' ? 60 : 120;

  const estimatedTotalEnergyKwh = energyPerMinuteKwh * maxSessionMinutes;
  const estimatedTotalMaxCost = pricePerMinute * maxSessionMinutes;

  return {
    effectivePowerKw: Number(effectivePowerKw.toFixed(2)),
    energyPerMinuteKwh: Number(energyPerMinuteKwh.toFixed(4)),
    hostTariffPerKwh: Number(hostTariffPerKwh.toFixed(2)),
    pricePerMinute: Number(pricePerMinute.toFixed(4)),
    maxSessionMinutes,
    estimatedTotalMaxCost: Number(estimatedTotalMaxCost.toFixed(2)),
    estimatedTotalEnergyKwh: Number(estimatedTotalEnergyKwh.toFixed(2)),
  };
}

