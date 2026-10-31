import { Router, Response } from 'express';
import crypto from 'crypto';
import { db } from '../database';
import { authMiddleware, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { GuestProfile, GuestVehicle, VehicleCategory, SocketType, VehicleConnector } from '../types';

export const guestRouter = Router();

/**
 * Get pre-verified vehicle models catalogue (Public static metadata)
 */
guestRouter.get('/catalogue', (_req, res) => {
  const models = db.getVehicleModels();
  return res.json({ models });
});

// All following guest operations require authentication
guestRouter.use(authMiddleware);
guestRouter.use(requireRole(['GUEST', 'ADMIN']));

/**
 * Get guest dashboard summary
 */
guestRouter.get('/dashboard', async (req: AuthenticatedRequest, res: Response) => {
  let guestProfile: GuestProfile | null | undefined = db.getGuestProfileByUserId(req.user!.id);
  if (!guestProfile) {
    guestProfile = await db.getGuestProfileByUserIdAsync(req.user!.id);
  }
  if (!guestProfile) {
    return res.json({
      profileComplete: false,
      message: 'Guest profile not completed. Please register your EV.',
    });
  }

  let guestVehicle: GuestVehicle | null | undefined = db.getGuestVehicleByGuestId(guestProfile.id);
  if (!guestVehicle) {
    guestVehicle = await db.getGuestVehicleByGuestIdAsync(guestProfile.id);
  }
  const activeSession = db.getActiveSessionForGuest(guestProfile.id);
  const latestRec = db.getLatestRecommendationForGuest(guestProfile.id);

  // Past bills
  const guestSessions = db
    .getSessions()
    .filter((s) => s.guest_id === guestProfile.id && (s.status === 'COMPLETED' || s.status === 'STOPPED_BY_HOST'));

  const bills = guestSessions.map((s) => ({
    session: s,
    bill: db.getBillBySessionId(s.id),
    pod: db.getPodById(s.pod_id),
    host: db.getHostProfileById(s.host_id),
  }));

  let populatedActiveSession = null;
  if (activeSession) {
    const pod = db.getPodById(activeSession.pod_id);
    const host = db.getHostProfileById(activeSession.host_id);
    const hostUser = host ? db.getUserById(host.user_id) : null;
    populatedActiveSession = {
      ...activeSession,
      pod,
      host,
      hostName: hostUser?.name,
      hostPhone: hostUser?.phone,
    };
  }

  let populatedRec = null;
  if (latestRec && latestRec.status !== 'EXPIRED') {
    const pod = db.getPodById(latestRec.selected_pod_id);
    const host = pod ? db.getHostProfileById(pod.host_id) : null;
    populatedRec = {
      ...latestRec,
      pod,
      host,
    };
  }

  return res.json({
    profileComplete: true,
    guestProfile,
    guestVehicle,
    activeSession: populatedActiveSession,
    latestRecommendation: populatedRec,
    bills,
  });
});

/**
 * Complete guest onboarding: register vehicle & portable EVSE
 */
guestRouter.post('/onboard', async (req: AuthenticatedRequest, res: Response) => {
  const {
    vehicle_category = 'FOUR_WHEELER',
    vehicle_model_id,
    custom_manufacturer,
    custom_model,
    battery_capacity_kwh,
    vehicle_connector = 'IEC_62196_TYPE_2',
    max_ac_power_kw = 3.3,
    ac_charging_supported = true,
    evse_make_model,
    evse_supply_plug = '16A_3PIN',
    evse_rated_power_kw = 3.3,
    evse_vehicle_connector = 'IEC_62196_TYPE_2',
  } = req.body;

  let guestProfile: GuestProfile | null | undefined = db.getGuestProfileByUserId(req.user!.id);
  if (!guestProfile) {
    guestProfile = await db.getGuestProfileByUserIdAsync(req.user!.id);
  }
  if (!guestProfile) {
    guestProfile = {
      id: crypto.randomUUID(),
      user_id: req.user!.id,
      vehicle_category: vehicle_category as VehicleCategory,
      created_at: new Date().toISOString(),
    };
    db.addGuestProfile(guestProfile);
  }

  let finalCapacity = Number(battery_capacity_kwh);
  let finalConnector = vehicle_connector as VehicleConnector;
  let finalMaxAcPower = Number(max_ac_power_kw);
  let finalAcSupported = Boolean(ac_charging_supported);

  // If selecting from catalogue, autofill verified specifications
  if (vehicle_model_id) {
    const catalogueModel = db.getVehicleModelById(vehicle_model_id);
    if (catalogueModel) {
      finalCapacity = catalogueModel.battery_capacity_kwh;
      finalConnector = catalogueModel.vehicle_connector;
      finalMaxAcPower = catalogueModel.max_ac_charging_power_kw;
      finalAcSupported = catalogueModel.ac_charging_supported;
    }
  }

  const guestVehicle: GuestVehicle = {
    id: crypto.randomUUID(),
    guest_id: guestProfile.id,
    vehicle_model_id: vehicle_model_id || undefined,
    custom_manufacturer: custom_manufacturer || undefined,
    custom_model: custom_model || undefined,
    battery_capacity_kwh: finalCapacity,
    vehicle_connector: finalConnector,
    max_ac_power_kw: finalMaxAcPower,
    ac_charging_supported: finalAcSupported,
    evse_make_model: evse_make_model || 'OEM Portable EVSE Cable',
    evse_supply_plug: evse_supply_plug as SocketType,
    evse_rated_power_kw: Number(evse_rated_power_kw) || 3.3,
    evse_vehicle_connector: (evse_vehicle_connector || finalConnector) as VehicleConnector,
    created_at: new Date().toISOString(),
  };

  db.addGuestVehicle(guestVehicle);

  return res.json({
    message: 'Guest and vehicle profiles successfully saved.',
    guestProfile,
    guestVehicle,
  });
});

