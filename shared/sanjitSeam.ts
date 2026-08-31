/**
 * SANJIT INTEGRATION SEAM: Geofencing, GPS & Offline Sync Engine
 * 
 * Provides stable API:
 * - enqueue(entityType, payload)
 * - flushQueue()
 * - getSyncStatus()
 */

import { EntityType, SyncQueueItem, GeofenceEvent } from './contract';

class SanjitSyncEngine {
  private queue: SyncQueueItem[] = [];
  private isOnline: boolean = true;
  private lastSyncTime: string | null = null;
  private serverEndpoint: string = 'http://localhost:5000/api/sync/batch';

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const data = localStorage.getItem('sanjit_sync_queue');
        if (data) this.queue = JSON.parse(data);
      }
    } catch (e) {
      console.warn('Storage unavailable', e);
    }
  }

  private saveToStorage(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('sanjit_sync_queue', JSON.stringify(this.queue));
      }
    } catch (e) {
      console.warn('Failed to save to storage', e);
    }
  }

  /**
   * Enqueues any local write (GameSession, GeofenceEvent, ReminderAck, PatientRecord)
   */
  public async enqueue(entityType: EntityType, payload: any): Promise<SyncQueueItem> {
    const item: SyncQueueItem = {
      id: 'sync_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now(),
      entityType,
      payload,
      createdAt: new Date().toISOString(),
      synced: false,
      retryCount: 0,
      status: 'pending'
    };

    this.queue.push(item);
    this.saveToStorage();

    // Auto-flush if online
    if (this.isOnline) {
      setTimeout(() => this.flushQueue(), 100);
    }

    return item;
  }

  /**
   * Flushes all pending items to the server REST API with retry & backoff
   */
  public async flushQueue(): Promise<{ syncedCount: number; failedCount: number }> {
    if (!this.isOnline) {
      return { syncedCount: 0, failedCount: this.getPendingCount() };
    }

    const pendingItems = this.queue.filter(item => !item.synced);
    if (pendingItems.length === 0) {
      return { syncedCount: 0, failedCount: 0 };
    }

    try {
      const response = await fetch(this.serverEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: pendingItems })
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const result = await response.json();
      const ingestedIds = new Set(result.ingestedIds || pendingItems.map(i => i.id));

      this.queue = this.queue.map(item => {
        if (ingestedIds.has(item.id)) {
          return { ...item, synced: true, status: 'synced' };
        }
        return item;
      });

      this.lastSyncTime = new Date().toISOString();
      this.saveToStorage();

      return { syncedCount: ingestedIds.size, failedCount: pendingItems.length - ingestedIds.size };
    } catch (err: any) {
      console.error('Flush failed, applying backoff', err);
      this.queue = this.queue.map(item => {
        if (!item.synced) {
          return { 
            ...item, 
            retryCount: item.retryCount + 1, 
            status: 'failed',
            lastError: err.message 
          };
        }
        return item;
      });
      this.saveToStorage();
      return { syncedCount: 0, failedCount: pendingItems.length };
    }
  }

  /**
   * Returns current sync engine status
   */
  public getSyncStatus(): { pendingCount: number; isOnline: boolean; lastSyncTime: string | null; totalQueued: number } {
    return {
      pendingCount: this.getPendingCount(),
      isOnline: this.isOnline,
      lastSyncTime: this.lastSyncTime,
      totalQueued: this.queue.length
    };
  }

  public getPendingCount(): number {
    return this.queue.filter(i => !i.synced).length;
  }

  public setOnlineStatus(online: boolean): void {
    this.isOnline = online;
    if (online) {
      this.flushQueue();
    }
  }

  public getQueue(): SyncQueueItem[] {
    return [...this.queue];
  }

  public clearQueue(): void {
    this.queue = [];
    this.saveToStorage();
  }
}

export const sanjitSyncEngine = new SanjitSyncEngine();
export const enqueue = (entityType: EntityType, payload: any) => sanjitSyncEngine.enqueue(entityType, payload);
export const flushQueue = () => sanjitSyncEngine.flushQueue();
export const getSyncStatus = () => sanjitSyncEngine.getSyncStatus();
