import fs from 'fs';
import path from 'path';
import {
  User,
  HostProfile,
  HostPod,
  GuestProfile,
  VehicleModel,
  GuestVehicle,
  Recommendation,
  RecommendationFeedback,
  QRToken,
  ChargingSession,
  SessionBill,
} from '../types';

export interface DatabaseSchema {
  users: User[];
  host_profiles: HostProfile[];
  host_pods: HostPod[];
  guest_profiles: GuestProfile[];
  vehicle_models: VehicleModel[];
  guest_vehicles: GuestVehicle[];
  recommendations: Recommendation[];
  recommendation_feedback: RecommendationFeedback[];
  qr_tokens: QRToken[];
  charging_sessions: ChargingSession[];
  session_bills: SessionBill[];
}

export class Database {
  private data: DatabaseSchema;
  private filePath: string;
  private isInMemory: boolean;
  private lock: Promise<void> = Promise.resolve();

  constructor(filePath?: string, inMemory: boolean = false) {
    this.isInMemory = inMemory;
    this.filePath = filePath || path.join(__dirname, '../../data/voltly.json');
    this.data = this.getDefaultSchema();
    if (!inMemory) {
      this.load();
    }
  }

  private getDefaultSchema(): DatabaseSchema {
    return {
      users: [],
      host_profiles: [],
      host_pods: [],
      guest_profiles: [],
      vehicle_models: [],
      guest_vehicles: [],
      recommendations: [],
      recommendation_feedback: [],
      qr_tokens: [],
      charging_sessions: [],
      session_bills: [],
    };
  }

