
import React, { useState, useEffect, useCallback } from 'react';
import { AUTHORIZED_USERS } from './constants';
import { UserProfile, DesignCharge, PaymentRecord, PriceTemplate, SecurityLog } from './types';
import { db } from './services/mockDatabase';
import Dashboard from './components/Dashboard';
import DesignCharges from './components/DesignCharges';
import Payments from './components/Payments';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Login from './components/Login';
import { GoogleGenAI } from "@google/genai";

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('logged_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [charges, setCharges] = useState<DesignCharge[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [templates, setTemplates] = useState<PriceTemplate[]>([]);
  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([]);
  const [syncId, setSyncId] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'charges' | 'payments' | 'templates'>('dashboard');
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Auto-sync function
  const performSync = useCallback(async () => {
    const currentSyncId = db.getSyncId();
    if (currentSyncId && !isSyncing) {
      setIsSyncing(true);
      try {
        const result = await db.pullFromCloud(currentSyncId);
        if (result) {
          setLastSyncTime(Date.now());
        }
      } catch (e) {
        console.error("Auto-sync failed");
      } finally {
        setIsSyncing(false);
      }
    }
  }, [isSyncing]);

  useEffect(() => {
    const unsubscribe = db.subscribe((data) => {
      setCharges(data.charges || []);
      setPayments(data.payments || []);
      setTemplates(data.templates || []);
      setSecurityLogs(data.securityLogs || []);
      setSyncId(data.syncId || null);
    });

    // Start polling if sync is enabled
    // Faster poll for testing, normally 30s is fine
    const pollInterval = setInterval(() => {
      performSync();
    }, 15000); 

    // Sync on mount if syncId exists
    performSync();

    // Also sync on window focus
    const onFocus = () => performSync();
    window.addEventListener('focus', onFocus);

    return () => {
      unsubscribe();
      clearInterval(pollInterval);
      window.removeEventListener('focus', onFocus);
    };
  }, [performSync]);

  const runAiAnalysis = async () => {
    if (charges.length === 0 && payments.length === 0) {
      setAiAnalysis("The ledger is currently empty. Start adding charges or payments to see insights.");
      return;
    }

    setIsAnalyzing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Analyze this design project ledger between Sanjaya (Designer) and Ravi (Job Giver).
      Costs: ${JSON.stringify(charges)}
      Payments: ${JSON.stringify(payments)}
      Total Costs: Rs. ${charges.reduce((a, b) => a + b.amount, 0)}
      Total Paid: Rs. ${payments.reduce((a, b) => a + b.amount, 0)}
      
      Provide a concise 3-sentence professional summary:
      1. Overall financial health of the project.
      2. Payment status (is Ravi paying on time?).
      3. A quick action recommendation for either party.
      Keep it professional yet friendly. Use emojis sparingly.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
      setAiAnalysis(response.text || "No analysis available.");
    } catch (error) {
      console.error(error);
      setAiAnalysis("AI Analysis is temporarily unavailable.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleLogin = (email: string, password?: string) => {
    const normalizedEmail = email.toLowerCase().trim();
    const authUser = AUTHORIZED_USERS[normalizedEmail];
    
    if (authUser) {
      if (authUser.password === password) {
        setCurrentUser(authUser);
        localStorage.setItem('logged_user', JSON.stringify(authUser));
      } else {
        db.addSecurityLog({
          id: Date.now().toString(),
          attemptedEmail: email,
          timestamp: Date.now(),
          date: new Date().toLocaleString(),
          status: 'WRONG_PASSWORD'
        });
        alert("Incorrect password for this account.");
      }
    } else {
      db.addSecurityLog({
        id: Date.now().toString(),
        attemptedEmail: email,
        timestamp: Date.now(),
        date: new Date().toLocaleString(),
        status: 'UNAUTHORIZED_EMAIL'
      });
      alert("Unauthorized Access Attempt Recorded.");
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('logged_user');
  };

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  const totals = {
    costs: charges.reduce((acc, c) => acc + c.amount, 0),
    paid: payments.reduce((acc, p) => acc + p.amount, 0),
  };
  const balance = totals.paid - totals.costs;

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 font-sans">
      <Sidebar 
        role={currentUser.role} 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        onLogout={handleLogout}
        userName={currentUser.name}
      />
      
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <Header 
          user={currentUser} 
          balance={balance} 
          isSyncing={isSyncing} 
          syncId={syncId} 
          onManualSync={performSync}
        />
        
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {activeTab === 'dashboard' && (
            <Dashboard 
              charges={charges} 
              payments={payments} 
              totals={totals} 
              balance={balance}
              securityLogs={securityLogs}
              aiAnalysis={aiAnalysis}
              isAnalyzing={isAnalyzing}
              onRunAnalysis={runAiAnalysis}
              syncId={syncId}
              lastSyncTime={lastSyncTime}
              onManualSync={performSync}
            />
          )}
          {activeTab === 'charges' && (
            <DesignCharges 
              charges={charges} 
              templates={templates} 
              user={currentUser} 
              syncId={syncId}
            />
          )}
          {activeTab === 'payments' && (
            <Payments 
              payments={payments} 
              user={currentUser} 
            />
          )}
          {activeTab === 'templates' && currentUser.role === 'DESIGNER' && (
            <TemplateView templates={templates} />
          )}
        </div>
      </main>
    </div>
  );
};

const TemplateView: React.FC<{ templates: PriceTemplate[] }> = ({ templates }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
           <i className="fas fa-tags"></i>
        </div>
        <h2 className="text-2xl font-black text-slate-800">Price List Management</h2>
      </div>
      <p className="text-slate-500 mb-8 font-medium">Create and manage your preset service costs for quick entry.</p>
      <TemplateManager templates={templates} />
    </div>
  );
};

