
import React, { useState } from 'react';
import { DesignCharge, PaymentRecord, SecurityLog } from '../types';
import { db } from '../services/mockDatabase';

interface DashboardProps {
  charges: DesignCharge[];
  payments: PaymentRecord[];
  totals: { costs: number; paid: number };
  balance: number;
  securityLogs: SecurityLog[];
  aiAnalysis: string;
  isAnalyzing: boolean;
  onRunAnalysis: () => void;
  syncId: string | null;
  lastSyncTime: number | null;
  onManualSync: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  charges, payments, totals, balance, securityLogs, syncId, lastSyncTime, onManualSync
}) => {
  const [editingSync, setEditingSync] = useState(false);
  const [newSyncId, setNewSyncId] = useState('');
  const [isCreatingSync, setIsCreatingSync] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);

  const combinedActivity = [
    ...charges.map(c => ({ ...c, typeLabel: 'Charge', color: 'text-rose-500', icon: 'fa-minus-circle', bgColor: 'bg-rose-50' })),
    ...payments.map(p => ({ ...p, typeLabel: 'Payment', color: 'text-emerald-500', icon: 'fa-plus-circle', bgColor: 'bg-emerald-50' }))
  ].sort((a, b) => b.timestamp - a.timestamp).slice(0, 10);

  const handleCreateSync = async () => {
    setIsCreatingSync(true);
    try {
      const id = await db.createNewSyncSession();
      if (id) {
        // ID is already set in DB by createNewSyncSession
        setEditingSync(false);
      } else {
        alert("Failed to create a sync session. Please check your connection.");
      }
    } catch (e) {
      alert("Error: " + (e instanceof Error ? e.message : "Cloud storage unavailable."));
    } finally {
      setIsCreatingSync(false);
    }
  };

  const handleJoinSync = () => {
    const cleanId = newSyncId.trim();
    if (!cleanId) return;
    db.setSyncId(cleanId);
    setEditingSync(false);
    onManualSync();
  };

  const handleCopyKey = () => {
    if (syncId) {
      navigator.clipboard.writeText(syncId);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    }
  };

  const disconnectSync = () => {
    if (confirm("Disconnect from Cloud? Your local data remains, but you won't see updates from the other person.")) {
      db.setSyncId(null);
    }
  };

  const downloadReport = () => {
    const reportData = `DESIGN LEDGER REPORT\nGenerated: ${new Date().toLocaleString()}\nTotal Costs: Rs. ${totals.costs}\nTotal Paid: Rs. ${totals.paid}\nNet Balance: Rs. ${balance}\n`;
    const blob = new Blob([reportData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Ledger_Report_${Date.now()}.txt`;
    link.click();
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
      
      {/* Cloud Sync Automation Hub */}
      <div className={`${syncId ? 'bg-indigo-600' : 'bg-slate-800'} rounded-[2rem] p-1 shadow-2xl transition-colors duration-500`}>
         <div className="bg-white/5 backdrop-blur-xl p-6 md:p-8 rounded-[1.9rem] border border-white/10">
            {!syncId ? (
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center text-white flex-shrink-0">
                    <i className={`fas ${isCreatingSync ? 'fa-spinner fa-spin' : 'fa-cloud-arrow-up'} text-2xl`}></i>
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white tracking-tight leading-none mb-2">Cloud Bridge</h3>
                    <p className="text-slate-300 text-sm font-medium">Link Sanjaya & Ravi devices for real-time updates.</p>
                  </div>
                </div>
                {editingSync ? (
                  <div className="flex gap-2 w-full md:w-auto">
                    <input 
                      className="bg-white/10 border border-white/20 text-white p-4 rounded-2xl outline-none focus:bg-white/20 flex-1 md:w-64"
                      placeholder="Paste Shared Key..."
                      value={newSyncId}
                      onChange={e => setNewSyncId(e.target.value)}
                    />
                    <button onClick={handleJoinSync} className="bg-white text-indigo-600 px-6 py-4 rounded-2xl font-black shadow-lg hover:bg-slate-100 active:scale-95 transition-all">Join</button>
                    <button onClick={() => setEditingSync(false)} className="text-white/50 px-2 hover:text-white transition-colors"><i className="fas fa-times"></i></button>
                  </div>
                ) : (
                  <div className="flex items-center gap-4 w-full md:w-auto justify-center">
                    <button 
                      onClick={() => setEditingSync(true)}
                      className="text-white/80 hover:text-white px-4 font-bold text-sm underline underline-offset-4"
                    >
                      I have a key
                    </button>
                    <button 
                      onClick={handleCreateSync}
                      disabled={isCreatingSync}
                      className="bg-white text-indigo-600 px-8 py-4 rounded-2xl font-black shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                    >
                      {isCreatingSync ? 'Setting up...' : 'Start New Sync'}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                 <div className="flex items-center gap-6">
                    <div className="relative">
                      <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-2xl rotate-3">
                         <i className="fas fa-sync fa-spin text-indigo-600 text-2xl" style={{animationDuration: '8s'}}></i>
                      </div>
                      <span className="absolute -top-1 -right-1 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-indigo-600"></span>
                      </span>
                    </div>
                    <div>
                       <h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                         Live Sync Active
                       </h3>
                       <div className="flex flex-wrap items-center gap-2 mt-1">
                          <code className="bg-black/20 text-indigo-100 px-3 py-1 rounded-lg font-mono text-xs border border-white/10 select-all">
                            {syncId}
                          </code>
                          <button 
                            onClick={handleCopyKey}
                            className={`text-xs font-bold px-3 py-1 rounded-lg transition-all ${copyFeedback ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
                          >
                            <i className={`fas ${copyFeedback ? 'fa-check' : 'fa-copy'} mr-1.5`}></i>
                            {copyFeedback ? 'Copied!' : 'Copy Key'}
                          </button>
                       </div>
                       <p className="text-indigo-100/50 text-[10px] font-bold uppercase tracking-widest mt-2">
                         {lastSyncTime ? `Updated: ${new Date(lastSyncTime).toLocaleTimeString()}` : 'Connected'}
                       </p>
                    </div>
                 </div>
                 <div className="flex items-center gap-3">
                    <button 
                      onClick={onManualSync}
                      className="bg-indigo-500 text-white px-6 py-3 rounded-xl font-black border border-indigo-400 hover:bg-indigo-400 transition-all flex items-center gap-2"
                    >
                      <i className="fas fa-refresh"></i> Sync Now
                    </button>
                    <button onClick={disconnectSync} className="w-12 h-12 flex items-center justify-center rounded-xl bg-white/5 text-white/40 hover:text-rose-400 hover:bg-rose-500/10 transition-all">
                      <i className="fas fa-unlink"></i>
                    </button>
                 </div>
              </div>
            )}
         </div>
      </div>

      {/* Financial Health Summary Block (Replaces AI Analyst) */}
      <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
              <i className="fas fa-chart-line text-xl"></i>
            </div>
            <div>
              <h3 className="text-2xl font-black tracking-tight leading-tight">Project Health Summary</h3>
              <p className="text-indigo-300 text-[10px] font-bold uppercase tracking-widest">Real-time ledger overview</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/10">
              <span className="text-indigo-300 text-[10px] font-bold uppercase tracking-widest block mb-2">Project Progress</span>
              <div className="text-2xl font-black mb-1">
                {charges.length} Cost Items
              </div>
              <p className="text-indigo-100/60 text-xs font-medium">Recorded since {charges.length > 0 ? charges[0].date : 'N/A'}</p>
            </div>

            <div className="bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/10">
              <span className="text-indigo-300 text-[10px] font-bold uppercase tracking-widest block mb-2">Payment Completion</span>
              <div className="text-2xl font-black mb-1">
                {totals.costs > 0 ? Math.round((totals.paid / totals.costs) * 100) : 0}% Paid
              </div>
              <div className="w-full bg-white/10 h-1.5 rounded-full mt-2 overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all duration-1000" 
                  style={{ width: `${Math.min(100, Math.max(0, totals.costs > 0 ? (totals.paid / totals.costs) * 100 : 0))}%` }}
                ></div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/10">
              <span className="text-indigo-300 text-[10px] font-bold uppercase tracking-widest block mb-2">Financial Status</span>
              <div className={`text-2xl font-black mb-1 ${balance < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {balance < 0 ? 'Payment Due' : balance === 0 ? 'Settled' : 'Credit Balance'}
              </div>
              <p className="text-indigo-100/60 text-xs font-medium">Rs. {Math.abs(balance).toLocaleString()} outstanding</p>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px]"></div>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-xl transition-all duration-300">
          <div className="relative z-10">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mb-6">
              <i className="fas fa-file-invoice-dollar text-xl"></i>
            </div>
            <span className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] block mb-1">Design Costs (Sanjaya)</span>
            <div className="text-4xl font-black text-slate-900 tracking-tight">Rs. {totals.costs.toLocaleString()}</div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-xl transition-all duration-300">
          <div className="relative z-10">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6">
              <i className="fas fa-hand-holding-usd text-xl"></i>
            </div>
            <span className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] block mb-1">Total Payments (Ravi)</span>
            <div className="text-4xl font-black text-slate-900 tracking-tight">Rs. {totals.paid.toLocaleString()}</div>
          </div>
        </div>

        <div className={`p-8 rounded-[2rem] shadow-2xl border-4 relative overflow-hidden transition-all duration-500 ${
          balance < 0 ? 'bg-rose-600 border-rose-500 text-white' : 'bg-emerald-600 border-emerald-500 text-white'
        }`}>
          <div className="relative z-10">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
              <i className="fas fa-wallet text-xl"></i>
            </div>
            <span className="font-bold text-[10px] uppercase tracking-[0.2em] block mb-1 opacity-70">Current Balance</span>
            <div className="text-4xl font-black tracking-tight">Rs. {balance.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-6 md:p-10">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-10">
          <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
            <i className="fas fa-history text-indigo-600"></i> Ledger Timeline
          </h3>
          <button onClick={downloadReport} className="w-full sm:w-auto text-xs font-bold text-indigo-600 bg-indigo-50 px-6 py-3 rounded-full hover:bg-indigo-100 transition-colors">
            Download Text Report
          </button>
        </div>
        
        <div className="space-y-4">
          {combinedActivity.length === 0 ? (
            <div className="text-center py-20 bg-slate-50 border-2 border-dashed border-slate-100 rounded-[2rem]">
               <p className="text-slate-400 font-medium italic">Your activity timeline is currently empty.</p>
            </div>
          ) : (
            combinedActivity.map((activity: any) => (
              <div key={activity.id} className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 p-6 rounded-3xl bg-white border border-slate-50 hover:border-indigo-100 hover:shadow-lg transition-all">
                <div className={`w-14 h-14 rounded-2xl ${activity.bgColor} flex items-center justify-center shadow-sm flex-shrink-0`}>
                  <i className={`fas ${activity.icon} ${activity.color} text-xl`}></i>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row justify-between items-start mb-1 gap-2">
                    <div>
                      <span className="font-black text-slate-800 text-lg leading-tight">{activity.typeLabel === 'Charge' ? activity.type : activity.method}</span>
                      <span className="ml-0 sm:ml-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest block sm:inline">{activity.date} — {activity.addedBy}</span>
                    </div>
                    <span className={`text-xl font-black ${activity.color} whitespace-nowrap`}>
                      {activity.typeLabel === 'Charge' ? '-' : '+'} Rs. {activity.amount.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 italic truncate pr-4">{activity.description || activity.note || 'No specific notes.'}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
