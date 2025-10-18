import { useState, useEffect, useCallback } from 'react';
import { Status, DEFAULT_STATUSES } from '../types/status';
import { projectId, publicAnonKey } from '../utils/supabase/info';

const KV_KEY = 'statuses';

export function useStatuses() {
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch statuses from server
  const fetchStatuses = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-691c6bba/kv/${KV_KEY}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data)) {
          // Migration: Add is_manual field to existing statuses if missing
          const migratedData = data.map(status => {
            if (status.is_manual === undefined) {
              // Default migration rules based on common manual statuses
              const isManualByDefault = ['done', 'canceled', 'on hold', 'review', 'on review', 'in review', 'babysit', 'lightroom', 'on list lightroom', 'in queue lightroom'].includes(
                status.name.toLowerCase()
              );
              console.log(`[Migration] Adding is_manual=${isManualByDefault} to status: ${status.name}`);
              return { ...status, is_manual: isManualByDefault };
            }
            return status;
          });
          
          // Save migrated data if any changes were made
          const needsMigration = migratedData.some((s, i) => s.is_manual !== data[i].is_manual);
          if (needsMigration) {
            console.log('[Migration] Saving migrated status data...');
            await saveStatuses(migratedData);
          }
          
          console.log('[StatusContext] Loaded statuses:', migratedData);
          setStatuses(migratedData);
        } else {
          // Initialize with defaults if no data exists
          console.log('[StatusContext] No data, initializing with defaults');
          setStatuses(DEFAULT_STATUSES);
          await saveStatuses(DEFAULT_STATUSES);
        }
      } else {
        // Initialize with defaults on error
        console.log('[StatusContext] Error response, initializing with defaults');
        setStatuses(DEFAULT_STATUSES);
        await saveStatuses(DEFAULT_STATUSES);
      }
    } catch (error) {
      console.error('Error fetching statuses:', error);
      setStatuses(DEFAULT_STATUSES);
    } finally {
      setLoading(false);
    }
  }, []);

  // Save statuses to server
  const saveStatuses = async (statusesToSave: Status[]) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-691c6bba/kv/${KV_KEY}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(statusesToSave),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to save statuses');
      }
    } catch (error) {
      console.error('Error saving statuses:', error);
      throw error;
    }
  };

  // Update a status
  const updateStatus = useCallback(async (id: string, updates: Partial<Status>) => {
    try {
      const updatedStatuses = statuses.map(status =>
        status.id === id ? { ...status, ...updates } : status
      );
      await saveStatuses(updatedStatuses);
      setStatuses(updatedStatuses);
    } catch (error) {
      console.error('Error updating status:', error);
      throw error;
    }
  }, [statuses]);

  // Create a new status
  const createStatus = useCallback(async (statusData: Omit<Status, 'id' | 'order'>) => {
    try {
      const newStatus: Status = {
        ...statusData,
        id: `status-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        order: statuses.length,
      };
      const updatedStatuses = [...statuses, newStatus];
      await saveStatuses(updatedStatuses);
      setStatuses(updatedStatuses);
      return newStatus;
    } catch (error) {
      console.error('Error creating status:', error);
      throw error;
    }
  }, [statuses]);

  // Delete a status
  const deleteStatus = useCallback(async (id: string) => {
    try {
      const updatedStatuses = statuses.filter(status => status.id !== id);
      await saveStatuses(updatedStatuses);
      setStatuses(updatedStatuses);
    } catch (error) {
      console.error('Error deleting status:', error);
      throw error;
    }
  }, [statuses]);

  // Reorder statuses
  const reorderStatuses = useCallback(async (reorderedStatuses: Status[]) => {
    try {
      const statusesWithOrder = reorderedStatuses.map((status, index) => ({
        ...status,
        order: index,
      }));
      await saveStatuses(statusesWithOrder);
      setStatuses(statusesWithOrder);
    } catch (error) {
      console.error('Error reordering statuses:', error);
      throw error;
    }
  }, []);

  useEffect(() => {
    fetchStatuses();
  }, [fetchStatuses]);

  return {
    statuses,
    loading,
    updateStatus,
    createStatus,
    deleteStatus,
    reorderStatuses,
    refetch: fetchStatuses,
  };
}
