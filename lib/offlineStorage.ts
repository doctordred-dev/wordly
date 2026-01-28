// Offline storage using localStorage for flashcards and modules
// This provides offline access to user data when network is unavailable

const STORAGE_KEYS = {
  FLASHCARDS: 'wordly_flashcards',
  MODULES: 'wordly_modules',
  LAST_SYNC: 'wordly_last_sync',
  USER_ID: 'wordly_user_id',
};

interface Flashcard {
  id: string;
  word: string;
  translation: string;
  source_lang: string;
  target_lang: string;
  user_id: string | null;
  module_id: string | null;
}

interface Module {
  id: string;
  name: string;
  description: string | null;
  color: string;
  user_id: string;
  flashcard_count?: number;
}

// Check if we're in browser environment
const isBrowser = typeof window !== 'undefined';

// Save flashcards to local storage
export function saveFlashcardsOffline(flashcards: Flashcard[], userId: string) {
  if (!isBrowser) return;
  try {
    localStorage.setItem(STORAGE_KEYS.FLASHCARDS, JSON.stringify(flashcards));
    localStorage.setItem(STORAGE_KEYS.USER_ID, userId);
    localStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
  } catch (error) {
    console.error('Failed to save flashcards offline:', error);
  }
}

// Get flashcards from local storage
export function getFlashcardsOffline(): Flashcard[] {
  if (!isBrowser) return [];
  try {
    const data = localStorage.getItem(STORAGE_KEYS.FLASHCARDS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to get offline flashcards:', error);
    return [];
  }
}

// Save modules to local storage
export function saveModulesOffline(modules: Module[], userId: string) {
  if (!isBrowser) return;
  try {
    localStorage.setItem(STORAGE_KEYS.MODULES, JSON.stringify(modules));
    localStorage.setItem(STORAGE_KEYS.USER_ID, userId);
  } catch (error) {
    console.error('Failed to save modules offline:', error);
  }
}

// Get modules from local storage
export function getModulesOffline(): Module[] {
  if (!isBrowser) return [];
  try {
    const data = localStorage.getItem(STORAGE_KEYS.MODULES);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to get offline modules:', error);
    return [];
  }
}

// Check if we're online
export function isOnline(): boolean {
  if (!isBrowser) return true;
  return navigator.onLine;
}

// Get last sync time
export function getLastSyncTime(): string | null {
  if (!isBrowser) return null;
  return localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
}

// Clear offline data
export function clearOfflineData() {
  if (!isBrowser) return;
  localStorage.removeItem(STORAGE_KEYS.FLASHCARDS);
  localStorage.removeItem(STORAGE_KEYS.MODULES);
  localStorage.removeItem(STORAGE_KEYS.LAST_SYNC);
}

// Check if offline data exists
export function hasOfflineData(): boolean {
  if (!isBrowser) return false;
  return !!(localStorage.getItem(STORAGE_KEYS.FLASHCARDS) || localStorage.getItem(STORAGE_KEYS.MODULES));
}
