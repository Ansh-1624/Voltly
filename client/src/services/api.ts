const API_BASE = '/api';

function getHeaders(): HeadersInit {
  const token = localStorage.getItem('voltly_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      ...getHeaders(),
      ...(options.headers || {}),
    },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || data.message || 'Request failed');
  }
  return data;
}

export const api = {
  // Auth
  demoLogin: (email: string) => request<{ user: any; token: string }>('/auth/demo-login', {
    method: 'POST',
    body: JSON.stringify({ email }),
  }),
  googleLogin: (email: string, name: string, role = 'GUEST') => request<{ user: any; token: string }>('/auth/google', {
    method: 'POST',
    body: JSON.stringify({ email, name, role }),
  }),
  getMe: () => request<{ user: any; hostProfile: any; guestProfile: any; guestVehicle: any }>('/auth/me'),
  updateRole: (role: string) => request<{ user: any; token: string }>('/auth/role', {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  }),

  // Host
  getHostDashboard: () => request<any>('/host/dashboard'),
  saveHostProfile: (profile: any) => request<any>('/host/profile', {
    method: 'POST',
    body: JSON.stringify(profile),
  }),
  getHostPods: () => request<{ pods: any[] }>('/host/pods'),
  addHostPod: (pod: any) => request<any>('/host/pods', {
    method: 'POST',
    body: JSON.stringify(pod),
  }),
  updatePodStatus: (podId: string, status: string) => request<any>(`/host/pods/${podId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  }),

  // Guest
  getVehicleCatalogue: () => request<{ models: any[] }>('/guest/catalogue'),
  getGuestDashboard: () => request<any>('/guest/dashboard'),
  saveGuestOnboarding: (data: any) => request<any>('/guest/onboard', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Recommendations
  findRecommendation: (params: { guestLat: number; guestLng: number; batteryPct: number; estimatedRangeKm: number }) =>
    request<any>('/recommendations/find', {
      method: 'POST',
      body: JSON.stringify(params),
    }),
  acceptRecommendation: (id: string) => request<any>(`/recommendations/${id}/accept`, {
    method: 'POST',
  }),
  rejectRecommendation: (id: string, reason: string, notes?: string) => request<any>(`/recommendations/${id}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason, notes }),
  }),
  recheckRecommendationAvailability: (id: string) => request<any>(`/recommendations/${id}/recheck`),

  // QR
  generateQR: (recommendationId: string, guestLat?: number, guestLng?: number, skipProximityCheck = false) =>
    request<{ token: string; expiresAt: string; message: string }>('/qr/generate', {
      method: 'POST',
      body: JSON.stringify({ recommendationId, guestLat, guestLng, skipProximityCheck }),
    }),
  scanQR: (token: string) => request<any>('/qr/scan', {
    method: 'POST',
    body: JSON.stringify({ token }),
  }),

  // Sessions
  getSession: (id: string) => request<any>(`/sessions/${id}`),
  stopSession: (id: string) => request<any>(`/sessions/${id}/stop`, {
    method: 'POST',
  }),
  confirmShutdown: (id: string) => request<any>(`/sessions/${id}/confirm-shutdown`, {
    method: 'POST',
  }),
  getSessionBill: (id: string) => request<any>(`/sessions/${id}/bill`),
  updatePaymentStatus: (id: string, payment_status: string, payment_method: string) =>
    request<any>(`/sessions/${id}/payment`, {
      method: 'PATCH',
      body: JSON.stringify({ payment_status, payment_method }),
    }),

  // Admin
  getAdminOverview: () => request<any>('/admin/overview'),
  approvePod: (podId: string) => request<any>(`/admin/pods/${podId}/approve`, {
    method: 'POST',
  }),
  rejectPod: (podId: string, reason: string) => request<any>(`/admin/pods/${podId}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  }),
  flagPod: (podId: string, notes: string) => request<any>(`/admin/pods/${podId}/flag`, {
    method: 'PATCH',
    body: JSON.stringify({ notes }),
  }),
};

