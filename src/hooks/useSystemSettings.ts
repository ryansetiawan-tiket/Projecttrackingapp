import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface UseSystemSettingsResult<T> {
  value: T;
  setValue: (newValue: T | ((prev: T) => T)) => Promise<void>;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  canEdit: boolean; // Admin only
}

/**
 * Hook for system-wide settings stored in database
 * - ALL users read from database
 * - Only ADMIN can write
 * - No localStorage (database is single source of truth)
 */
export function useSystemSettings<T>(
  settingKey: string,
  defaultValue: T
): UseSystemSettingsResult<T> {
  const { isAdmin } = useAuth();
  const [value, setValueState] = useState<T>(defaultValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialMount = useRef(true);

  const dbKey = `system:${settingKey}`;

  // Load from database
  const loadValue = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      console.log(`[useSystemSettings] Loading: ${dbKey}`);
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-691c6bba/settings/${settingKey}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to load setting: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.value !== null && data.value !== undefined) {
        console.log(`[useSystemSettings] Loaded from database:`, data.value);
        setValueState(data.value as T);
      } else {
        console.log(`[useSystemSettings] No value in database, using default`);
        setValueState(defaultValue);
      }
    } catch (err) {
      console.error(`[useSystemSettings] Error loading ${settingKey}:`, err);
      setError(err instanceof Error ? err.message : 'Failed to load settings');
      setValueState(defaultValue);
    } finally {
      setLoading(false);
    }
  }, [dbKey, settingKey, defaultValue]);

  // Save to database (Admin only)
  const saveValue = useCallback(async (valueToSave: T) => {
    if (!isAdmin) {
      const errMsg = 'Only administrators can modify system settings';
      console.error(`[useSystemSettings] ${errMsg}`);
      throw new Error(errMsg);
    }

    try {
      console.log(`[useSystemSettings] Saving ${settingKey}:`, valueToSave);
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-691c6bba/settings/${settingKey}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ value: valueToSave })
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to save setting: ${response.statusText}`);
      }

      console.log(`[useSystemSettings] Saved to database: ${settingKey}`);
    } catch (err) {
      console.error(`[useSystemSettings] Failed to save ${settingKey}:`, err);
      setError(err instanceof Error ? err.message : 'Failed to save settings');
      throw err;
    }
  }, [isAdmin, settingKey]);

  // Public setValue with debouncing and optimistic updates
  const setValue = useCallback(async (newValue: T | ((prev: T) => T)) => {
    if (!isAdmin) {
      throw new Error('Only administrators can modify system settings');
    }

    const updatedValue = typeof newValue === 'function' 
      ? (newValue as (prev: T) => T)(value)
      : newValue;
    
    // Optimistic update
    setValueState(updatedValue);

    // Clear previous save timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Debounce save (500ms)
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await saveValue(updatedValue);
      } catch (err) {
        // Revert on error
        console.error('[useSystemSettings] Save failed, reverting...');
        await loadValue();
      }
    }, 500);
  }, [isAdmin, value, saveValue, loadValue]);

  const refresh = useCallback(async () => {
    await loadValue();
  }, [loadValue]);

  // Load on mount only
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      loadValue();
    }
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return { 
    value, 
    setValue, 
    loading, 
    error, 
    refresh,
    canEdit: isAdmin 
  };
}
