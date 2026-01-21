
import React from 'react';
import { UserProfile } from '../types';

interface HeaderProps {
  user: UserProfile;
  balance: number;
  isSyncing?: boolean;
  syncId: string | null;
  onManualSync?: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, balance, isSyncing, syncId, onManualSync }) => {
  return (
    <header className="bg-white border-b px-4 md:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 sticky top-0 z-30 shadow-sm">
      <div className="flex items-center gap-4 w-full sm:w-auto">
        <div className="flex-1">
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            Welcome, {user.name}
            {syncId && (
              <button 
                onClick={onManualSync}
                className="flex h-3 w-3 relative group" 
                title="Click to Sync Now"
              >
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isSyncing ? 'bg-indigo-400' : 'bg-emerald-400'} opacity-75`}></span>
                <span className={`relative inline-flex rounded-full h-3 w-3 ${isSyncing ? 'bg-indigo-500' : 'bg-emerald-500'} group-hover:scale-125 transition-transform`}></span>
              </button>
            )}
          </h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
            <i className={`fas ${syncId ? 'fa-cloud' : 'fa-circle'} text-[8px] ${syncId ? (isSyncing ? 'text-indigo-500 animate-pulse' : 'text-indigo-500') : 'text-slate-300'}`}></i>
            {syncId ? (isSyncing ? 'Syncing data...' : 'Auto-Sync Active') : 'Local Mode'}
          </p>
        </div>
      </div>
      
      <div className={`px-5 py-2 rounded-2xl border-2 flex items-center gap-4 transition-all duration-500 ${
        balance < 0 ? 'border-rose-100 bg-rose-50 text-rose-600' : 'border-emerald-100 bg-emerald-50 text-emerald-600'
      }`}>
        <div className="text-right">
          <span className="text-[9px] font-black uppercase tracking-widest opacity-60 block">Project Balance</span>
          <span className="text-lg font-black leading-none">Rs. {balance.toLocaleString()}</span>
        </div>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${balance < 0 ? 'bg-rose-100' : 'bg-emerald-100'}`}>
           <i className={`fas ${balance < 0 ? 'fa-arrow-down' : 'fa-arrow-up'} text-sm`}></i>
        </div>
      </div>
    </header>
  );
};

export default Header;
