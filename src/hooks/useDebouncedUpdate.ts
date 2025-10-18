import { useRef, useCallback, useEffect } from 'react';

/**
 * Hook for debouncing updates to prevent excessive calls
 * Perfect for auto-save scenarios where UI should update immediately
 * but database sync can wait a bit
 */
export function useDebouncedUpdate<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 500
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set new timeout
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay]
  ) as T;

  return debouncedCallback;
}

/**
 * Hook for immediate UI update + debounced database sync
 * Returns two functions: one for immediate local update, one for eventual sync
 */
export function useOptimisticUpdate<TLocal, TSync>(
  onLocalUpdate: (data: TLocal) => void,
  onSyncUpdate: (data: TSync) => Promise<void> | void,
  delay: number = 500
) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const syncCallbackRef = useRef(onSyncUpdate);

  useEffect(() => {
    syncCallbackRef.current = onSyncUpdate;
  }, [onSyncUpdate]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const optimisticUpdate = useCallback(
    (localData: TLocal, syncData: TSync) => {
      // 1. Update UI immediately (no delay)
      onLocalUpdate(localData);

      // 2. Schedule database sync (debounced)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        console.log('[OptimisticUpdate] Syncing to database...');
        syncCallbackRef.current(syncData);
      }, delay);
    },
    [onLocalUpdate, delay]
  );

  // Force immediate sync (useful for critical updates)
  const forceSync = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  return { optimisticUpdate, forceSync };
}
