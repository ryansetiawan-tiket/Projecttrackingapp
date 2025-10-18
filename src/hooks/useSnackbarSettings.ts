import { useState, useEffect } from 'react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

export interface SnackbarIcon {
  type: 'none' | 'preset' | 'emoji' | 'image';
  value: string; // preset name (info/warning/alert/success), emoji char, or image URL
}

export interface SnackbarSettings {
  enabled: boolean;
  text: string;
  backgroundColor: string;
  textColor: string;
  useAutoContrast: boolean; // NEW: If true, auto-calculate text color for contrast
  startDate: string | null;
  endDate: string | null;
  dismissable: boolean;
  autoHide: boolean;
  autoHideDuration: number; // in seconds
  icon: SnackbarIcon;
  updatedBy?: string;
  updatedAt?: string;
}

const defaultSnackbarSettings: SnackbarSettings = {
  enabled: false,
  text: '',
  backgroundColor: '#3b82f6',
  textColor: '#ffffff',
  useAutoContrast: true, // Default to auto contrast
  startDate: null,
  endDate: null,
  dismissable: true,
  autoHide: false,
  autoHideDuration: 10,
  icon: { type: 'none', value: '' }
};

export function useSnackbarSettings() {
  const [snackbar, setSnackbar] = useState<SnackbarSettings>(defaultSnackbarSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Fetch snackbar settings
  const fetchSnackbar = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-691c6bba/announcement`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        // Silently fail with default settings - don't throw error
        setSnackbar(defaultSnackbarSettings);
        return;
      }

      const data = await response.json();
      setSnackbar(data.snackbar || defaultSnackbarSettings);
    } catch (err) {
      // Silently fail with default settings - only log in development
      if (process.env.NODE_ENV === 'development') {
        console.log('[useSnackbarSettings] Announcement endpoint not available, using defaults');
      }
      setSnackbar(defaultSnackbarSettings);
    } finally {
      setLoading(false);
    }
  };

  // Update snackbar settings (admin only)
  const updateSnackbar = async (settings: Partial<SnackbarSettings>, accessToken: string) => {
    try {
      setSaving(true);
      setError(null);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-691c6bba/announcement`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify(settings),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('[Hook] Update failed with status:', response.status, errorData);
        throw new Error(errorData.error || `Failed to update snackbar (${response.status})`);
      }

      const data = await response.json();
      console.log('[Hook] Update successful, received:', data);
      setSnackbar(data.snackbar);
      return { success: true };
    } catch (err) {
      console.error('[Hook] Error updating snackbar:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update snackbar';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setSaving(false);
    }
  };

  // Check if snackbar should be visible based on date range
  const shouldShowSnackbar = (): boolean => {
    if (!snackbar.enabled || !snackbar.text) {
      return false;
    }

    // Check date range if configured
    if (snackbar.startDate || snackbar.endDate) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      if (snackbar.startDate) {
        const startDate = new Date(snackbar.startDate);
        const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
        if (today < start) {
          return false;
        }
      }

      if (snackbar.endDate) {
        const endDate = new Date(snackbar.endDate);
        const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
        if (today > end) {
          return false;
        }
      }
    }

    return true;
  };

  // Initial fetch
  useEffect(() => {
    fetchSnackbar();

    // Poll for updates every 5 minutes
    const interval = setInterval(fetchSnackbar, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return {
    snackbar,
    loading,
    error,
    saving,
    updateSnackbar,
    refreshSnackbar: fetchSnackbar,
    shouldShowSnackbar
  };
}
