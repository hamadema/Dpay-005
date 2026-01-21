
import { DesignCharge, PaymentRecord, PriceTemplate, SecurityLog } from '../types';

class MockDatabase {
  private static STORAGE_KEY = 'design_ledger_db';
  private static SYNC_KEY = 'design_ledger_sync_id';
  // npoint.io is more reliable for browser-based fetch as it returns ID in the body
  private static API_BASE = 'https://api.npoint.io';
  private channel = new BroadcastChannel('ledger_sync_channel');

  public getData() {
    const data = localStorage.getItem(MockDatabase.STORAGE_KEY);
    const parsed = data ? JSON.parse(data) : { 
      charges: [], 
      payments: [], 
      securityLogs: [],
      updatedAt: 0,
      templates: [
        { id: '1', name: 'Background Change', amount: 500 },
        { id: '2', name: 'Photo Retouch', amount: 300 },
        { id: '3', name: 'Album Basic', amount: 6000 },
        { id: '4', name: 'Album Premium', amount: 9000 }
      ] 
    };
    return parsed;
  }

  public getSyncId() {
    return localStorage.getItem(MockDatabase.SYNC_KEY);
  }

  public setSyncId(id: string | null) {
    if (id) {
      localStorage.setItem(MockDatabase.SYNC_KEY, id);
    } else {
      localStorage.removeItem(MockDatabase.SYNC_KEY);
    }
    window.dispatchEvent(new CustomEvent('ledger_local_update'));
  }

  private saveData(data: any) {
    localStorage.setItem(MockDatabase.STORAGE_KEY, JSON.stringify(data));
    this.channel.postMessage('update');
    window.dispatchEvent(new CustomEvent('ledger_local_update'));
    
    // Auto-push to cloud if sync is enabled
    const syncId = this.getSyncId();
    if (syncId) {
      this.pushToCloud(syncId, data);
    }
  }

  /**
   * Creates a new Cloud Sync session using npoint.io
   */
  async createNewSyncSession() {
    const initialData = this.getData();
    try {
      const response = await fetch(MockDatabase.API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...initialData, updatedAt: Date.now(), securityLogs: [] })
      });
      
      if (!response.ok) throw new Error("Cloud creation failed");
      
      const body = await response.json();
      if (body && body.id) {
        this.setSyncId(body.id);
        return body.id;
      }
    } catch (e) {
      console.error("Failed to create cloud sync:", e);
      throw e;
    }
    return null;
  }

  async pushToCloud(syncId: string, data: any) {
    try {
      await fetch(`${MockDatabase.API_BASE}/${syncId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          securityLogs: [], 
          updatedAt: Date.now()
        })
      });
    } catch (e) {
      console.warn("Cloud push failed.");
    }
  }

  async pullFromCloud(syncId: string) {
    try {
      const response = await fetch(`${MockDatabase.API_BASE}/${syncId}`);
      if (!response.ok) return null;
      
      const cloudData = await response.json();
      const localData = this.getData();
      
      // Conflict resolution: Newest timestamp wins
      if (cloudData && (!localData.updatedAt || cloudData.updatedAt > localData.updatedAt)) {
        cloudData.securityLogs = localData.securityLogs || [];
        localStorage.setItem(MockDatabase.STORAGE_KEY, JSON.stringify(cloudData));
        window.dispatchEvent(new CustomEvent('ledger_local_update'));
        return cloudData;
      }
    } catch (e) {
      console.warn("Cloud pull failed.");
    }
    return null;
  }

  subscribe(callback: (data: any) => void) {
    const handler = () => callback({ ...this.getData(), syncId: this.getSyncId() });
    this.channel.onmessage = () => handler();
    window.addEventListener('ledger_local_update', handler);
    handler();
    return () => {
      window.removeEventListener('ledger_local_update', handler);
    };
  }

  addCharge(charge: DesignCharge) {
    const data = this.getData();
    data.charges.push(charge);
    data.updatedAt = Date.now();
    this.saveData(data);
  }

  addPayment(payment: PaymentRecord) {
    const data = this.getData();
    data.payments.push(payment);
    data.updatedAt = Date.now();
    this.saveData(data);
  }

  addSecurityLog(log: SecurityLog) {
    const data = this.getData();
    if (!data.securityLogs) data.securityLogs = [];
    data.securityLogs.push(log);
    if (data.securityLogs.length > 20) data.securityLogs.shift();
    localStorage.setItem(MockDatabase.STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent('ledger_local_update'));
  }

  saveTemplates(templates: PriceTemplate[]) {
    const data = this.getData();
    data.templates = templates;
    data.updatedAt = Date.now();
    this.saveData(data);
  }
}

export const db = new MockDatabase();
