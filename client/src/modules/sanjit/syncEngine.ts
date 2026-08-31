import { SyncQueueItem, EntityType, SyncStatus } from "../../shared/contract";

const STORAGE_KEY = "gurugale_sync_queue_v1";

export class SyncEngine {
  private queue: SyncQueueItem[] = [];
  private isOnline: boolean = true;
  private isSyncing: boolean = false;
  private lastSyncTime: string | null = null;
  private lastError: string | null = null;
  private forceFailureForTesting: boolean = false;
  private retryTimer: any = null;
  private listeners: Array<(status: SyncStatus, queue: SyncQueueItem[]) => void> = [];

  constructor() {
    this.loadFromStorage();

    // Listen to real browser network events
    if (typeof window !== "undefined") {
      this.isOnline = window.navigator.onLine;
      window.addEventListener("online", () => {
        this.isOnline = true;
        this.notify();
        this.autoFlushWithBackoff();
      });
      window.addEventListener("offline", () => {
        this.isOnline = false;
        this.notify();
      });
    }
  }

  private loadFromStorage() {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          this.queue = JSON.parse(stored);
        }
      }
    } catch (e) {
      console.error("[SyncEngine] Failed to load queue from storage", e);
    }
  }

  private saveToStorage() {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.queue));
      }
    } catch (e) {
      console.error("[SyncEngine] Failed to save queue to storage", e);
    }
  }

  public subscribe(cb: (status: SyncStatus, queue: SyncQueueItem[]) => void) {
    this.listeners.push(cb);
    cb(this.getSyncStatus(), this.getAllItems());
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  private notify() {
    const status = this.getSyncStatus();
    const items = this.getAllItems();
    this.listeners.forEach((cb) => cb(status, items));
  }

  public getSyncStatus(): SyncStatus {
    const totalPending = this.queue.filter((i) => !i.synced).length;
    const totalSynced = this.queue.filter((i) => i.synced).length;
    return {
      totalPending,
      totalSynced,
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      lastSyncTime: this.lastSyncTime,
      lastError: this.lastError,
    };
  }

  public getPendingItems(): SyncQueueItem[] {
    return this.queue.filter((i) => !i.synced);
  }

  public getAllItems(): SyncQueueItem[] {
    return [...this.queue].reverse();
  }

  // 1. Enqueue item from ANY section (Praveen cognitive sessions, Sanjit geofence events, Nish patient records)
  public enqueue(
    entityType: EntityType,
    payload: any,
    autoFlush: boolean = true
  ): SyncQueueItem {
    const item: SyncQueueItem = {
      id: `sync-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      entityType,
      payload,
      createdAt: new Date().toISOString(),
      synced: false,
      retryCount: 0,
    };

    this.queue.push(item);
    this.saveToStorage();
    this.notify();

    if (autoFlush && this.isOnline) {
      // Auto-flush asynchronously
      setTimeout(() => this.flushQueue(), 300);
    }

    return item;
  }

  // 2. Flush pending items to central ingestion endpoint (POST /api/sync/batch)
  public async flushQueue(): Promise<{
    success: boolean;
    syncedCount: number;
    errors: any[];
  }> {
    const pending = this.queue.filter((i) => !i.synced);

    if (pending.length === 0) {
      return { success: true, syncedCount: 0, errors: [] };
    }

    if (!this.isOnline) {
      this.lastError = "Cannot flush: Device is currently OFFLINE. Items remain queued safely.";
      this.notify();
      return { success: false, syncedCount: 0, errors: [this.lastError] };
    }

    if (this.isSyncing) {
      return { success: false, syncedCount: 0, errors: ["Sync already in progress"] };
    }

    this.isSyncing = true;
    this.lastError = null;
    this.notify();

    try {
      if (this.forceFailureForTesting) {
        throw new Error("Simulated Network Timeout / Server 500 Error (Testing Backoff Retry)");
      }

      // Send batch to server
      const response = await fetch("/api/sync/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: pending }),
      });

      if (!response.ok) {
        throw new Error(`Server responded with HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      const processedIds: string[] = result.processedIds || [];

      // Mark processed items as synced
      this.queue = this.queue.map((item) => {
        if (processedIds.includes(item.id)) {
          return { ...item, synced: true };
        }
        return item;
      });

      this.lastSyncTime = new Date().toISOString();
      this.lastError = null;
      this.saveToStorage();
      this.isSyncing = false;
      this.notify();

      return {
        success: true,
        syncedCount: processedIds.length,
        errors: result.errors || [],
      };
    } catch (err: any) {
      console.warn("[SyncEngine] Sync failed, scheduling exponential backoff retry:", err);

      // Increment retryCount for pending items
      this.queue = this.queue.map((item) => {
        if (!item.synced) {
          return { ...item, retryCount: item.retryCount + 1 };
        }
        return item;
      });

      this.lastError = err?.message || "Sync failed";
      this.isSyncing = false;
      this.saveToStorage();
      this.notify();

      // Trigger automatic backoff retry
      this.autoFlushWithBackoff();

      return {
        success: false,
        syncedCount: 0,
        errors: [this.lastError],
      };
    }
  }

  private autoFlushWithBackoff() {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
    }

    const pending = this.queue.filter((i) => !i.synced);
    if (pending.length === 0 || !this.isOnline) return;

    const maxRetries = Math.max(...pending.map((p) => p.retryCount), 0);
    // Exponential backoff: 2s, 4s, 8s, 16s, max 30s
    const backoffMs = Math.min(30000, Math.pow(2, maxRetries) * 1000);

    this.retryTimer = setTimeout(() => {
      if (this.isOnline && this.getPendingItems().length > 0) {
        this.flushQueue();
      }
    }, backoffMs);
  }

  public setOnlineMode(online: boolean) {
    this.isOnline = online;
    this.notify();
    if (online) {
      this.flushQueue();
    }
  }

  public toggleOnlineMode() {
    this.setOnlineMode(!this.isOnline);
  }

  public setForceFailure(force: boolean) {
    this.forceFailureForTesting = force;
  }

  public isForceFailureActive(): boolean {
    return this.forceFailureForTesting;
  }

  public clearSyncedItems() {
    this.queue = this.queue.filter((i) => !i.synced);
    this.saveToStorage();
    this.notify();
  }

  public clearAll() {
    this.queue = [];
    this.saveToStorage();
    this.notify();
  }
}

export const syncEngine = new SyncEngine();
