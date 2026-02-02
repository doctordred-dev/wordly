// IndexedDB wrapper for offline storage of flashcards and sync queue
// Provides full offline functionality with background sync

const DB_NAME = 'wordly-offline-db';
const DB_VERSION = 2;
const FLASHCARDS_STORE = 'flashcards';
const MODULES_STORE = 'modules';
const SYNC_QUEUE_STORE = 'sync-queue';

export interface OfflineFlashcard {
  id: string;
  word: string;
  translation: string;
  module_id: string | null;
  user_id: string;
  source_lang: string;
  target_lang: string;
  created_at: string;
  updated_at: string;
  // Offline-specific fields
  _offline?: boolean;
  _synced?: boolean;
}

export interface OfflineModule {
  id: string;
  name: string;
  description: string | null;
  color: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  flashcard_count?: number;
}

export interface SyncQueueItem {
  id: string;
  action: 'create' | 'update' | 'delete';
  store: 'flashcards' | 'modules';
  data: any;
  timestamp: number;
  retries: number;
}

class OfflineStorage {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  async init(): Promise<void> {
    // Return existing promise if already initializing
    if (this.initPromise) {
      return this.initPromise;
    }

    // Return immediately if already initialized
    if (this.db) {
      return Promise.resolve();
    }

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        this.initPromise = null;
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.initPromise = null;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create flashcards store
        if (!db.objectStoreNames.contains(FLASHCARDS_STORE)) {
          const flashcardsStore = db.createObjectStore(FLASHCARDS_STORE, { keyPath: 'id' });
          flashcardsStore.createIndex('user_id', 'user_id', { unique: false });
          flashcardsStore.createIndex('module_id', 'module_id', { unique: false });
          flashcardsStore.createIndex('updated_at', 'updated_at', { unique: false });
        }

        // Create modules store
        if (!db.objectStoreNames.contains(MODULES_STORE)) {
          const modulesStore = db.createObjectStore(MODULES_STORE, { keyPath: 'id' });
          modulesStore.createIndex('user_id', 'user_id', { unique: false });
        }

        // Create sync queue store
        if (!db.objectStoreNames.contains(SYNC_QUEUE_STORE)) {
          const syncStore = db.createObjectStore(SYNC_QUEUE_STORE, { keyPath: 'id' });
          syncStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });

