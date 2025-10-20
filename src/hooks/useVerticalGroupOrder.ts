/**
 * useVerticalGroupOrder Hook
 * 
 * Manages custom ordering for vertical groups in Table view.
 * Defaults to alphabetical order (A-Z).
 */

import { useState, useEffect, useCallback } from 'react';
import { useVerticals } from './useVerticals';
import { useAuth } from '../contexts/AuthContext';
import * as groupOrderUtils from '../utils/groupOrderUtils';

interface UseVerticalGroupOrderReturn {
  verticalOrder: string[];
  isLoading: boolean;
  error: Error | null;
  updateVerticalOrder: (newOrder: string[]) => Promise<void>;
  resetVerticalOrder: () => Promise<void>;
}

export function useVerticalGroupOrder(): UseVerticalGroupOrderReturn {
  const { verticals, loading: verticalsLoading } = useVerticals();
  const { accessToken } = useAuth();
  
  const [verticalOrder, setVerticalOrder] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // Load initial order from database or localStorage (for public users)
  useEffect(() => {
    const loadOrder = async () => {
      if (verticalsLoading) return; // Wait for verticals to load
      
      try {
        setIsLoading(true);
        setError(null);
        
        const verticalNames = verticals.map(v => v.name);
        let order: string[];
        
        if (!accessToken) {
          // Public user - load from localStorage
          const saved = localStorage.getItem('public-vertical-order');
          
          if (saved) {
            order = JSON.parse(saved);
          } else {
            order = [...verticalNames].sort((a, b) => a.localeCompare(b));
          }
        } else {
          // Authenticated user - load from database
          order = await groupOrderUtils.loadVerticalGroupOrder(verticalNames);
        }
        
        setVerticalOrder(order);
        setInitialLoadComplete(true);
      } catch (err) {
        console.error('Error loading vertical group order:', err);
        setError(err as Error);
        
        // Fallback to alphabetical on error
        const verticalNames = verticals.map(v => v.name);
        const alphabetical = [...verticalNames].sort((a, b) => a.localeCompare(b));
        setVerticalOrder(alphabetical);
        setInitialLoadComplete(true);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadOrder();
  }, [verticalsLoading, verticals, accessToken]);

  // Auto-sync when available verticals change
  useEffect(() => {
    if (!initialLoadComplete || verticalsLoading || verticals.length === 0) return;
    
    const verticalNames = verticals.map(v => v.name);
    
    // Sync vertical order
    const synced = groupOrderUtils.syncVerticalOrder(
      verticalOrder,
      verticalNames
    );
    
    // Check if sync resulted in changes
    const changed = JSON.stringify(synced) !== JSON.stringify(verticalOrder);
    
    // Update state and save if changed
    if (changed) {
      console.log('[useVerticalGroupOrder] Vertical order synced:', synced);
      setVerticalOrder(synced);
      
      if (!accessToken) {
        // Public user - save to localStorage
        localStorage.setItem('public-vertical-order', JSON.stringify(synced));
      } else {
        // Authenticated user - save to database
        groupOrderUtils.saveVerticalGroupOrder(synced).catch(err => {
          console.error('Error auto-saving vertical order:', err);
        });
      }
    }
  }, [verticals, initialLoadComplete, verticalsLoading, accessToken]);

  // Update vertical order
  const updateVerticalOrder = useCallback(async (newOrder: string[]) => {
    try {
      setVerticalOrder(newOrder);
      
      if (!accessToken) {
        // Public user - save to localStorage
        localStorage.setItem('public-vertical-order', JSON.stringify(newOrder));
      } else {
        // Authenticated user - save to database
        await groupOrderUtils.saveVerticalGroupOrder(newOrder);
      }
      
      console.log('[useVerticalGroupOrder] Vertical order updated:', newOrder);
    } catch (err) {
      console.error('Error updating vertical order:', err);
      setError(err as Error);
      throw err;
    }
  }, [accessToken]);

  // Reset to alphabetical order
  const resetVerticalOrder = useCallback(async () => {
    try {
      const verticalNames = verticals.map(v => v.name);
      const alphabetical = [...verticalNames].sort((a, b) => a.localeCompare(b));
      
      setVerticalOrder(alphabetical);
      
      if (!accessToken) {
        // Public user - save to localStorage
        localStorage.setItem('public-vertical-order', JSON.stringify(alphabetical));
      } else {
        // Authenticated user - save to database
        await groupOrderUtils.saveVerticalGroupOrder(alphabetical);
      }
      
      console.log('[useVerticalGroupOrder] Vertical order reset to alphabetical');
    } catch (err) {
      console.error('Error resetting vertical order:', err);
      setError(err as Error);
      throw err;
    }
  }, [verticals, accessToken]);

  return {
    verticalOrder,
    isLoading,
    error,
    updateVerticalOrder,
    resetVerticalOrder
  };
}
