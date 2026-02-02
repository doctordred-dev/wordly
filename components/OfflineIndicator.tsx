'use client';

import { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { isOnline, onlineStatusListener } from '@/lib/offlineStorage';
import { syncService, type SyncStatus } from '@/lib/syncService';

export default function OfflineIndicator() {
  const [online, setOnline] = useState(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({ syncing: false });
  const [pendingCount, setPendingCount] = useState(0);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Set initial online status
    setOnline(isOnline());

    // Listen for online/offline changes
    const cleanup = onlineStatusListener((status) => {
      setOnline(status);
      if (status) {
        // When back online, check for pending changes
        checkPendingChanges();
      }
    });

    // Listen for sync status changes
    const cleanupSync = syncService.onSyncStatusChange((status) => {
      setSyncStatus(status);
    });

    // Check pending changes on mount
    checkPendingChanges();

    return () => {
      cleanup();
      cleanupSync();
    };
  }, []);

  const checkPendingChanges = async () => {
    try {
      const count = await syncService.getPendingChangesCount();
      setPendingCount(count);
    } catch (error) {
      console.error('Error checking pending changes:', error);
    }
  };

  const handleSync = async () => {
    const userId = localStorage.getItem('wordly_user_id');
    if (!userId) {
      console.error('No user ID found');
      return;
    }

    await syncService.sync(userId);
    await checkPendingChanges();
  };

  // Don't show if online and no pending changes
  if (online && pendingCount === 0 && !syncStatus.syncing) {
    return null;
  }

  return (
    <>
      {/* Main indicator */}
      <div
        className="fixed top-4 right-4 z-50 cursor-pointer"
        onClick={() => setShowDetails(!showDetails)}
      >
        <div
          className={`flex items-center gap-2 px-4 py-2 rounded-full shadow-lg transition-all ${
            online
              ? pendingCount > 0
                ? 'bg-yellow-500/20 border border-yellow-500/50 text-yellow-400'
                : 'bg-green-500/20 border border-green-500/50 text-green-400'
              : 'bg-red-500/20 border border-red-500/50 text-red-400'
          }`}
          style={{ backdropFilter: 'blur(10px)' }}
        >
          {syncStatus.syncing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span className="text-sm font-medium">Синхронізація...</span>
            </>
          ) : online ? (
            pendingCount > 0 ? (
              <>
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-medium">{pendingCount} змін для синхронізації</span>
              </>
            ) : (
              <>
                <Wifi className="w-4 h-4" />
                <span className="text-sm font-medium">Онлайн</span>
              </>
            )
          ) : (
            <>
              <WifiOff className="w-4 h-4" />
              <span className="text-sm font-medium">Офлайн режим</span>
            </>
          )}
        </div>
      </div>

      {/* Details panel */}
      {showDetails && (
        <div
          className="fixed top-16 right-4 z-50 w-80 rounded-2xl shadow-2xl border border-cyan-400/30 overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(94, 179, 246, 0.15) 0%, rgba(139, 127, 246, 0.15) 100%)',
            backdropFilter: 'blur(20px)',
          }}
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-white/10">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              {online ? (
                <>
                  <Wifi className="w-5 h-5 text-green-400" />
                  Онлайн
                </>
              ) : (
                <>
                  <WifiOff className="w-5 h-5 text-red-400" />
                  Офлайн режим
                </>
              )}
            </h3>
          </div>

          {/* Content */}
          <div className="p-4 space-y-3">
            {syncStatus.syncing && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/80">{syncStatus.message || 'Синхронізація...'}</span>
                  <span className="text-cyan-400 font-medium">{syncStatus.progress || 0}%</span>
                </div>
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-400 transition-all duration-300"
                    style={{ width: `${syncStatus.progress || 0}%` }}
                  />
                </div>
              </div>
            )}

            {!syncStatus.syncing && (
              <>
                {online ? (
                  <div className="space-y-3">
                    {pendingCount > 0 ? (
                      <>
                        <p className="text-sm text-white/70">
                          У вас є <span className="text-yellow-400 font-medium">{pendingCount}</span> несинхронізованих змін
                        </p>
                        <button
                          onClick={handleSync}
                          className="w-full px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 rounded-lg text-cyan-400 font-medium transition-all flex items-center justify-center gap-2"
                        >
                          <RefreshCw className="w-4 h-4" />
                          Синхронізувати зараз
                        </button>
                      </>
                    ) : (
                      <div className="flex items-center gap-2 text-green-400">
                        <CheckCircle className="w-5 h-5" />
                        <span className="text-sm font-medium">Всі зміни синхронізовані</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-white/70">
                      Ви працюєте в офлайн режимі. Всі зміни будуть збережені локально та синхронізовані, коли з'явиться інтернет.
                    </p>
                    {pendingCount > 0 && (
                      <div className="flex items-center gap-2 text-yellow-400 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        <span>{pendingCount} змін очікують синхронізації</span>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-white/10 flex justify-between items-center text-xs text-white/50">
            <span>Автоматична синхронізація увімкнена</span>
            <button
              onClick={() => setShowDetails(false)}
              className="text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              Закрити
            </button>
          </div>
        </div>
      )}
    </>
  );
}
