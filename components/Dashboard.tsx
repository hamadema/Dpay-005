
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
  charges, payments, totals, balance, securityLogs, aiAnalysis, isAnalyzing, onRunAnalysis,
  syncId, lastSyncTime, onManualSync
}) => {
  const [editingSync, setEditingSync] = useState(false);
  const [newSyncId, setNewSyncId] = useState('');

  const combinedActivity = [
    ...charges.map(c => ({ ...c, typeLabel: 'Charge', color: 'text-rose-500', icon: 'fa-minus-circle', bgColor: 'bg-rose-50' })),
    ...payments.map(p => ({ ...p, typeLabel: 'Payment', color: 'text-emerald-500', icon: 'fa-plus-circle', bgColor: 'bg-emerald-50' }))
  ].sort((a, b) => b.timestamp - a.timestamp).slice(0, 10);

  const generateNewSyncKey = () => {
    // Generates a random ID that works with npoint.io relay
    const randomKey = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    db.setSyncId(randomKey);
    alert("New Secret Sync Key Created! Share this key with the other party to link your ledgers automatically.");
  };

  const handleJoinSync = () => {
    if (!newSyncId.trim()) return;
    db.setSyncId(newSyncId.trim());
    setEditingSync(false);
    onManualSync();
    alert("Cloud Sync Linked! Your ledger will now stay updated automatically.");
  };

  const disconnectSync = () => {
    if (confirm("Stop automated syncing? This will keep your data local but stop updates from the other person.")) {
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
      <div className={`${syncId ? 'bg-indigo-600' : 'bg-slate-800'} rounded-[2.5rem] p-1 shadow-2xl overflow-hidden group transition-colors duration-500`}>
         <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[2.4rem] border border-white/10">
            {!syncId ? (
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center text-white">
                    <i className="fas fa-cloud-upload-alt text-2xl"></i>
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white tracking-tight">Automated Cloud Sync</h3>
                    <p className="text-slate-300 text-sm font-medium">Link Sanjaya & Ravi devices for real-time updates.</p>
                  </div>
                </div>
                {editingSync ? (
                  <div className="flex gap-2 w-full md:w-auto">
                    <input 
                      className="bg-white/10 border border-white/20 text-white p-4 rounded-2xl outline-none focus:bg-white/20 flex-1 md:w-48"
                      placeholder="Paste Secret Key..."
                      value={newSyncId}
                      onChange={e => setNewSyncId(e.target.value)}
                    />
                    <button onClick={handleJoinSync} className="bg-white text-indigo-600 px-6 py-4 rounded-2xl font-black">Link</button>
                    <button onClick={() => setEditingSync(false)} className="text-white/50 px-2"><i className="fas fa-times"></i></button>
                  </div>
                ) : (
                  <div className="flex gap-4">
                    <button 
                      onClick={() => setEditingSync(true)}
                      className="text-white/80 hover:text-white px-4 font-bold text-sm"
                    >
                      I have a key
                    </button>
                    <button 
                      onClick={generateNewSyncKey}
                      className="bg-white text-indigo-600 px-8 py-4 rounded-2xl font-black shadow-xl hover:scale-105 active:scale-95 transition-all"
                    >
                      Start New Sync
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                 <div className="flex items-center gap-6">
                    <div className="relative">
                      <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-2xl rotate-3 group-hover:rotate-0 transition-all">
                         <i className="fas fa-sync fa-spin text-indigo-600 text-2xl" style={{animationDuration: '10s'}}></i>
                      </div>
                      <span className="absolute -top-1 -right-1 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-indigo-600"></span>
                      </span>
                    </div>
                    <div>
                       <h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                         Live Sync Enabled
                         <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-mono font-bold tracking-normal opacity-70">KEY: {syncId.substring(0,6)}...</span>
                       </h3>
                       <p className="text-indigo-100/70 text-sm font-medium">
                         {lastSyncTime ? `Last update: ${new Date(lastSyncTime).toLocaleTimeString()}` : 'Connecting...'}
                       </p>
                    </div>
                 </div>
                 <div className="flex items-center gap-4">
                    <button 
                      onClick={onManualSync}
                      className="text-white/80 hover:text-white px-4 font-bold text-sm"
                    >
                      Sync Now
                    </button>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(syncId);
                        alert("Sync Key Copied! Share this with the other person.");
                      }}
                      className="bg-indigo-500 text-white px-6 py-4 rounded-2xl font-black border border-indigo-400 hover:bg-indigo-400 transition-all"
                    >
                      Share Key
                    </button>
                    <button onClick={disconnectSync} className="text-white/30 hover:text-rose-400 transition-colors">
                      <i className="fas fa-unlink"></i>
                    </button>
                 </div>
              </div>
            )}
         </div>
      </div>

      {/* Security Alerts */}
      {securityLogs.length > 0 && (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-6 shadow-sm ring-4 ring-amber-50/50">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-amber-800 font-black flex items-center gap-2 text-sm uppercase tracking-widest">
              <i className="fas fa-shield-virus animate-pulse"></i> Security Monitor
            </h3>
            <button onClick={() => db.clearSecurityLogs()} className="text-[10px] bg-amber-200 text-amber-900 px-3 py-1 rounded-full font-bold">Clear Logs</button>
          </div>
          <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
            {securityLogs.slice().reverse().map(log => (
              <div key={log.id} className="flex justify-between items-center bg-white/80 p-2.5 rounded-xl border border-amber-100 text-[11px] shadow-sm">
                <span className="font-bold text-amber-900">Attempt: {log.attemptedEmail}</span>
                <div className="flex items-center gap-4">
                  <span className={`font-black ${log.status === 'WRONG_PASSWORD' ? 'text-rose-500' : 'text-amber-600'}`}>{log.status}</span>
                  <span className="text-slate-400 font-mono opacity-60">{log.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-xl transition-all duration-300">
          <div className="relative z-10">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mb-6">
              <i className="fas fa-file-invoice-dollar text-xl"></i>
            </div>
            <span className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] block mb-1">Total Costs (Sanjaya)</span>
            <div className="text-4xl font-black text-slate-900 tracking-tight">Rs. {totals.costs.toLocaleString()}</div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-xl transition-all duration-300">
          <div className="relative z-10">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6">
              <i className="fas fa-hand-holding-usd text-xl"></i>
            </div>
            <span className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] block mb-1">Total Paid (Ravi)</span>
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
            <span className="font-bold text-[10px] uppercase tracking-[0.2em] block mb-1 opacity-70">Project Balance</span>
            <div className="text-4xl font-black tracking-tight">Rs. {balance.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Gemini AI Analyst Section */}
      <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center shadow-lg">
                <i className="fas fa-sparkles"></i>
              </div>
              <div>
                <h3 className="text-2xl font-black tracking-tight">AI Financial Analyst</h3>
                <p className="text-indigo-300 text-xs font-bold uppercase tracking-widest">Powered by Gemini 3</p>
              </div>
            </div>
            <button 
              onClick={onRunAnalysis}
              disabled={isAnalyzing}
              className={`px-8 py-3 rounded-2xl font-black text-sm transition-all ${
                isAnalyzing ? 'bg-white/10 text-white/50 cursor-not-allowed' : 'bg-white text-indigo-900 hover:scale-105 shadow-xl'
              }`}
            >
              {isAnalyzing ? <span className="flex items-center gap-2"><i className="fas fa-spinner fa-spin"></i> Analyzing...</span> : 'Get Analysis'}
            </button>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-3xl p-8 border border-white/10 min-h-[120px]">
            {aiAnalysis ? (
              <p className="text-lg font-medium leading-relaxed italic text-indigo-50">"{aiAnalysis}"</p>
            ) : (
              <div className="flex flex-col items-center justify-center h-full opacity-30 text-center">
                <i className="fas fa-brain text-4xl mb-4"></i>
                <p className="text-sm font-bold uppercase tracking-widest">Run analysis to see ledger insights</p>
              </div>
            )}
          </div>
        </div>
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-indigo-500/20 rounded-full blur-[100px]"></div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-10">
        <div className="flex justify-between items-center mb-10">
          <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
            <i className="fas fa-stream text-indigo-600"></i> Project Activity
          </h3>
          <button onClick={downloadReport} className="text-xs font-bold text-indigo-600 bg-indigo-50 px-5 py-2.5 rounded-full hover:bg-indigo-100 transition-colors">
            Export History
          </button>
        </div>
        
        <div className="space-y-4">
          {combinedActivity.length === 0 ? (
            <div className="text-center py-20 bg-slate-50 border-2 border-dashed border-slate-100 rounded-[2rem]">
               <p className="text-slate-400 font-medium italic">No ledger activity recorded yet.</p>
            </div>
          ) : (
            combinedActivity.map((activity: any) => (
              <div key={activity.id} className="flex items-center gap-6 p-6 rounded-3xl bg-white border border-slate-50 hover:border-indigo-100 hover:shadow-lg transition-all">
                <div className={`w-14 h-14 rounded-2xl ${activity.bgColor} flex items-center justify-center shadow-sm`}>
                  <i className={`fas ${activity.icon} ${activity.color} text-xl`}></i>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <span className="font-black text-slate-800 text-lg">{activity.typeLabel === 'Charge' ? activity.type : activity.method}</span>
                      <span className="ml-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{activity.date} by {activity.addedBy}</span>
                    </div>
                    <span className={`text-xl font-black ${activity.color}`}>
                      {activity.typeLabel === 'Charge' ? '-' : '+'} Rs. {activity.amount.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 italic truncate max-w-xl">{activity.description || activity.note || 'No notes.'}</p>
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
