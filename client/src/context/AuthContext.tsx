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
  login: (email: string, name?: string, role?: UserRole) => Promise<void>;
  loginAsDemo: (email: string) => Promise<void>;
  loginWithGoogle: (email: string, name: string, role?: UserRole) => Promise<void>;
  logout: () => void;
  switchRole: (role: UserRole) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [hostProfile, setHostProfile] = useState<HostProfile | null>(null);
  const [guestProfile, setGuestProfile] = useState<GuestProfile | null>(null);
  const [guestVehicle, setGuestVehicle] = useState<GuestVehicle | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('voltly_token'));
  const [loading, setLoading] = useState<boolean>(true);

  const refreshProfile = async () => {
    try {
      const data = await api.getMe();
      setUser(data.user);
      setHostProfile(data.hostProfile);
      setGuestProfile(data.guestProfile);
      setGuestVehicle(data.guestVehicle);
    } catch (err) {
      console.warn('Failed to fetch user profile, clearing token:', err);
      localStorage.removeItem('voltly_token');
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

  const loginWithGoogle = async (email: string, name: string, role: UserRole = 'GUEST') => {
    setLoading(true);
    try {
      const data = await api.googleLogin(email, name, role);
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
        login,
        loginAsDemo,
        loginWithGoogle,
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

