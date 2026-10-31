import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Zap, ShieldCheck, UserCheck, ChevronDown, LogOut, ArrowRightLeft } from 'lucide-react';
import { UserRole } from '../types';

export const Navbar: React.FC = () => {
  const { user, logout, switchRole, loginAsDemo } = useAuth();
  const [demoMenuOpen, setDemoMenuOpen] = useState(false);

  const demoAccounts = [
    { label: 'Rajesh Sharma (Approved Host)', email: 'rajesh.host@voltly.com', role: 'HOST' },
    { label: 'Priya Patel (Approved Host)', email: 'priya.host@voltly.com', role: 'HOST' },
    { label: 'Arun Mehta (Pending Host)', email: 'arun.host@voltly.com', role: 'HOST' },
    { label: 'Vikram Rao (Guest - Nexon EV)', email: 'vikram.guest@voltly.com', role: 'GUEST' },
    { label: 'Ananya Iyer (Guest - Ather 450X)', email: 'ananya.guest@voltly.com', role: 'GUEST' },
    { label: 'Compliance Admin', email: 'admin@voltly.com', role: 'ADMIN' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-blue-600 flex items-center justify-center text-white shadow-sm shadow-emerald-600/20">
            <Zap className="w-6 h-6 fill-current text-white stroke-none" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-extrabold tracking-tight text-slate-900">Voltly</span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                P2P EV
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium hidden sm:block">
              Peer-to-Peer Charging Network
            </p>
          </div>
        </div>

        {/* Navigation & Controls */}
        <div className="flex items-center gap-3">
          {/* Quick Demo Switcher */}
          <div className="relative">
            <button
              onClick={() => setDemoMenuOpen(!demoMenuOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
            >
              <UserCheck className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden md:inline">Demo Switcher</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {demoMenuOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-3 py-1.5 border-b border-slate-100">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Switch Test Account
                  </p>
                </div>
                {demoAccounts.map((acc) => (
                  <button
                    key={acc.email}
                    onClick={() => {
                      loginAsDemo(acc.email);
                      setDemoMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex items-center justify-between ${
                      user?.email === acc.email ? 'bg-emerald-50 text-emerald-800 font-semibold' : 'text-slate-700'
                    }`}
                  >
                    <div>
                      <p className="font-medium">{acc.label}</p>
                      <p className="text-[10px] text-slate-400">{acc.email}</p>
                    </div>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        acc.role === 'HOST'
                          ? 'bg-emerald-100 text-emerald-800'
                          : acc.role === 'ADMIN'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {acc.role}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {user && (
            <>
              {/* Role Toggle Switcher */}
              <div className="flex items-center bg-slate-100 p-1 rounded-lg">
                <button
                  onClick={() => switchRole('GUEST')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                    user.role === 'GUEST'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Guest
                </button>
                <button
                  onClick={() => switchRole('HOST')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                    user.role === 'HOST'
                      ? 'bg-white text-emerald-600 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Host
                </button>
                <button
                  onClick={() => switchRole('ADMIN')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                    user.role === 'ADMIN'
                      ? 'bg-white text-purple-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Admin
                </button>
              </div>

              {/* User Avatar & Logout */}
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold text-slate-900 leading-tight">{user.name}</p>
                  <p className="text-[10px] text-slate-500 capitalize">{user.role.toLowerCase()}</p>
                </div>
                <button
                  onClick={logout}
                  title="Sign Out"
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
