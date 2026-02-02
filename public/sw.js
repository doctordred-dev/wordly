const CACHE_NAME = 'wordly-v2';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
];

// Dynamic cache for pages and assets
const RUNTIME_CACHE = 'wordly-runtime-v2';

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip chrome-extension and other non-http(s) schemes
  if (!event.request.url.startsWith('http')) {
    return;
  }
  
  // Skip API requests (always go to network)
  if (event.request.url.includes('/api/') || 
      event.request.url.includes('supabase.co')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Only cache successful responses
        if (response.status === 200) {
          const responseClone = response.clone();
          // Cache JS, CSS, images, and fonts
          if (event.request.url.match(/\.(js|css|png|jpg|jpeg|svg|gif|woff|woff2|ttf)$/)) {
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          // Cache HTML pages
          else if (event.request.destination === 'document') {
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache if network fails
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Return offline page for navigation requests
          if (event.request.mode === 'navigate') {
            return caches.match('/').then(response => {
              if (response) return response;
              // Fallback offline page
              return new Response(
                `<!DOCTYPE html>
                <html lang="en">
                <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>Offline - Wordly</title>
                  <style>
                    body {
                      margin: 0;
                      padding: 0;
                      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      min-height: 100vh;
                      font-family: system-ui, -apple-system, sans-serif;
                      color: white;
                      text-align: center;
                    }
                    .container {
                      padding: 2rem;
                    }
                    h1 {
                      font-size: 2rem;
                      margin-bottom: 1rem;
                    }
                    p {
                      font-size: 1.1rem;
                      opacity: 0.8;
                    }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <h1>📵 You're Offline</h1>
                    <p>Please check your internet connection and try again.</p>
                  </div>
                </body>
                </html>`,
                {
                  headers: { 'Content-Type': 'text/html' }
                }
              );
            });
          }
          return new Response('Offline', { status: 503 });
        });
      })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);

  if (event.tag === 'sync-flashcards') {
    event.waitUntil(syncFlashcards());
  }
});

async function syncFlashcards() {
  console.log('[SW] Starting flashcard sync...');

  try {
    // Open IndexedDB
    const db = await openSyncDB();

    // Get sync queue
    const queue = await getSyncQueue(db);

    if (queue.length === 0) {
      console.log('[SW] No items in sync queue');
      return;
    }

    console.log(`[SW] Found ${queue.length} items to sync`);

    // Process each item
    for (const item of queue) {
      try {
        await processSyncItem(item);
        await removeSyncQueueItem(db, item.id);
        console.log('[SW] Successfully synced item:', item.id);
      } catch (error) {
        console.error('[SW] Failed to sync item:', item.id, error);

        // Update retry count
        if (item.retries < 3) {
          item.retries++;
          await updateSyncQueueItem(db, item);
        } else {
          // Max retries reached, remove from queue
          await removeSyncQueueItem(db, item.id);
          console.log('[SW] Max retries reached, removed item:', item.id);
        }
      }
    }

    console.log('[SW] Sync complete');
  } catch (error) {
    console.error('[SW] Sync failed:', error);
    throw error; // This will cause the sync to retry later
  }
}

// Helper functions for IndexedDB operations in Service Worker
function openSyncDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('wordly-offline-db', 2);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function getSyncQueue(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['sync-queue'], 'readonly');
    const store = transaction.objectStore('sync-queue');
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

function removeSyncQueueItem(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['sync-queue'], 'readwrite');
    const store = transaction.objectStore('sync-queue');
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

function updateSyncQueueItem(db, item) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['sync-queue'], 'readwrite');
    const store = transaction.objectStore('sync-queue');
    const request = store.put(item);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function processSyncItem(item) {
  // This is a simplified version - the actual API calls would need proper auth
  // In production, you'd want to use the Supabase API with stored credentials
  const { action, store: storeName, data } = item;

  // Get the base URL
  const baseUrl = self.location.origin;

  if (storeName === 'flashcards') {
    let url, method, body;

    if (action === 'create') {
      // POST to create endpoint
      console.log('[SW] Creating flashcard:', data.id);
      // Would call your API here
    } else if (action === 'update') {
      // PUT to update endpoint
      console.log('[SW] Updating flashcard:', data.id);
      // Would call your API here
    } else if (action === 'delete') {
      // DELETE endpoint
      console.log('[SW] Deleting flashcard:', data.id);
      // Would call your API here
    }
  }

  // Note: Actual API calls require authentication which is complex in SW
  // For now, we'll let the client-side sync service handle the actual sync
  // This is just a placeholder for future enhancement
}
