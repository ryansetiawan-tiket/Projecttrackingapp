/**
 * useStatusGroupOrder Hook
 * 
 * Manages custom ordering for status groups in Table view.
 * Provides separate orderings for Active and Archive projects.
 */

import { useState, useEffect, useCallback } from 'react';
import { useStatuses } from './useStatuses';
import { useAuth } from '../contexts/AuthContext';
import * as groupOrderUtils from '../utils/groupOrderUtils';

interface UseStatusGroupOrderReturn {
  activeOrder: string[];
  archiveOrder: string[];
  isLoading: boolean;
  error: Error | null;
  updateActiveOrder: (newOrder: string[]) => Promise<void>;
  updateArchiveOrder: (newOrder: string[]) => Promise<void>;
  resetActiveOrder: () => Promise<void>;
  resetArchiveOrder: () => Promise<void>;
}

export function useStatusGroupOrder(): UseStatusGroupOrderReturn {
  const { statuses, loading: statusesLoading } = useStatuses();
  const { accessToken } = useAuth();
  
  const [activeOrder, setActiveOrder] = useState<string[]>([]);
  const [archiveOrder, setArchiveOrder] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // Load initial orders from database or localStorage (for public users)
  useEffect(() => {
    const loadOrders = async () => {
      if (statusesLoading) return; // Wait for statuses to load
      
      try {
        setIsLoading(true);
        setError(null);
        
        let active: string[];
        let archive: string[];
        
        if (!accessToken) {
          // Public user - load from localStorage
          const savedActive = localStorage.getItem('public-status-order-active');
          const savedArchive = localStorage.getItem('public-status-order-archive');
          
          active = savedActive ? JSON.parse(savedActive) : groupOrderUtils.DEFAULT_ACTIVE_STATUS_ORDER;
          archive = savedArchive ? JSON.parse(savedArchive) : groupOrderUtils.DEFAULT_ARCHIVE_STATUS_ORDER;
        } else {
          // Authenticated user - load from database
          [active, archive] = await Promise.all([
            groupOrderUtils.loadStatusGroupOrder('active'),
            groupOrderUtils.loadStatusGroupOrder('archive')
          ]);
        }
        
        setActiveOrder(active);
        setArchiveOrder(archive);
        setInitialLoadComplete(true);
      } catch (err) {
        console.error('Error loading status group orders:', err);
        setError(err as Error);
        
        // Fallback to defaults on error
        setActiveOrder(groupOrderUtils.DEFAULT_ACTIVE_STATUS_ORDER);
        setArchiveOrder(groupOrderUtils.DEFAULT_ARCHIVE_STATUS_ORDER);
        setInitialLoadComplete(true);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadOrders();
  }, [statusesLoading, accessToken]);

  // Auto-sync when available statuses change
  useEffect(() => {
    if (!initialLoadComplete || statusesLoading || statuses.length === 0) return;
    
    const statusNames = statuses.map(s => s.name);
    
    // Sync active order
    const syncedActive = groupOrderUtils.syncStatusOrder(
      activeOrder,
      statusNames,
      false // isArchive = false
    );
    
    // Sync archive order
    const syncedArchive = groupOrderUtils.syncStatusOrder(
      archiveOrder,
      statusNames,
      true // isArchive = true
    );
    
    // Check if sync resulted in changes
    const activeChanged = JSON.stringify(syncedActive) !== JSON.stringify(activeOrder);
    const archiveChanged = JSON.stringify(syncedArchive) !== JSON.stringify(archiveOrder);
    
    // Update state and save if changed
    if (activeChanged) {
      console.log('[useStatusGroupOrder] Active order synced:', syncedActive);
      setActiveOrder(syncedActive);
      
      if (!accessToken) {
        // Public user - save to localStorage
        localStorage.setItem('public-status-order-active', JSON.stringify(syncedActive));
      } else {
        // Authenticated user - save to database
        groupOrderUtils.saveStatusGroupOrder('active', syncedActive).catch(err => {
          console.error('Error auto-saving active order:', err);
        });
      }
    }
    
    if (archiveChanged) {
      console.log('[useStatusGroupOrder] Archive order synced:', syncedArchive);
      setArchiveOrder(syncedArchive);
      
      if (!accessToken) {
        // Public user - save to localStorage
        localStorage.setItem('public-status-order-archive', JSON.stringify(syncedArchive));
      } else {
        // Authenticated user - save to database
        groupOrderUtils.saveStatusGroupOrder('archive', syncedArchive).catch(err => {
          console.error('Error auto-saving archive order:', err);
        });
      }
    }
  }, [statuses, initialLoadComplete, statusesLoading, accessToken]);

  // Update active order
  const updateActiveOrder = useCallback(async (newOrder: string[]) => {
    try {
      setActiveOrder(newOrder);
      
      if (!accessToken) {
        // Public user - save to localStorage
        localStorage.setItem('public-status-order-active', JSON.stringify(newOrder));
      } else {
        // Authenticated user - save to database
        await groupOrderUtils.saveStatusGroupOrder('active', newOrder);
      }
      
      console.log('[useStatusGroupOrder] Active order updated:', newOrder);
    } catch (err) {
      console.error('Error updating active order:', err);
      setError(err as Error);
      throw err;
    }
  }, [accessToken]);

  // Update archive order
  const updateArchiveOrder = useCallback(async (newOrder: string[]) => {
    try {
      setArchiveOrder(newOrder);
      
      if (!accessToken) {
        // Public user - save to localStorage
        localStorage.setItem('public-status-order-archive', JSON.stringify(newOrder));
      } else {
        // Authenticated user - save to database
        await groupOrderUtils.saveStatusGroupOrder('archive', newOrder);
      }
      
      console.log('[useStatusGroupOrder] Archive order updated:', newOrder);
    } catch (err) {
      console.error('Error updating archive order:', err);
      setError(err as Error);
      throw err;
    }
  }, [accessToken]);

  // Reset active order to default
  const resetActiveOrder = useCallback(async () => {
    try {
      const defaultOrder = groupOrderUtils.DEFAULT_ACTIVE_STATUS_ORDER;
      setActiveOrder(defaultOrder);
      
      if (!accessToken) {
        // Public user - save to localStorage
        localStorage.setItem('public-status-order-active', JSON.stringify(defaultOrder));
      } else {
        // Authenticated user - save to database
        await groupOrderUtils.saveStatusGroupOrder('active', defaultOrder);
      }
      
      console.log('[useStatusGroupOrder] Active order reset to default');
    } catch (err) {
      console.error('Error resetting active order:', err);
      setError(err as Error);
      throw err;
    }
  }, [accessToken]);

  // Reset archive order to default
  const resetArchiveOrder = useCallback(async () => {
    try {
      const defaultOrder = groupOrderUtils.DEFAULT_ARCHIVE_STATUS_ORDER;
      setArchiveOrder(defaultOrder);
      
      if (!accessToken) {
        // Public user - save to localStorage
        localStorage.setItem('public-status-order-archive', JSON.stringify(defaultOrder));
      } else {
        // Authenticated user - save to database
        await groupOrderUtils.saveStatusGroupOrder('archive', defaultOrder);
      }
      
      console.log('[useStatusGroupOrder] Archive order reset to default');
    } catch (err) {
      console.error('Error resetting archive order:', err);
      setError(err as Error);
      throw err;
    }
  }, [accessToken]);

  return {
    activeOrder,
    archiveOrder,
    isLoading,
    error,
    updateActiveOrder,
    updateArchiveOrder,
    resetActiveOrder,
    resetArchiveOrder
  };
}
