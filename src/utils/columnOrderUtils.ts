/**
 * Column Order Utilities (v2.4.0)
 * Helper functions for managing table column reordering
 */

import { TableColumn, TableColumnId, DEFAULT_TABLE_COLUMNS } from '../types/project';

/**
 * Reorder columns array from one index to another
 * Prevents moving locked columns or moving to position 0
 */
export function reorderColumns(
  columns: TableColumn[],
  fromIndex: number,
  toIndex: number
): TableColumn[] {
  // Prevent moving locked column (projectName)
  if (columns[fromIndex].locked) {
    return columns;
  }
  
  // Prevent moving to position 0 (reserved for projectName)
  if (toIndex === 0) {
    return columns;
  }
  
  const result = Array.from(columns);
  const [removed] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, removed);
  
  return result;
}

/**
 * Extract column IDs from columns array
 */
export function getColumnOrderIds(columns: TableColumn[]): TableColumnId[] {
  return columns.map(col => col.id);
}

/**
 * Apply saved column order to default columns
 * Handles backward compatibility for missing or new columns
 */
export function applyColumnOrder(
  savedOrder: TableColumnId[],
  savedVisibility?: Record<TableColumnId, boolean>
): TableColumn[] {
  const columnMap = new Map(
    DEFAULT_TABLE_COLUMNS.map(col => [col.id, col])
  );
  
  // Build ordered array based on savedOrder
  const ordered = savedOrder
    .map(id => columnMap.get(id))
    .filter(Boolean) as TableColumn[];
  
  // Add any missing columns (for backward compatibility when new columns are added)
  DEFAULT_TABLE_COLUMNS.forEach(col => {
    if (!savedOrder.includes(col.id)) {
      ordered.push(col);
    }
  });
  
  // Apply visibility settings if provided
  if (savedVisibility) {
    ordered.forEach(col => {
      if (savedVisibility[col.id] !== undefined) {
        col.visible = savedVisibility[col.id];
      }
    });
  }
  
  return ordered;
}

/**
 * Check if current order matches default order
 */
export function isDefaultOrder(currentOrder: TableColumnId[]): boolean {
  const defaultOrder = DEFAULT_TABLE_COLUMNS.map(col => col.id);
  return JSON.stringify(currentOrder) === JSON.stringify(defaultOrder);
}

/**
 * Toggle visibility of a column
 * Returns updated columns array with toggled visibility
 * Prevents hiding projectName or hiding all columns
 */
export function toggleColumnVisibility(
  columns: TableColumn[],
  columnId: TableColumnId
): TableColumn[] {
  // Prevent hiding locked column (projectName)
  const column = columns.find(col => col.id === columnId);
  if (column?.locked) {
    return columns;
  }
  
  // Count currently visible columns
  const visibleCount = columns.filter(col => col.visible).length;
  
  // Prevent hiding if this is the last visible column (besides locked projectName)
  if (visibleCount <= 2 && column?.visible) {
    return columns;
  }
  
  // Toggle visibility
  return columns.map(col => 
    col.id === columnId 
      ? { ...col, visible: !col.visible }
      : col
  );
}

/**
 * Get visibility state as a record object
 */
export function getColumnVisibility(columns: TableColumn[]): Record<TableColumnId, boolean> {
  return columns.reduce((acc, col) => {
    acc[col.id] = col.visible;
    return acc;
  }, {} as Record<TableColumnId, boolean>);
}
