/**
 * useColumnOrder Hook (v2.4.0)
 * Manages table column ordering with persistence
 */

import { useState, useEffect, useCallback } from 'react';
import { TableColumn, TableColumnId, DEFAULT_TABLE_COLUMNS } from '../types/project';
import { 
  reorderColumns, 
  getColumnOrderIds, 
  applyColumnOrder,
  isDefaultOrder,
  toggleColumnVisibility,
  getColumnVisibility
} from '../utils/columnOrderUtils';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from '../utils/toast';

export function useColumnOrder(accessToken: string | undefined) {
  const [columns, setColumns] = useState<TableColumn[]>(DEFAULT_TABLE_COLUMNS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load column order from database or localStorage (for public users)
  useEffect(() => {
    if (!accessToken) {
      // Public user - load from localStorage
      try {
        const savedOrder = localStorage.getItem('public-column-order');
        const savedVisibility = localStorage.getItem('public-column-visibility');
        
        if (savedOrder) {
          const columnOrder = JSON.parse(savedOrder) as TableColumnId[];
          const columnVisibility = savedVisibility ? JSON.parse(savedVisibility) : undefined;
          setColumns(applyColumnOrder(columnOrder, columnVisibility));
        } else {
          setColumns(DEFAULT_TABLE_COLUMNS);
        }
      } catch (error) {
        console.error('Error loading column order from localStorage:', error);
        setColumns(DEFAULT_TABLE_COLUMNS);
      }
      setIsLoading(false);
      return;
    }

    const loadColumnOrder = async () => {
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-691c6bba/table-column-order`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          }
        );

        if (!response.ok) {
          console.error('Failed to load column order:', response.statusText);
          setColumns(DEFAULT_TABLE_COLUMNS);
          setIsLoading(false);
          return;
        }

        const data = await response.json();
        
        if (data.columnOrder) {
          setColumns(applyColumnOrder(data.columnOrder, data.columnVisibility));
        } else {
          setColumns(DEFAULT_TABLE_COLUMNS);
        }
      } catch (error) {
        console.error('Error loading column order:', error);
        setColumns(DEFAULT_TABLE_COLUMNS);
      } finally {
        setIsLoading(false);
      }
    };

    loadColumnOrder();
  }, [accessToken]);

  // Save column order and visibility to database or localStorage (for public users)
  const saveColumnOrder = useCallback(async (newOrder: TableColumnId[], newVisibility?: Record<TableColumnId, boolean>) => {
    if (!accessToken) {
      // Public user - save to localStorage
      try {
        localStorage.setItem('public-column-order', JSON.stringify(newOrder));
        if (newVisibility) {
          localStorage.setItem('public-column-visibility', JSON.stringify(newVisibility));
        }
      } catch (error) {
        console.error('Error saving column order to localStorage:', error);
      }
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-691c6bba/table-column-order`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            columnOrder: newOrder,
            columnVisibility: newVisibility 
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to save column order');
      }
    } catch (error) {
      console.error('Error saving column order:', error);
      toast.error('Failed to save column order');
    } finally {
      setIsSaving(false);
    }
  }, [accessToken]);

  // Reorder columns (with optimistic update)
  const handleReorder = useCallback((fromIndex: number, toIndex: number) => {
    const newColumns = reorderColumns(columns, fromIndex, toIndex);
    
    // Only update if order actually changed
    if (JSON.stringify(newColumns) === JSON.stringify(columns)) {
      return;
    }
    
    setColumns(newColumns);
    
    const newOrder = getColumnOrderIds(newColumns);
    saveColumnOrder(newOrder);
  }, [columns, saveColumnOrder]);

  // Reset to default order
  const resetToDefault = useCallback(async () => {
    if (!accessToken) return;

    setColumns(DEFAULT_TABLE_COLUMNS);
    
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-691c6bba/table-column-order`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to reset column order');
      }
      
      toast.success('Column order reset to default');
    } catch (error) {
      console.error('Error resetting column order:', error);
      toast.error('Failed to reset column order');
    }
  }, [accessToken]);

  // Toggle column visibility (with optimistic update)
  const handleToggleVisibility = useCallback((columnId: TableColumnId) => {
    const newColumns = toggleColumnVisibility(columns, columnId);
    
    // Only update if visibility actually changed
    if (JSON.stringify(newColumns) === JSON.stringify(columns)) {
      // Show toast if trying to hide locked column or last visible column
      const column = columns.find(col => col.id === columnId);
      if (column?.locked) {
        toast.error('Cannot hide the Project column');
      } else {
        toast.error('At least one column must be visible');
      }
      return;
    }
    
    setColumns(newColumns);
    
    const newOrder = getColumnOrderIds(newColumns);
    const newVisibility = getColumnVisibility(newColumns);
    saveColumnOrder(newOrder, newVisibility);
  }, [columns, saveColumnOrder]);

  const hasCustomOrder = !isDefaultOrder(getColumnOrderIds(columns));

  return {
    columns,
    reorderColumn: handleReorder,
    toggleVisibility: handleToggleVisibility,
    resetToDefault,
    isLoading,
    isSaving,
    hasCustomOrder,
  };
}
