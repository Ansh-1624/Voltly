export interface RouteEstimate {
  distanceKm: number;
  durationMinutes: number;
  routeType: 'DRIVING_GOOGLE_API' | 'LOCAL_HAVERSINE_ROUTED';
}

/**
 * Calculates straight line great circle distance using the Haversine formula
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Estimates driving distance and ETA.
 * Urban road distance is typically ~1.3x straight-line distance due to street layout.
 * Average city driving speed is approx 28-32 km/h.
 */
export async function calculateRouteDistanceAndEta(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number
): Promise<RouteEstimate> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (apiKey && apiKey !== 'demo_key') {
    try {
      const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${originLat},${originLng}&destinations=${destLat},${destLng}&mode=driving&key=${apiKey}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        if (
          data.rows?.[0]?.elements?.[0]?.status === 'OK' &&
          data.rows[0].elements[0].distance?.value
        ) {
          const meters = data.rows[0].elements[0].distance.value;
          const seconds = data.rows[0].elements[0].duration.value;
          return {
            distanceKm: Number((meters / 1000).toFixed(2)),
            durationMinutes: Math.max(1, Math.round(seconds / 60)),
            routeType: 'DRIVING_GOOGLE_API',
          };
        }
      }
    } catch (err) {
      // Fallback gracefully on API error
      console.warn('Google Maps Distance Matrix failed, falling back to local routed calculation:', err);
    }
  }

  // Graceful deterministic fallback
  const directDistance = calculateHaversineDistanceKm(originLat, originLng, destLat, destLng);
  // Routing road factor = 1.35x
  const drivingDistanceKm = Number((directDistance * 1.35).toFixed(2));
  // 30 km/h average speed = 2 minutes per km + 3 min base traffic
  const durationMinutes = Math.max(2, Math.round((drivingDistanceKm / 30) * 60) + 2);

  return {
    distanceKm: drivingDistanceKm,
    durationMinutes,
    routeType: 'LOCAL_HAVERSINE_ROUTED',
  };
}
