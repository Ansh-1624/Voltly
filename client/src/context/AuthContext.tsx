import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, HostProfile, GuestProfile, GuestVehicle } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  hostProfile: HostProfile | null;
  guestProfile: GuestProfile | null;
  guestVehicle: GuestVehicle | null;
  token: string | null;
  loading: boolean;
  authModal: { isOpen: boolean; mode: 'LOGIN' | 'SIGNUP' | 'ADMIN'; initialRole?: 'GUEST' | 'HOST' };
  openAuthModal: (mode?: 'LOGIN' | 'SIGNUP' | 'ADMIN', initialRole?: 'GUEST' | 'HOST') => void;
  closeAuthModal: () => void;
  login: (email: string, name?: string, role?: UserRole) => Promise<void>;
  loginAsDemo: (email: string) => Promise<void>;
  loginWithGoogle: (email: string, name?: string, role?: UserRole, mode?: 'login' | 'signup') => Promise<void>;
  loginAsAdmin: (email: string, passcode: string) => Promise<void>;
  logout: () => void;
  switchRole: (role: UserRole) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [hostProfile, setHostProfile] = useState<HostProfile | null>(() => {
    try {
      const saved = localStorage.getItem('voltly_host_profile');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [guestProfile, setGuestProfile] = useState<GuestProfile | null>(() => {
    try {
      const saved = localStorage.getItem('voltly_guest_profile');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [guestVehicle, setGuestVehicle] = useState<GuestVehicle | null>(() => {
    try {
      const saved = localStorage.getItem('voltly_guest_vehicle');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(localStorage.getItem('voltly_token'));
  const [loading, setLoading] = useState<boolean>(true);
  const [authModal, setAuthModal] = useState<{ isOpen: boolean; mode: 'LOGIN' | 'SIGNUP' | 'ADMIN'; initialRole?: 'GUEST' | 'HOST' }>({
    isOpen: false,
    mode: 'LOGIN',
  });

  const openAuthModal = (mode: 'LOGIN' | 'SIGNUP' | 'ADMIN' = 'LOGIN', initialRole?: 'GUEST' | 'HOST') => {
    setAuthModal({ isOpen: true, mode, initialRole });
  };

  const closeAuthModal = () => {
    setAuthModal(prev => ({ ...prev, isOpen: false }));
  };

  const refreshProfile = async () => {
    try {
      const data = await api.getMe();
      setUser(data.user);
      setHostProfile(data.hostProfile || null);
      setGuestProfile(data.guestProfile || null);
      setGuestVehicle(data.guestVehicle || null);

      if (data.hostProfile) localStorage.setItem('voltly_host_profile', JSON.stringify(data.hostProfile));
      if (data.guestProfile) localStorage.setItem('voltly_guest_profile', JSON.stringify(data.guestProfile));
      if (data.guestVehicle) localStorage.setItem('voltly_guest_vehicle', JSON.stringify(data.guestVehicle));
    } catch (err) {
      console.warn('Failed to fetch user profile, clearing token:', err);
      localStorage.removeItem('voltly_token');
      localStorage.removeItem('voltly_host_profile');
      localStorage.removeItem('voltly_guest_profile');
      localStorage.removeItem('voltly_guest_vehicle');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      refreshProfile();
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email: string, name?: string, role: UserRole = 'GUEST') => {
    setLoading(true);
    try {
      const data = await api.login(email, name, role);
      localStorage.setItem('voltly_token', data.token);
      setToken(data.token);
      setUser(data.user);
      await refreshProfile();
    } finally {
      setLoading(false);
    }
  };

  const loginAsDemo = async (email: string) => {
    setLoading(true);
    try {
      const data = await api.demoLogin(email);
      localStorage.setItem('voltly_token', data.token);
      setToken(data.token);
      setUser(data.user);
      await refreshProfile();
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async (email: string, name?: string, role: UserRole = 'GUEST', mode?: 'login' | 'signup') => {
    setLoading(true);
    try {
      const data = await api.googleLogin(email, name, role, mode);
      localStorage.setItem('voltly_token', data.token);
      setToken(data.token);
      setUser(data.user);
      await refreshProfile();
    } finally {
      setLoading(false);
    }
  };

  const loginAsAdmin = async (email: string, passcode: string) => {
    setLoading(true);
    try {
      const data = await api.adminLogin(email, passcode);
      localStorage.setItem('voltly_token', data.token);
      setToken(data.token);
      setUser(data.user);
      await refreshProfile();
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('voltly_token');
    localStorage.removeItem('voltly_host_profile');
    localStorage.removeItem('voltly_guest_profile');
    localStorage.removeItem('voltly_guest_vehicle');
    setToken(null);
    setUser(null);
    setHostProfile(null);
    setGuestProfile(null);
    setGuestVehicle(null);
  };

  const switchRole = async (role: UserRole) => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await api.updateRole(role);
      localStorage.setItem('voltly_token', data.token);
      setToken(data.token);
      setUser(data.user);
      await refreshProfile();
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        hostProfile,
        guestProfile,
        guestVehicle,
        token,
        loading,
        authModal,
        openAuthModal,
        closeAuthModal,
        login,
        loginAsDemo,
        loginWithGoogle,
        loginAsAdmin,
        logout,
        switchRole,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

