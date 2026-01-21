
import React, { useState } from 'react';
import { UserProfile, DesignCharge, PriceTemplate } from '../types';
import { db } from '../services/mockDatabase';

interface DesignChargesProps {
  charges: DesignCharge[];
  templates: PriceTemplate[];
  user: UserProfile;
  syncId: string | null;
}

const DesignCharges: React.FC<DesignChargesProps> = ({ charges, templates, user, syncId }) => {
  const isSanjaya = user.role === 'DESIGNER';
  const [isInitializingSync, setIsInitializingSync] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    type: '',
    description: '',
    amount: ''
  });

  const handleCopyKey = () => {
    if (syncId) {
      navigator.clipboard.writeText(syncId);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || !formData.type) return;

    // Auto-create sync if it doesn't exist yet
    let activeSyncId = syncId;
    if (!activeSyncId && isSanjaya) {
      setIsInitializingSync(true);
      try {
        const newId = await db.createNewSyncSession();
        if (newId) {
          activeSyncId = newId;
          navigator.clipboard.writeText(newId);
          setCopyFeedback(true);
          setTimeout(() => setCopyFeedback(false), 3000);
        }
      } catch (err) {
        console.error("Auto-sync creation failed", err);
      } finally {
        setIsInitializingSync(false);
      }
    }

    const newCharge: DesignCharge = {
      id: Date.now().toString(),
      date: formData.date,
      type: formData.type,
      description: formData.description,
      amount: Number(formData.amount),
      addedBy: user.name,
      timestamp: Date.now()
    };

    db.addCharge(newCharge);
    setFormData({ ...formData, type: '', description: '', amount: '' });
  };

  const applyTemplate = (template: PriceTemplate) => {
    setFormData({
      ...formData,
      type: template.name,
      amount: template.amount.toString()
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {isSanjaya && (
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 relative overflow-hidden">
          {/* Cloud Bridge Banner for Sanjaya */}
          <div className={`mb-8 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 transition-all ${syncId ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 border-2 border-dashed border-slate-200'}`}>
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${syncId ? 'bg-white/20' : 'bg-slate-200 text-slate-400'}`}>
                <i className={`fas ${syncId ? 'fa-cloud-circle-check' : 'fa-cloud-slash'} text-lg`}></i>
              </div>
              <div>
                <p className="font-black text-sm uppercase tracking-wider">
                  {syncId ? 'Project Cloud Sync Active' : 'Cloud Sync Disabled'}
                </p>
                {syncId ? (
                  <div className="flex items-center gap-2 mt-0.5">
                    <code className="bg-black/20 px-2 py-0.5 rounded font-mono text-xs">{syncId}</code>
                    <button onClick={handleCopyKey} className="text-[10px] font-bold underline opacity-80 hover:opacity-100">
                      {copyFeedback ? 'COPIED!' : 'COPY KEY'}
                    </button>
                  </div>
                ) : (
                  <p className="text-[10px] font-bold opacity-60 uppercase tracking-tighter">Adding a cost will automatically link this to Ravi</p>
                )}
              </div>
            </div>
            {syncId && (
               <div className="text-[10px] font-black bg-white/10 px-3 py-1 rounded-full uppercase tracking-widest border border-white/10">
                 Linked to Ravi
               </div>
            )}
          </div>

          <h2 className="text-2xl font-black mb-8 flex items-center gap-3 text-slate-800">
            <i className="fas fa-plus-circle text-indigo-600"></i> Record Design Work
          </h2>
          
          <div className="mb-8">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Quick Templates</p>
            <div className="flex flex-wrap gap-3">
              {templates.map(t => (
                <button 
                  key={t.id}
                  onClick={() => applyTemplate(t)}
                  className="px-5 py-2.5 bg-white text-indigo-600 rounded-xl text-sm font-bold hover:bg-indigo-600 hover:text-white transition-all border-2 border-indigo-50 shadow-sm hover:shadow-indigo-100"
                >
                  {t.name} • <span className="opacity-70">Rs. {t.amount}</span>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Service Date</label>
                <input 
                  type="date" 
                  className="w-full border-2 border-slate-50 p-4 rounded-2xl bg-slate-50 outline-none focus:border-indigo-500 focus:bg-white transition-all font-bold"
                  value={formData.date}
                  onChange={e => setFormData({...formData, date: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Service Category</label>
                <input 
                  type="text" 
                  placeholder="e.g. Logo Design"
                  className="w-full border-2 border-slate-50 p-4 rounded-2xl bg-slate-50 outline-none focus:border-indigo-500 focus:bg-white transition-all font-bold"
                  value={formData.type}
                  onChange={e => setFormData({...formData, type: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cost (Rs.)</label>
                <input 
                  type="number" 
                  placeholder="500"
                  className="w-full border-2 border-slate-50 p-4 rounded-2xl bg-slate-50 outline-none focus:border-indigo-500 focus:bg-white transition-all font-black text-indigo-600"
                  value={formData.amount}
                  onChange={e => setFormData({...formData, amount: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Work Description (Optional)</label>
              <input 
                type="text" 
                placeholder="Briefly explain what was done for this project..."
                className="w-full border-2 border-slate-50 p-4 rounded-2xl bg-slate-50 outline-none focus:border-indigo-500 focus:bg-white transition-all font-medium"
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
              />
            </div>

            <button 
              type="submit"
              disabled={isInitializingSync}
              className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black shadow-2xl shadow-indigo-200 hover:bg-indigo-700 hover:scale-[1.01] active:scale-95 transition-all text-lg flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isInitializingSync ? (
                <><i className="fas fa-spinner fa-spin"></i> Initializing Cloud Bridge...</>
              ) : (
                <><i className="fas fa-check-circle"></i> Add Cost & Notify Ravi</>
              )}
            </button>
          </form>

          {/* New Key Alert */}
          {copyFeedback && !syncId && (
            <div className="mt-6 p-4 bg-emerald-50 border-2 border-emerald-100 rounded-2xl flex items-center gap-4 animate-in slide-in-from-top-4">
              <div className="w-10 h-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center">
                <i className="fas fa-share-nodes"></i>
              </div>
              <div>
                <p className="text-emerald-900 font-black text-xs uppercase tracking-wider">Sync Key Copied to Clipboard!</p>
                <p className="text-emerald-700 text-[10px] font-bold">Send this key to Ravi so he can see your updates.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* History Table */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-8 border-b flex justify-between items-center">
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-3">
             <i className="fas fa-list-ul text-slate-300"></i> Cost History
          </h2>
          <div className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-widest">
            {charges.length} Entries
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                <th className="px-8 py-5">Date</th>
                <th className="px-8 py-5">Service</th>
                <th className="px-8 py-5">Added By</th>
                <th className="px-8 py-5 text-right">Cost (Rs.)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {charges.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center text-slate-400 italic">No charges recorded yet</td>
                </tr>
              ) : (
                charges.slice().reverse().map(charge => (
                  <tr key={charge.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-6 text-sm font-bold text-slate-400 tabular-nums">{charge.date}</td>
                    <td className="px-8 py-6">
                      <div className="font-black text-slate-800 leading-tight group-hover:text-indigo-600 transition-colors">{charge.type}</div>
                      <div className="text-xs text-slate-400 mt-0.5 italic truncate max-w-xs">{charge.description || 'No description provided.'}</div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-tighter">{charge.addedBy}</span>
                    </td>
                    <td className="px-8 py-6 text-right font-black text-slate-900 text-lg tabular-nums">
                      Rs. {charge.amount.toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DesignCharges;
