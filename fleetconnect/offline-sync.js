/**
 * Offline Sync Utility
 * Manages offline data persistence using IndexedDB
 * Queues invoice submissions and syncs when back online
 */

const DB_NAME = 'FleetConnectOffline';
const DB_VERSION = 1;
const STORE_NAME = 'pending_invoices';

class OfflineSync {
  constructor() {
    this.db = null;
    this.isInitialized = false;
    this.syncInProgress = false;
  }

  /**
   * Initialize IndexedDB
   */
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('[OfflineSync] DB open failed:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.isInitialized = true;
        console.log('[OfflineSync] IndexedDB initialized');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
          store.createIndex('job_id', 'job_id', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('synced', 'synced', { unique: false });
          console.log('[OfflineSync] Object store created');
        }
      };
    });
  }

  /**
   * Save an offline invoice
   */
  async saveOfflineInvoice(invoiceData) {
    if (!this.isInitialized) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      const record = {
        ...invoiceData,
        synced: false,
        timestamp: Date.now(),
        offline_id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };

      const request = store.add(record);

      request.onsuccess = () => {
        console.log('[OfflineSync] Invoice saved:', request.result);
        resolve(request.result);
      };

      request.onerror = () => {
        console.error('[OfflineSync] Save failed:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get all pending (unsynced) invoices
   */
  async getPendingInvoices() {
    if (!this.isInitialized) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('synced');

      const request = index.getAll(false);

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        console.error('[OfflineSync] Get pending failed:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get all saved invoices (synced and unsynced)
   */
  async getAllOfflineInvoices() {
    if (!this.isInitialized) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Mark an invoice as synced
   */
  async markAsSynced(localId, remoteInvoiceId = null) {
    if (!this.isInitialized) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      const request = store.get(localId);

      request.onsuccess = () => {
        const record = request.result;
        if (record) {
          record.synced = true;
          record.synced_at = new Date().toISOString();
          if (remoteInvoiceId) record.remote_invoice_id = remoteInvoiceId;

          const updateRequest = store.put(record);
          updateRequest.onsuccess = () => {
            console.log('[OfflineSync] Marked as synced:', localId);
            resolve();
          };
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          reject(new Error('Invoice not found'));
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Sync pending invoices to Supabase
   */
  async syncPendingInvoices(submitCallback) {
    if (this.syncInProgress) {
      console.log('[OfflineSync] Sync already in progress');
      return { success: false, message: 'Sync in progress' };
    }

    this.syncInProgress = true;
    const pending = await this.getPendingInvoices();

    if (pending.length === 0) {
      this.syncInProgress = false;
      return { success: true, synced: 0 };
    }

    console.log(`[OfflineSync] Syncing ${pending.length} invoices...`);

    let synced = 0;
    let failed = 0;

    for (const invoice of pending) {
      try {
        const result = await submitCallback(invoice);
        if (result.success) {
          await this.markAsSynced(invoice.id, result.remoteId);
          synced++;
        } else {
          failed++;
          console.warn(`[OfflineSync] Failed to sync invoice ${invoice.id}:`, result.error);
        }
      } catch (err) {
        failed++;
        console.error(`[OfflineSync] Sync error for invoice ${invoice.id}:`, err);
      }
    }

    this.syncInProgress = false;
    console.log(`[OfflineSync] Sync complete: ${synced} synced, ${failed} failed`);

    return { success: true, synced, failed };
  }

  /**
   * Delete a synced invoice
   */
  async deleteSyncedData(daysOld = 7) {
    if (!this.isInitialized) await this.init();

    const cutoff = Date.now() - (daysOld * 24 * 60 * 60 * 1000);

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const records = request.result || [];
        records.forEach(record => {
          if (record.synced && record.synced_at) {
            const syncedTime = new Date(record.synced_at).getTime();
            if (syncedTime < cutoff) {
              store.delete(record.id);
            }
          }
        });
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get offline status
   */
  async getOfflineStatus() {
    const pending = await this.getPendingInvoices();
    return {
      hasPending: pending.length > 0,
      pendingCount: pending.length,
      isOnline: navigator.onLine
    };
  }
}

// Global instance
const offlineSync = new OfflineSync();

/**
 * Offline UI Component Manager
 * Handles the offline indicator banner
 */
class OfflineIndicator {
  constructor() {
    this.bannerId = 'offline-indicator-banner';
    this.toastId = 'offline-sync-toast';
  }

  /**
   * Create offline indicator banner
   */
  createBanner() {
    const existing = document.getElementById(this.bannerId);
    if (existing) existing.remove();

    const banner = document.createElement('div');
    banner.id = this.bannerId;
    banner.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      padding: 12px 16px;
      background: linear-gradient(135deg, #22c55e, #16a34a);
      color: #fff;
      font-size: 0.85rem;
      font-weight: 500;
      text-align: center;
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    `;
    banner.innerHTML = `
      <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
      </svg>
      <span>🟢 Online</span>
    `;
    document.body.insertBefore(banner, document.body.firstChild);
    this.updateBanner();
  }

  /**
   * Update banner based on online status
   */
  async updateBanner() {
    const banner = document.getElementById(this.bannerId);
    if (!banner) return;

    const isOnline = navigator.onLine;
    const { pendingCount } = await offlineSync.getOfflineStatus();

    if (isOnline) {
      banner.style.background = 'linear-gradient(135deg, #22c55e, #16a34a)';
      banner.innerHTML = `
        <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
        <span>🟢 Online${pendingCount > 0 ? ` • Syncing ${pendingCount} items...` : ''}</span>
      `;
    } else {
      banner.style.background = 'linear-gradient(135deg, #f59e0b, #d97706)';
      banner.innerHTML = `
        <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
          <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z"/>
        </svg>
        <span>🟠 Offline • ${pendingCount} pending</span>
      `;
    }
  }

  /**
   * Show sync status toast
   */
  showSyncToast(message, type = 'info') {
    const existing = document.getElementById(this.toastId);
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = this.toastId;
    const bgColor = type === 'success' ? '#22c55e' : type === 'error' ? '#ef4444' : '#3b82f6';
    toast.style.cssText = `
      position: fixed;
      bottom: 100px;
      left: 50%;
      transform: translateX(-50%);
      padding: 12px 20px;
      background: ${bgColor};
      color: white;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 500;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      animation: slideUp 0.3s ease-out;
    `;
    toast.textContent = message;

    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideUp {
        from { opacity: 0; transform: translateX(-50%) translateY(20px); }
        to { opacity: 1; transform: translateX(-50%) translateY(0); }
      }
    `;
    document.head.appendChild(style);

    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
  }
}

// Global offline indicator
const offlineIndicator = new OfflineIndicator();

/**
 * Initialize offline mode
 * Call this once on page load
 */
async function initOfflineMode() {
  try {
    // Initialize IndexedDB
    await offlineSync.init();
    console.log('[OfflineMode] IndexedDB ready');

    // Create offline indicator
    offlineIndicator.createBanner();

    // Listen for online/offline events
    window.addEventListener('online', async () => {
      console.log('[OfflineMode] Back online!');
      offlineIndicator.showSyncToast('Back online! Syncing pending invoices...', 'info');
      await offlineIndicator.updateBanner();

      // Trigger background sync if available
      if ('serviceWorker' in navigator && 'SyncManager' in window) {
        try {
          const registration = await navigator.serviceWorker.ready;
          await registration.sync.register('sync-invoices');
          console.log('[OfflineMode] Background sync registered');
        } catch (err) {
          console.warn('[OfflineMode] Background sync unavailable:', err);
        }
      }
    });

    window.addEventListener('offline', async () => {
      console.log('[OfflineMode] Offline detected');
      offlineIndicator.showSyncToast('You are now offline. Data will sync when back online.', 'info');
      await offlineIndicator.updateBanner();
    });

    // Listen for sync messages from service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', event => {
        if (event.data.type === 'BACKGROUND_SYNC' && event.data.action === 'sync-invoices') {
          console.log('[OfflineMode] Background sync triggered');
          offlineIndicator.updateBanner();
        }
      });
    }

    // Update banner periodically
    setInterval(() => offlineIndicator.updateBanner(), 5000);

    console.log('[OfflineMode] Initialized successfully');
  } catch (err) {
    console.error('[OfflineMode] Initialization failed:', err);
  }
}

/**
 * Cleanup old synced data periodically
 */
function setupCleanupScheduler() {
  // Run cleanup once a day
  setInterval(async () => {
    try {
      await offlineSync.deleteSyncedData(7);
      console.log('[OfflineMode] Cleanup completed');
    } catch (err) {
      console.warn('[OfflineMode] Cleanup error:', err);
    }
  }, 24 * 60 * 60 * 1000);
}

// Auto-initialize when script loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initOfflineMode);
} else {
  initOfflineMode();
}

setupCleanupScheduler();
