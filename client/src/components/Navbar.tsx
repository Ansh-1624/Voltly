import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Zap, LogOut, ShieldCheck, Car } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout, openAuthModal } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
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

        {/* User Status or Log In / Sign Up options */}
        {user ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-right">
              <div className="hidden sm:block">
                <p className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[150px]">{user.name}</p>
                <p className="text-[10px] text-slate-400 truncate max-w-[150px]">{user.email}</p>
              </div>

              {/* Strict Role Pill */}
              <span
                className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full flex items-center gap-1 ${
                  user.role === 'GUEST'
                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                    : user.role === 'HOST'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-purple-100 text-purple-800 border border-purple-200'
                }`}
              >
                {user.role === 'GUEST' ? (
                  <>
                    <Car className="w-3 h-3 text-blue-600" />
                    <span>EV Driver</span>
                  </>
                ) : user.role === 'HOST' ? (
                  <>
                    <Zap className="w-3 h-3 text-emerald-600" />
                    <span>Host</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3 h-3 text-purple-600" />
                    <span>Admin</span>
                  </>
                )}
              </span>
            </div>

            <button
              onClick={logout}
              title="Sign Out"
              className="px-3 py-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors flex items-center gap-1.5 border border-slate-200 hover:border-rose-200 text-xs font-bold"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-500" />
              <span>Sign Out</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => openAuthModal('LOGIN')}
              className="px-3.5 py-2 text-xs font-bold text-slate-700 hover:text-emerald-700 rounded-xl hover:bg-slate-100/80 transition-colors"
            >
              Log In
            </button>
            <button
              onClick={() => openAuthModal('SIGNUP', 'HOST')}
              className="hidden sm:flex px-3.5 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5 text-emerald-600" />
              <span>Become a Host</span>
            </button>
            <button
              onClick={() => openAuthModal('SIGNUP', 'GUEST')}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all flex items-center gap-1.5"
            >
              <span>Sign Up</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
