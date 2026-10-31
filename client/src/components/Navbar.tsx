import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Zap, LogOut, Menu, X } from 'lucide-react';
import { UserRole } from '../types';

export const Navbar: React.FC = () => {
  const { user, logout, switchRole } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-blue-600 flex items-center justify-center text-white shadow-sm shadow-emerald-600/20 flex-shrink-0">
            <Zap className="w-5 h-5 sm:w-6 sm:h-6 fill-current text-white stroke-none" />
          </div>
          <div>
            <div className="flex items-center gap-1 sm:gap-1.5">
              <span className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900">Voltly</span>
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                P2P EV
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium hidden md:block">
              Peer-to-Peer Charging Network
            </p>
          </div>
        </div>

        {/* Desktop Controls */}
        <div className="hidden sm:flex items-center gap-2 sm:gap-3">
          {user ? (
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
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[120px]">{user.name}</p>
                  <p className="text-[10px] text-slate-500 capitalize">{user.role.toLowerCase()}</p>
                </div>
                <button
                  onClick={logout}
                  title="Sign Out"
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : null}
        </div>

        {/* Mobile Compact Controls (Visible on < 640px) */}
        <div className="flex sm:hidden items-center gap-1.5">
          {user && (
            <>
              {/* Compact Role Pill */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-[11px]">
                <button
                  onClick={() => switchRole('GUEST')}
                  className={`px-2 py-1 font-bold rounded ${
                    user.role === 'GUEST' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Guest
                </button>
                <button
                  onClick={() => switchRole('HOST')}
                  className={`px-2 py-1 font-bold rounded ${
                    user.role === 'HOST' ? 'bg-white text-emerald-600 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Host
                </button>
              </div>

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Mobile Drawer Dropdown */}
      {mobileMenuOpen && user && (
        <div className="sm:hidden border-t border-slate-200 bg-white p-4 space-y-3 shadow-lg">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <p className="text-xs font-bold text-slate-900">{user.name}</p>
              <p className="text-[11px] text-slate-500">{user.email}</p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 uppercase">
              {user.role}
            </span>
          </div>

          <div className="space-y-1">
            <p className="text-[10px] uppercase font-bold text-slate-400">Switch Application Role</p>
            <div className="grid grid-cols-3 gap-1">
              <button
                onClick={() => {
                  switchRole('GUEST');
                  setMobileMenuOpen(false);
                }}
                className={`py-2 text-xs font-bold rounded-lg border text-center ${
                  user.role === 'GUEST'
                    ? 'border-blue-600 bg-blue-50 text-blue-800'
                    : 'border-slate-200 text-slate-700'
                }`}
              >
                Guest
              </button>
              <button
                onClick={() => {
                  switchRole('HOST');
                  setMobileMenuOpen(false);
                }}
                className={`py-2 text-xs font-bold rounded-lg border text-center ${
                  user.role === 'HOST'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                    : 'border-slate-200 text-slate-700'
                }`}
              >
                Host
              </button>
              <button
                onClick={() => {
                  switchRole('ADMIN');
                  setMobileMenuOpen(false);
                }}
                className={`py-2 text-xs font-bold rounded-lg border text-center ${
                  user.role === 'ADMIN'
                    ? 'border-purple-600 bg-purple-50 text-purple-800'
                    : 'border-slate-200 text-slate-700'
                }`}
              >
                Admin
              </button>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={() => {
                logout();
                setMobileMenuOpen(false);
              }}
              className="w-full py-2.5 text-xs text-rose-600 hover:bg-rose-50 font-semibold rounded-lg flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
