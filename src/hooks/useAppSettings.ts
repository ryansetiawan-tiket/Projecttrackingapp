import { useState, useEffect, useCallback } from 'react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface AppSettings {
  title: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  title: "Ryan Setiawan's Tracker"
};

const STORAGE_KEY = 'app_settings';
const SETTINGS_UPDATED_EVENT = 'app-settings-updated';

export function useAppSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch settings from database
  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-691c6bba/kv/${STORAGE_KEY}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch app settings: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Server returns null if key doesn't exist, or the parsed value directly
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        setSettings({ ...DEFAULT_SETTINGS, ...data });
      } else if (data === null) {
        // No settings in database yet, use defaults
        console.log('[useAppSettings] No settings found in database, using defaults');
        setSettings(DEFAULT_SETTINGS);
      } else {
        // Unexpected format, use defaults
        console.warn('[useAppSettings] Unexpected data format, using defaults');
        setSettings(DEFAULT_SETTINGS);
      }
    } catch (err) {
      console.error('[useAppSettings] Error fetching settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to load app settings');
      // Use defaults on error
      setSettings(DEFAULT_SETTINGS);
    } finally {
      setLoading(false);
    }
  }, []);

  // Save settings to database
  const updateSettings = useCallback(async (newSettings: Partial<AppSettings>) => {
    try {
      const updatedSettings = { ...settings, ...newSettings };
      
      // Server expects the body to be the entire value (will be stringified internally)
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-691c6bba/kv/${STORAGE_KEY}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatedSettings),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to save app settings: ${response.statusText} - ${errorText}`);
      }

      setSettings(updatedSettings);
      
      // 🎯 Notify all other instances to refresh
      window.dispatchEvent(new CustomEvent(SETTINGS_UPDATED_EVENT));
      
      console.log('[useAppSettings] Settings saved successfully:', updatedSettings);
      
      return updatedSettings;
    } catch (err) {
      console.error('[useAppSettings] Error saving settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to save app settings');
      throw err;
    }
  }, [settings]);

  // Update app title
  const updateTitle = useCallback(async (title: string) => {
    return updateSettings({ title });
  }, [updateSettings]);

  // Load settings on mount
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);
  
  // Listen for settings updates from other instances
  useEffect(() => {
    const handleSettingsUpdate = () => {
      console.log('[useAppSettings] Settings updated in another component, refreshing...');
      fetchSettings();
    };
    
    window.addEventListener(SETTINGS_UPDATED_EVENT, handleSettingsUpdate);
    
    return () => {
      window.removeEventListener(SETTINGS_UPDATED_EVENT, handleSettingsUpdate);
    };
  }, [fetchSettings]);

  return {
    settings,
    loading,
    error,
    updateSettings,
    updateTitle,
    refreshSettings: fetchSettings,
  };
}