    return this.initPromise;
  }

  private async ensureDb(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init();
    }
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    return this.db;
  }

  // ========== Flashcards Operations ==========

  async saveFlashcard(flashcard: OfflineFlashcard): Promise<void> {
    const db = await this.ensureDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([FLASHCARDS_STORE], 'readwrite');
      const store = transaction.objectStore(FLASHCARDS_STORE);
      const request = store.put(flashcard);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async saveFlashcards(flashcards: OfflineFlashcard[]): Promise<void> {
    if (flashcards.length === 0) return Promise.resolve();

    const db = await this.ensureDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([FLASHCARDS_STORE], 'readwrite');
      const store = transaction.objectStore(FLASHCARDS_STORE);

      let completed = 0;
      let hasError = false;

      flashcards.forEach((flashcard) => {
        const request = store.put(flashcard);
        request.onsuccess = () => {
          completed++;
          if (completed === flashcards.length && !hasError) {
            resolve();
          }
        };
        request.onerror = () => {
          if (!hasError) {
            hasError = true;
            reject(request.error);
          }
        };
      });
    });
  }

  async getFlashcard(id: string): Promise<OfflineFlashcard | null> {
    const db = await this.ensureDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([FLASHCARDS_STORE], 'readonly');
      const store = transaction.objectStore(FLASHCARDS_STORE);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllFlashcards(userId: string): Promise<OfflineFlashcard[]> {
    const db = await this.ensureDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([FLASHCARDS_STORE], 'readonly');
      const store = transaction.objectStore(FLASHCARDS_STORE);
      const index = store.index('user_id');
      const request = index.getAll(userId);

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async getFlashcardsByModule(moduleId: string | null, userId: string): Promise<OfflineFlashcard[]> {
    const db = await this.ensureDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([FLASHCARDS_STORE], 'readonly');
      const store = transaction.objectStore(FLASHCARDS_STORE);
      const index = store.index('module_id');
      const request = index.getAll(moduleId);

      request.onsuccess = () => {
        // Filter by user_id as well
        const results = (request.result || []).filter(f => f.user_id === userId);
        resolve(results);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async deleteFlashcard(id: string): Promise<void> {
    const db = await this.ensureDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([FLASHCARDS_STORE], 'readwrite');
      const store = transaction.objectStore(FLASHCARDS_STORE);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clearFlashcards(): Promise<void> {
    const db = await this.ensureDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([FLASHCARDS_STORE], 'readwrite');
      const store = transaction.objectStore(FLASHCARDS_STORE);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // ========== Modules Operations ==========

  async saveModule(module: OfflineModule): Promise<void> {
    const db = await this.ensureDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([MODULES_STORE], 'readwrite');
      const store = transaction.objectStore(MODULES_STORE);
      const request = store.put(module);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async saveModules(modules: OfflineModule[]): Promise<void> {
    if (modules.length === 0) return Promise.resolve();

    const db = await this.ensureDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([MODULES_STORE], 'readwrite');
      const store = transaction.objectStore(MODULES_STORE);

      let completed = 0;
      let hasError = false;

      modules.forEach((module) => {
        const request = store.put(module);
        request.onsuccess = () => {
          completed++;
          if (completed === modules.length && !hasError) {
            resolve();
          }
        };
        request.onerror = () => {
          if (!hasError) {
            hasError = true;
            reject(request.error);
          }
        };
      });
    });
  }

  async getAllModules(userId: string): Promise<OfflineModule[]> {
    const db = await this.ensureDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([MODULES_STORE], 'readonly');
      const store = transaction.objectStore(MODULES_STORE);
      const index = store.index('user_id');
      const request = index.getAll(userId);

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteModule(id: string): Promise<void> {
    const db = await this.ensureDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([MODULES_STORE], 'readwrite');
      const store = transaction.objectStore(MODULES_STORE);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // ========== Sync Queue Operations ==========

  async addToSyncQueue(item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'retries'>): Promise<void> {
    const db = await this.ensureDb();
    const queueItem: SyncQueueItem = {
      ...item,
      id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retries: 0,
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SYNC_QUEUE_STORE], 'readwrite');
      const store = transaction.objectStore(SYNC_QUEUE_STORE);
      const request = store.put(queueItem);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getSyncQueue(): Promise<SyncQueueItem[]> {
    const db = await this.ensureDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SYNC_QUEUE_STORE], 'readonly');
      const store = transaction.objectStore(SYNC_QUEUE_STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        const items = request.result || [];
        // Sort by timestamp
        items.sort((a, b) => a.timestamp - b.timestamp);
        resolve(items);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async removeSyncQueueItem(id: string): Promise<void> {
    const db = await this.ensureDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SYNC_QUEUE_STORE], 'readwrite');
      const store = transaction.objectStore(SYNC_QUEUE_STORE);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async updateSyncQueueItem(item: SyncQueueItem): Promise<void> {
    const db = await this.ensureDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SYNC_QUEUE_STORE], 'readwrite');
      const store = transaction.objectStore(SYNC_QUEUE_STORE);
      const request = store.put(item);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clearSyncQueue(): Promise<void> {
    const db = await this.ensureDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SYNC_QUEUE_STORE], 'readwrite');
      const store = transaction.objectStore(SYNC_QUEUE_STORE);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // ========== Utility Methods ==========

  async getStorageSize(): Promise<{ flashcards: number; modules: number; syncQueue: number }> {
    const db = await this.ensureDb();

    const flashcardsCount = await new Promise<number>((resolve, reject) => {
      const transaction = db.transaction([FLASHCARDS_STORE], 'readonly');
      const store = transaction.objectStore(FLASHCARDS_STORE);
      const request = store.count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    const modulesCount = await new Promise<number>((resolve, reject) => {
      const transaction = db.transaction([MODULES_STORE], 'readonly');
      const store = transaction.objectStore(MODULES_STORE);
      const request = store.count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    const syncQueueCount = await new Promise<number>((resolve, reject) => {
      const transaction = db.transaction([SYNC_QUEUE_STORE], 'readonly');
      const store = transaction.objectStore(SYNC_QUEUE_STORE);
      const request = store.count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return {
      flashcards: flashcardsCount,
      modules: modulesCount,
      syncQueue: syncQueueCount,
    };
  }

  async clearAllData(): Promise<void> {
    await this.clearFlashcards();
    await this.clearSyncQueue();
  }
}

// Singleton instance
export const offlineStorage = new OfflineStorage();

// Helper function to check if user is online
export function isOnline(): boolean {
  if (typeof navigator === 'undefined') return true;
  return navigator.onLine;
}

// Helper to get online/offline status with event listener
export function onlineStatusListener(callback: (online: boolean) => void): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

// Initialize storage on import (only in browser)
if (typeof window !== 'undefined') {
  offlineStorage.init().catch(err => {
    console.error('Failed to initialize offline storage:', err);
  });
}
