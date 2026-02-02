// Audio caching using IndexedDB for PWA offline support
const DB_NAME = 'wordly-audio-cache';
const STORE_NAME = 'audio';
const DB_VERSION = 1;

let db: IDBDatabase | null = null;

// Initialize IndexedDB
async function initDB(): Promise<IDBDatabase> {
  if (db) return db;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'text' });
      }
    };
  });
}

// Get cached audio from IndexedDB
export async function getCachedAudio(text: string): Promise<Blob | null> {
  try {
    const database = await initDB();

    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(text.toLowerCase().trim());

      request.onsuccess = () => {
        if (request.result && request.result.audioBlob) {
          resolve(request.result.audioBlob);
        } else {
          resolve(null);
        }
      };

      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error getting cached audio:', error);
    return null;
  }
}

// Save audio to IndexedDB cache
export async function cacheAudio(text: string, audioBlob: Blob): Promise<void> {
  try {
    const database = await initDB();

    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      const data = {
        text: text.toLowerCase().trim(),
        audioBlob: audioBlob,
        timestamp: Date.now(),
      };

      const request = store.put(data);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error caching audio:', error);
  }
}

// Clear old cache entries (optional - for cleanup)
export async function clearOldCache(daysOld: number = 30): Promise<void> {
  try {
    const database = await initDB();
    const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000);

    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.openCursor();

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          if (cursor.value.timestamp < cutoffTime) {
            cursor.delete();
          }
          cursor.continue();
        } else {
          resolve();
        }
      };

      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error clearing old cache:', error);
  }
}
