export interface HistoryItem {
  id: string;
  type: 'gif' | 'pdf' | 'image' | 'audio' | 'data' | 'whisper';
  title: string;
  subtitle: string;
  timestamp: number;
}

const STORAGE_KEYS = {
  OPENAI_API_KEY: 'omni_openai_api_key',
  HISTORY: 'omni_conversion_history',
};

export function getStoredApiKey(): string {
  return localStorage.getItem(STORAGE_KEYS.OPENAI_API_KEY) || '';
}

export function setStoredApiKey(key: string): void {
  if (key.trim()) {
    localStorage.setItem(STORAGE_KEYS.OPENAI_API_KEY, key.trim());
  } else {
    localStorage.removeItem(STORAGE_KEYS.OPENAI_API_KEY);
  }
}

export function getConversionHistory(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.HISTORY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addHistoryItem(item: Omit<HistoryItem, 'id' | 'timestamp'>): void {
  try {
    const history = getConversionHistory();
    const newItem: HistoryItem = {
      ...item,
      id: Math.random().toString(36).substring(2, 9),
      timestamp: Date.now(),
    };
    const updated = [newItem, ...history].slice(0, 30); // Keep last 30 items
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updated));
  } catch {
    // Ignore storage quota limits
  }
}

export function clearHistory(): void {
  localStorage.removeItem(STORAGE_KEYS.HISTORY);
}

/**
 * Mobile Haptic feedback utility
 */
export function triggerHaptic(type: 'light' | 'medium' | 'success' = 'light'): void {
  if ('vibrate' in navigator) {
    if (type === 'light') navigator.vibrate(8);
    else if (type === 'medium') navigator.vibrate(15);
    else if (type === 'success') navigator.vibrate([10, 30, 15]);
  }
}