const TemplateManager: React.FC<{ templates: PriceTemplate[] }> = ({ templates }) => {
  const [newTemplate, setNewTemplate] = useState({ name: '', amount: '' });

  const addTemplate = () => {
    if (!newTemplate.name || !newTemplate.amount) return;
    const next = [...templates, { id: Date.now().toString(), name: newTemplate.name, amount: Number(newTemplate.amount) }];
    db.saveTemplates(next);
    setNewTemplate({ name: '', amount: '' });
  };

  const removeTemplate = (id: string) => {
    db.saveTemplates(templates.filter(t => t.id !== id));
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row gap-4 bg-slate-50 p-6 rounded-2xl border border-dashed border-slate-300">
        <div className="flex-1">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">Service Name</label>
          <input 
            placeholder="e.g. Logo Design Package" 
            className="w-full border-2 border-white shadow-sm p-3 rounded-xl outline-none focus:border-indigo-500 transition-all font-semibold"
            value={newTemplate.name}
            onChange={e => setNewTemplate({...newTemplate, name: e.target.value})}
          />
        </div>
        <div className="w-full sm:w-40">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">Price (Rs.)</label>
          <input 
            type="number" 
            placeholder="0" 
            className="w-full border-2 border-white shadow-sm p-3 rounded-xl outline-none focus:border-indigo-500 transition-all font-bold"
            value={newTemplate.amount}
            onChange={e => setNewTemplate({...newTemplate, amount: e.target.value})}
          />
        </div>
        <button 
          onClick={addTemplate} 
          className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 self-end h-[52px] shadow-lg shadow-indigo-100 transition-all hover:scale-105 active:scale-95"
        >
          Add Template
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map(t => (
          <div key={t.id} className="group relative bg-white border border-slate-100 p-5 rounded-2xl shadow-sm hover:shadow-md hover:border-indigo-100 transition-all">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-slate-800 leading-tight">{t.name}</h3>
              <button onClick={() => removeTemplate(t.id)} className="text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100">
                <i className="fas fa-times-circle"></i>
              </button>
            </div>
            <div className="text-xl font-black text-indigo-600">Rs. {t.amount.toLocaleString()}</div>
            <div className="mt-3 pt-3 border-t border-slate-50 flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <i className="fas fa-magic"></i> Quick Add Enabled
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default App;
