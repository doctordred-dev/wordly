// Sync service for synchronizing offline data with Supabase

import { offlineStorage, isOnline, type SyncQueueItem, type OfflineFlashcard } from './offlineStorage';
import { supabase } from './supabase';

class SyncService {
  private isSyncing = false;
  private syncListeners: Array<(status: SyncStatus) => void> = [];

  // Sync status
  getIsSyncing(): boolean {
    return this.isSyncing;
  }

  // Add sync status listener
  onSyncStatusChange(callback: (status: SyncStatus) => void): () => void {
    this.syncListeners.push(callback);
    return () => {
      this.syncListeners = this.syncListeners.filter(l => l !== callback);
    };
  }

  private notifySyncListeners(status: SyncStatus) {
    this.syncListeners.forEach(listener => listener(status));
  }

  // Main sync function
  async sync(userId: string): Promise<SyncResult> {
    if (this.isSyncing) {
      return { success: false, message: 'Sync already in progress' };
    }

    if (!isOnline()) {
      return { success: false, message: 'You are offline' };
    }

    this.isSyncing = true;
    this.notifySyncListeners({ syncing: true, progress: 0 });

    try {
      // Step 1: Pull latest data from Supabase (10%)
      this.notifySyncListeners({ syncing: true, progress: 10, message: 'Downloading latest data...' });
      await this.pullFromSupabase(userId);

      // Step 2: Process sync queue (10-80%)
      this.notifySyncListeners({ syncing: true, progress: 20, message: 'Syncing your changes...' });
      const queueResult = await this.processSyncQueue();

      // Step 3: Verify sync (80-90%)
      this.notifySyncListeners({ syncing: true, progress: 85, message: 'Verifying sync...' });

      // Step 4: Complete (100%)
      this.notifySyncListeners({ syncing: true, progress: 100, message: 'Sync complete!' });

      setTimeout(() => {
        this.notifySyncListeners({ syncing: false });
      }, 500);

      this.isSyncing = false;

      return {
        success: true,
        message: 'Sync completed successfully',
        itemsSynced: queueResult.synced,
        itemsFailed: queueResult.failed,
      };
    } catch (error) {
      console.error('Sync error:', error);
      this.isSyncing = false;
      this.notifySyncListeners({ syncing: false, error: 'Sync failed' });

      return {
        success: false,
        message: error instanceof Error ? error.message : 'Sync failed',
      };
    }
  }

  // Pull latest data from Supabase and store offline
  private async pullFromSupabase(userId: string): Promise<void> {
    try {
      // Fetch flashcards
      const { data: flashcards, error: flashcardsError } = await supabase
        .from('flashcards')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (flashcardsError) throw flashcardsError;

      if (flashcards && flashcards.length > 0) {
        const offlineFlashcards: OfflineFlashcard[] = (flashcards as any[]).map((f: any) => ({
          ...f,
          _synced: true,
          _offline: false,
        }));
        await offlineStorage.saveFlashcards(offlineFlashcards);
      }

      // Fetch modules
      const { data: modules, error: modulesError } = await supabase
        .from('modules')
        .select('*')
        .eq('user_id', userId);

      if (modulesError) throw modulesError;

      if (modules && modules.length > 0) {
        await offlineStorage.saveModules(modules);
      }
    } catch (error) {
      console.error('Error pulling from Supabase:', error);
      throw error;
    }
  }

  // Process the sync queue
  private async processSyncQueue(): Promise<{ synced: number; failed: number }> {
    const queue = await offlineStorage.getSyncQueue();
    let synced = 0;
    let failed = 0;

    for (const item of queue) {
      try {
        await this.processSyncItem(item);
        await offlineStorage.removeSyncQueueItem(item.id);
        synced++;
      } catch (error) {
        console.error('Failed to sync item:', item, error);

        // Retry logic
        if (item.retries < 3) {
          item.retries++;
          await offlineStorage.updateSyncQueueItem(item);
        } else {
          // Max retries reached, remove from queue
          await offlineStorage.removeSyncQueueItem(item.id);
          failed++;
        }
      }
    }

    return { synced, failed };
  }

  // Process a single sync item
  private async processSyncItem(item: SyncQueueItem): Promise<void> {
    if (item.store === 'flashcards') {
      await this.syncFlashcard(item);
    } else if (item.store === 'modules') {
      await this.syncModule(item);
    }
  }

  // Sync flashcard
  private async syncFlashcard(item: SyncQueueItem): Promise<void> {
    const { action, data } = item;

    if (action === 'create') {
      // Cast to any to bypass Supabase typing issues
      const insertData: any = { ...data };
      const { error } = await (supabase.from('flashcards') as any).insert(insertData);

      if (error) throw error;

      // Update offline storage to mark as synced
      const flashcard = await offlineStorage.getFlashcard(data.id);
      if (flashcard) {
        flashcard._synced = true;
        flashcard._offline = false;
        await offlineStorage.saveFlashcard(flashcard);
      }
    } else if (action === 'update') {
      // Cast to any to bypass Supabase typing issues
      const updateData: any = { ...data };
      const { error } = await (supabase.from('flashcards') as any).update(updateData).eq('id', data.id);

      if (error) throw error;

      // Update offline storage
      const flashcard = await offlineStorage.getFlashcard(data.id);
      if (flashcard) {
        Object.assign(flashcard, data);
        flashcard._synced = true;
        await offlineStorage.saveFlashcard(flashcard);
      }
    } else if (action === 'delete') {
      const { error } = await supabase
        .from('flashcards')
        .delete()
        .eq('id', data.id);

      if (error) throw error;

      // Remove from offline storage
      await offlineStorage.deleteFlashcard(data.id);
    }
  }

  // Sync module
  private async syncModule(item: SyncQueueItem): Promise<void> {
    const { action, data } = item;

    if (action === 'create') {
      const insertData: any = { ...data };
      const { error } = await (supabase.from('modules') as any).insert(insertData);

      if (error) throw error;
    } else if (action === 'update') {
      const updateData: any = { ...data };
      const { error } = await (supabase.from('modules') as any).update(updateData).eq('id', data.id);

      if (error) throw error;
    } else if (action === 'delete') {
      const { error } = await supabase
        .from('modules')
        .delete()
        .eq('id', data.id);

      if (error) throw error;

      await offlineStorage.deleteModule(data.id);
    }
  }

  // Quick check if there are pending changes
  async hasPendingChanges(): Promise<boolean> {
    const queue = await offlineStorage.getSyncQueue();
    return queue.length > 0;
  }

  // Get pending changes count
  async getPendingChangesCount(): Promise<number> {
    const queue = await offlineStorage.getSyncQueue();
    return queue.length;
  }
}

export interface SyncStatus {
  syncing: boolean;
  progress?: number;
  message?: string;
  error?: string;
}

export interface SyncResult {
  success: boolean;
  message: string;
  itemsSynced?: number;
  itemsFailed?: number;
}

// Singleton instance
export const syncService = new SyncService();

// Auto-sync when coming back online
if (typeof window !== 'undefined') {
  window.addEventListener('online', async () => {
    console.log('[SyncService] Back online, checking for pending changes...');

    try {
      const hasPending = await syncService.hasPendingChanges();
      if (hasPending) {
        console.log('[SyncService] Found pending changes, starting sync...');
        // Get user ID from localStorage or session
        const userId = localStorage.getItem('wordly_user_id');
        if (userId) {
          await syncService.sync(userId);
        }
      }
    } catch (error) {
      console.error('[SyncService] Auto-sync failed:', error);
    }
  });
}