  private load() {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        this.data = { ...this.getDefaultSchema(), ...JSON.parse(raw) };
      } else {
        this.save();
      }
    } catch (err) {
      console.warn('Could not read db file, initializing with defaults:', err);
      this.data = this.getDefaultSchema();
    }
  }

  public save() {
    if (this.isInMemory) return;
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist database:', err);
    }
  }

  /**
   * Acquire atomic lock for transactional operations
   */
  public async transaction<T>(fn: (db: Database) => Promise<T> | T): Promise<T> {
    let unlock: () => void;
    const nextLock = new Promise<void>((resolve) => {
      unlock = resolve;
    });
    const currentLock = this.lock;
    this.lock = currentLock.then(() => nextLock);

    await currentLock;
    try {
      const result = await fn(this);
      this.save();
      return result;
    } finally {
      unlock!();
    }
  }

  public clearAll() {
    this.data = this.getDefaultSchema();
    this.save();
  }

  // --- Users ---
  public getUsers() { return this.data.users; }
  public getUserById(id: string) { return this.data.users.find(u => u.id === id); }
  public getUserByEmail(email: string) { return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase()); }
  public addUser(user: User) {
    this.data.users.push(user);
    this.save();
    return user;
  }
  public updateUser(id: string, updates: Partial<User>) {
    const idx = this.data.users.findIndex(u => u.id === id);
    if (idx !== -1) {
      this.data.users[idx] = { ...this.data.users[idx], ...updates };
      this.save();
      return this.data.users[idx];
    }
    return null;
  }

  // --- Host Profiles ---
  public getHostProfiles() { return this.data.host_profiles; }
  public getHostProfileById(id: string) { return this.data.host_profiles.find(h => h.id === id); }
  public getHostProfileByUserId(userId: string) { return this.data.host_profiles.find(h => h.user_id === userId); }
  public addHostProfile(profile: HostProfile) {
    this.data.host_profiles.push(profile);
    this.save();
    return profile;
  }
  public updateHostProfile(id: string, updates: Partial<HostProfile>) {
    const idx = this.data.host_profiles.findIndex(h => h.id === id);
    if (idx !== -1) {
      this.data.host_profiles[idx] = { ...this.data.host_profiles[idx], ...updates };
      this.save();
      return this.data.host_profiles[idx];
    }
    return null;
  }

  // --- Host Pods ---
  public getPods() { return this.data.host_pods; }
  public getPodById(id: string) { return this.data.host_pods.find(p => p.id === id); }
  public getPodsByHostId(hostId: string) { return this.data.host_pods.filter(p => p.host_id === hostId); }
  public addPod(pod: HostPod) {
    this.data.host_pods.push(pod);
    this.save();
    return pod;
  }
  public updatePod(id: string, updates: Partial<HostPod>) {
    const idx = this.data.host_pods.findIndex(p => p.id === id);
    if (idx !== -1) {
      this.data.host_pods[idx] = { ...this.data.host_pods[idx], ...updates };
      this.save();
      return this.data.host_pods[idx];
    }
    return null;
  }
  public deletePod(id: string) {
    const initialLen = this.data.host_pods.length;
    this.data.host_pods = this.data.host_pods.filter(p => p.id !== id);
    if (this.data.host_pods.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  // --- Guest Profiles & Vehicles ---
  public getGuestProfiles() { return this.data.guest_profiles; }
  public getGuestProfileByUserId(userId: string) { return this.data.guest_profiles.find(g => g.user_id === userId); }
  public addGuestProfile(profile: GuestProfile) {
    this.data.guest_profiles.push(profile);
    this.save();
    return profile;
  }

  public getVehicleModels() { return this.data.vehicle_models; }
  public getVehicleModelById(id: string) { return this.data.vehicle_models.find(v => v.id === id); }
  public addVehicleModel(model: VehicleModel) {
    this.data.vehicle_models.push(model);
    this.save();
    return model;
  }

  public getGuestVehicles() { return this.data.guest_vehicles; }
  public getGuestVehicleByGuestId(guestId: string) { return this.data.guest_vehicles.find(v => v.guest_id === guestId); }
  public addGuestVehicle(vehicle: GuestVehicle) {
    // Replace if exists for guest
    this.data.guest_vehicles = this.data.guest_vehicles.filter(v => v.guest_id !== vehicle.guest_id);
    this.data.guest_vehicles.push(vehicle);
    this.save();
    return vehicle;
  }
  public updateGuestVehicle(id: string, updates: Partial<GuestVehicle>) {
    const idx = this.data.guest_vehicles.findIndex(v => v.id === id);
    if (idx !== -1) {
      this.data.guest_vehicles[idx] = { ...this.data.guest_vehicles[idx], ...updates };
      this.save();
      return this.data.guest_vehicles[idx];
    }
    return null;
  }

  // --- Recommendations & Feedback ---
  public getRecommendations() { return this.data.recommendations; }
  public getRecommendationById(id: string) { return this.data.recommendations.find(r => r.id === id); }
  public getLatestRecommendationForGuest(guestId: string) {
    return [...this.data.recommendations]
      .filter(r => r.guest_id === guestId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0] || null;
  }
  public addRecommendation(rec: Recommendation) {
    this.data.recommendations.push(rec);
    this.save();
    return rec;
  }
  public updateRecommendation(id: string, updates: Partial<Recommendation>) {
    const idx = this.data.recommendations.findIndex(r => r.id === id);
    if (idx !== -1) {
      this.data.recommendations[idx] = { ...this.data.recommendations[idx], ...updates };
      this.save();
      return this.data.recommendations[idx];
    }
    return null;
  }

  public getRejectionFeedbackForGuest(guestId: string) {
    return this.data.recommendation_feedback.filter(f => f.guest_id === guestId);
  }
  public addRejectionFeedback(feedback: RecommendationFeedback) {
    this.data.recommendation_feedback.push(feedback);
    this.save();
    return feedback;
  }

  // --- QR Tokens ---
  public getQRTokens() { return this.data.qr_tokens; }
  public getQRTokenByHash(tokenHash: string) { return this.data.qr_tokens.find(q => q.token_hash === tokenHash); }
  public addQRToken(token: QRToken) {
    this.data.qr_tokens.push(token);
    this.save();
    return token;
  }
  public updateQRToken(id: string, updates: Partial<QRToken>) {
    const idx = this.data.qr_tokens.findIndex(q => q.id === id);
    if (idx !== -1) {
      this.data.qr_tokens[idx] = { ...this.data.qr_tokens[idx], ...updates };
      this.save();
      return this.data.qr_tokens[idx];
    }
    return null;
  }

  // --- Charging Sessions ---
  public getSessions() { return this.data.charging_sessions; }
  public getSessionById(id: string) { return this.data.charging_sessions.find(s => s.id === id); }
  public getActiveSessionsForHost(hostId: string) {
    return this.data.charging_sessions.filter(s => s.host_id === hostId && (s.status === 'ACTIVE' || s.status === 'LIMIT_REACHED'));
  }
  public getActiveSessionForPod(podId: string) {
    return this.data.charging_sessions.find(s => s.pod_id === podId && (s.status === 'ACTIVE' || s.status === 'LIMIT_REACHED'));
  }
  public getActiveSessionForGuest(guestId: string) {
    return this.data.charging_sessions.find(s => s.guest_id === guestId && (s.status === 'ACTIVE' || s.status === 'LIMIT_REACHED'));
  }
  public addSession(session: ChargingSession) {
    this.data.charging_sessions.push(session);
    this.save();
    return session;
  }
  public updateSession(id: string, updates: Partial<ChargingSession>) {
    const idx = this.data.charging_sessions.findIndex(s => s.id === id);
    if (idx !== -1) {
      this.data.charging_sessions[idx] = { ...this.data.charging_sessions[idx], ...updates };
      this.save();
      return this.data.charging_sessions[idx];
    }
    return null;
  }

  // --- Session Bills ---
  public getBills() { return this.data.session_bills; }
  public getBillBySessionId(sessionId: string) { return this.data.session_bills.find(b => b.session_id === sessionId); }
  public addBill(bill: SessionBill) {
    this.data.session_bills.push(bill);
    this.save();
    return bill;
  }
  public updateBill(id: string, updates: Partial<SessionBill>) {
    const idx = this.data.session_bills.findIndex(b => b.id === id);
    if (idx !== -1) {
      this.data.session_bills[idx] = { ...this.data.session_bills[idx], ...updates };
      this.save();
      return this.data.session_bills[idx];
    }
    return null;
  }
}

// Global database instance
export const db = new Database();

