
import { DesignCharge, PaymentRecord, PriceTemplate, SecurityLog } from '../types';

class MockDatabase {
  private static STORAGE_KEY = 'design_ledger_db';
  private static SYNC_KEY = 'design_ledger_sync_id';
  private channel = new BroadcastChannel('ledger_sync_channel');

  public getData() {
    const data = localStorage.getItem(MockDatabase.STORAGE_KEY);
    const parsed = data ? JSON.parse(data) : { 
      charges: [], 
      payments: [], 
      securityLogs: [],
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

  async pushToCloud(syncId: string, data: any) {
    try {
      // We use npoint.io as a simple JSON relay. 
      // Note: In a production app, use Firebase or a proper backend.
      await fetch(`https://api.npoint.io/${syncId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          securityLogs: [], // Don't sync security logs for privacy
          updatedAt: Date.now()
        })
      });
    } catch (e) {
      console.warn("Cloud push failed, will retry later.");
    }
  }

  async pullFromCloud(syncId: string) {
    try {
      const response = await fetch(`https://api.npoint.io/${syncId}`);
      if (!response.ok) return null;
      const cloudData = await response.json();
      
      const localData = this.getData();
      
      // Basic conflict resolution: newest data wins
      if (cloudData && (!localData.updatedAt || cloudData.updatedAt > localData.updatedAt)) {
        // Merge templates if cloud has none
        if (!cloudData.templates) cloudData.templates = localData.templates;
        
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
    // Don't update updatedAt for security logs as they aren't synced
    localStorage.setItem(MockDatabase.STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent('ledger_local_update'));
  }

  saveTemplates(templates: PriceTemplate[]) {
    const data = this.getData();
    data.templates = templates;
    data.updatedAt = Date.now();
    this.saveData(data);
  }

  clearSecurityLogs() {
    const data = this.getData();
    data.securityLogs = [];
    localStorage.setItem(MockDatabase.STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent('ledger_local_update'));
  }

  getExportString() {
    const data = this.getData();
    const exportData = { ...data, securityLogs: [] };
    return btoa(encodeURIComponent(JSON.stringify(exportData)));
  }

  importData(exportString: string) {
    try {
      const decoded = decodeURIComponent(atob(exportString));
      const data = JSON.parse(decoded);
      if (data && (data.charges || data.payments)) {
        data.updatedAt = Date.now();
        this.saveData(data);
        return true;
      }
    } catch (e) {
      console.error("Failed to import ledger data", e);
    }
    return false;
  }
}

export const db = new MockDatabase();
