# Offline Mode Documentation

## Overview

Wordly now supports full offline functionality, allowing users to work with their flashcards even without an internet connection. All changes made offline are automatically synchronized when the connection is restored.

## Features

### ✅ What Works Offline

1. **View Flashcards**: Browse all your previously loaded flashcards
2. **Create Flashcards**: Add new flashcards (they'll sync when online)
3. **Edit Flashcards**: Modify existing flashcards
4. **Delete Flashcards**: Remove flashcards
5. **Quiz Mode**: Practice with your existing flashcards
6. **Match Mode**: Play matching games
7. **Modules**: View and switch between modules

### ❌ What Requires Internet

1. **Authentication**: Login/logout requires internet
2. **Translation API**: Auto-translation of new words
3. **Examples API**: Getting usage examples
4. **Text-to-Speech**: Audio pronunciation
5. **First-time Data Load**: Initial sync requires connection

## Technical Implementation

### Architecture

```
┌─────────────────┐
│   React App     │
│   (UI Layer)    │
└────────┬────────┘
         │
┌────────▼────────┐
│ Sync Service    │◄──── Auto-sync on reconnect
└────────┬────────┘
         │
┌────────▼────────┐
│   IndexedDB     │
│ (Local Storage) │
├─────────────────┤
│ • flashcards    │
│ • modules       │
│ • sync-queue    │
└─────────────────┘
```

### Storage Structure

#### IndexedDB Stores

1. **flashcards**: Stores all flashcard data
   - Indexed by: `user_id`, `module_id`, `updated_at`
   - Size: ~1-2MB per 1000 flashcards

2. **modules**: Stores module information
   - Indexed by: `user_id`

3. **sync-queue**: Pending changes to sync
   - Stores: create/update/delete operations
   - Auto-retries: Up to 3 attempts per item

### Sync Process

```
User makes change (offline)
  ↓
Save to IndexedDB
  ↓
Add to sync-queue
  ↓
[Wait for connection]
  ↓
Auto-sync triggered
  ↓
Process queue items
  ↓
Update Supabase
  ↓
Remove from queue
```

## User Experience

### Offline Indicator

A visual indicator appears in the top-right corner showing:
- 🔴 **Offline Mode**: No internet connection
- 🟡 **X changes pending**: Changes waiting to sync
- 🟢 **Online**: Connected and synced
- 🔄 **Syncing**: Currently synchronizing

Click the indicator to see:
- Sync progress
- Number of pending changes
- Manual sync button
- Status messages

### Auto-Sync

The app automatically syncs when:
1. User comes back online
2. App is reopened
3. User clicks "Sync now" button

### Conflict Resolution

If a conflict occurs (e.g., same flashcard edited online and offline):
- Server version wins (last-write-wins strategy)
- Offline changes are merged if possible
- User is notified of any conflicts

## Development

### Files Structure

```
lib/
├── offlineStorage.ts    # IndexedDB wrapper
└── syncService.ts       # Sync logic

components/
└── OfflineIndicator.tsx # UI indicator

public/
└── sw.js               # Service Worker with caching
```

### Testing Offline Mode

1. **Chrome DevTools**:
   - Open DevTools → Network tab
   - Select "Offline" from throttling dropdown

2. **Firefox DevTools**:
   - Open DevTools → Network tab
   - Click "Offline" checkbox

3. **Real Device**:
   - Enable Airplane mode
   - Or disable WiFi/mobile data

### API Usage

```typescript
import { offlineStorage, isOnline } from '@/lib/offlineStorage';
import { syncService } from '@/lib/syncService';

// Check online status
const online = isOnline();

// Save flashcard offline
await offlineStorage.saveFlashcard({
  id: 'card-123',
  word: 'hello',
  translation: 'привіт',
  user_id: 'user-id',
  // ...
});

// Get all flashcards
const flashcards = await offlineStorage.getAllFlashcards(userId);

// Manual sync
const result = await syncService.sync(userId);

// Check pending changes
const hasPending = await syncService.hasPendingChanges();
const count = await syncService.getPendingChangesCount();
```

## Performance

### Storage Limits

- **IndexedDB**: Up to 50% of available disk space
- **Typical usage**:
  - 1000 flashcards ≈ 1-2 MB
  - 100 modules ≈ 50 KB
  - Sync queue ≈ 10-20 KB

### Cache Strategy

- **Static assets**: Cached indefinitely (JS, CSS, images)
- **HTML pages**: Cache-first with network fallback
- **API calls**: Network-only, no caching

## Troubleshooting

### "Sync failed" error

1. Check internet connection
2. Clear browser cache
3. Logout and login again
4. Check browser console for errors

### Data not syncing

1. Wait for automatic sync (triggered on reconnect)
2. Click "Sync now" manually
3. Check if there are any failed items in sync queue
4. Verify you're logged in

### Storage full

1. Delete old flashcards you don't need
2. Clear browser storage:
   - Settings → Privacy → Clear browsing data
   - Select "IndexedDB"

## Browser Support

| Browser | Offline Mode | IndexedDB | Service Worker |
|---------|--------------|-----------|----------------|
| Chrome 90+ | ✅ | ✅ | ✅ |
| Firefox 88+ | ✅ | ✅ | ✅ |
| Safari 14+ | ✅ | ✅ | ✅ |
| Edge 90+ | ✅ | ✅ | ✅ |
| Opera 76+ | ✅ | ✅ | ✅ |

## Future Improvements

- [ ] Conflict resolution UI
- [ ] Export offline data
- [ ] Sync statistics
- [ ] Offline analytics
- [ ] Background sync API (when available)
- [ ] Selective sync (choose what to download)

## Security

- All data stored in IndexedDB is local to the browser
- No sensitive data (passwords) stored offline
- User must be authenticated to sync
- Sync uses HTTPS only

## Credits

Built with:
- IndexedDB for local storage
- Service Workers for caching
- Background Sync API (future)
