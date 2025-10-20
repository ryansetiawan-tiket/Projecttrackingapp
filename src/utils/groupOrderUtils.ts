/**
 * Group Order Utilities
 * 
 * Utilities for managing custom ordering of status and vertical groups
 * in the Table view.
 */

import { projectId, publicAnonKey } from './supabase/info';

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Default order for active project statuses
 * Based on typical workflow progression
 */
export const DEFAULT_ACTIVE_STATUS_ORDER: string[] = [
  "In Progress",
  "In Review",
  "Lightroom",
  "Not Started",
  "Babysit",
  "On Hold"
];

/**
 * Default order for archive project statuses
 * Based on project outcomes
 */
export const DEFAULT_ARCHIVE_STATUS_ORDER: string[] = [
  "Done",
  "Canceled"
];

/**
 * Database keys for group order settings
 */
export const GROUP_ORDER_KEYS = {
  STATUS_ACTIVE: "status_group_order_active",
  STATUS_ARCHIVE: "status_group_order_archive",
  VERTICALS: "vertical_group_order"
} as const;

// ============================================================================
// MERGE ALGORITHM
// ============================================================================

/**
 * Merge saved order with current available items
 * 
 * Handles:
 * - New items not in saved order → append to end (alphabetically for verticals)
 * - Deleted items in saved order → remove from list
 * - Preserve user's custom order for existing items
 * 
 * @param savedOrder - The saved custom order from database
 * @param availableItems - Currently available items from managers
 * @param sortNewItemsAlphabetically - Whether to sort new items alphabetically (true for verticals)
 * @returns Merged order array
 */
export function mergeOrderWithItems(
  savedOrder: string[],
  availableItems: string[],
  sortNewItemsAlphabetically: boolean = false
): string[] {
  // 1. Filter out deleted items (items in savedOrder but not in availableItems)
  const validOrder = savedOrder.filter(item => 
    availableItems.includes(item)
  );
  
  // 2. Find new items (items in availableItems but not in savedOrder)
  const newItems = availableItems.filter(item => 
    !savedOrder.includes(item)
  );
  
  // 3. Sort new items if needed (for verticals)
  const sortedNewItems = sortNewItemsAlphabetically
    ? newItems.sort((a, b) => a.localeCompare(b))
    : newItems;
  
  // 4. Merge: existing order + new items
  return [...validOrder, ...sortedNewItems];
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate status group order data
 * 
 * @param order - Data to validate
 * @returns True if valid, false otherwise
 */
export function validateStatusOrder(order: unknown): order is string[] {
  // Must be array
  if (!Array.isArray(order)) return false;
  
  // All items must be strings
  if (!order.every(item => typeof item === 'string')) return false;
  
  // No duplicates
  if (new Set(order).size !== order.length) return false;
  
  // Non-empty strings
  if (order.some(item => item.trim() === '')) return false;
  
  return true;
}

/**
 * Validate vertical group order data
 * 
 * @param order - Data to validate
 * @returns True if valid, false otherwise
 */
export function validateVerticalOrder(order: unknown): order is string[] {
  // Same validation as status order
  return validateStatusOrder(order);
}

// ============================================================================
// DATABASE OPERATIONS
// ============================================================================

/**
 * Save status group order to database
 * 
 * @param type - 'active' or 'archive'
 * @param order - Array of status names in desired order
 */
export async function saveStatusGroupOrder(
  type: 'active' | 'archive',
  order: string[]
): Promise<void> {
  const key = type === 'active' 
    ? GROUP_ORDER_KEYS.STATUS_ACTIVE 
    : GROUP_ORDER_KEYS.STATUS_ARCHIVE;
  
  const response = await fetch(
    `https://${projectId}.supabase.co/functions/v1/make-server-691c6bba/kv/${key}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(order),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to save status group order: ${response.statusText}`);
  }
}

/**
 * Load status group order from database
 * 
 * @param type - 'active' or 'archive'
 * @returns Array of status names, or default order if not found
 */
export async function loadStatusGroupOrder(
  type: 'active' | 'archive'
): Promise<string[]> {
  const key = type === 'active' 
    ? GROUP_ORDER_KEYS.STATUS_ACTIVE 
    : GROUP_ORDER_KEYS.STATUS_ARCHIVE;
  
  try {
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-691c6bba/kv/${key}`,
      {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      }
    );

    if (response.ok) {
      const saved = await response.json();
      
      // Validate and return saved order, or use default
      if (saved && validateStatusOrder(saved)) {
        return saved;
      }
    }
  } catch (error) {
    console.error('Error loading status group order:', error);
  }
  
  // Return default order
  return type === 'active' 
    ? DEFAULT_ACTIVE_STATUS_ORDER 
    : DEFAULT_ARCHIVE_STATUS_ORDER;
}

/**
 * Save vertical group order to database
 * 
 * @param order - Array of vertical names in desired order
 */
export async function saveVerticalGroupOrder(
  order: string[]
): Promise<void> {
  const response = await fetch(
    `https://${projectId}.supabase.co/functions/v1/make-server-691c6bba/kv/${GROUP_ORDER_KEYS.VERTICALS}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(order),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to save vertical group order: ${response.statusText}`);
  }
}

/**
 * Load vertical group order from database
 * 
 * @param availableVerticals - Currently available verticals
 * @returns Array of vertical names, or alphabetical order if not found
 */
export async function loadVerticalGroupOrder(
  availableVerticals: string[]
): Promise<string[]> {
  try {
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-691c6bba/kv/${GROUP_ORDER_KEYS.VERTICALS}`,
      {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      }
    );

    if (response.ok) {
      const saved = await response.json();
      
      // Validate and return saved order, or use alphabetical
      if (saved && validateVerticalOrder(saved)) {
        return saved;
      }
    }
  } catch (error) {
    console.error('Error loading vertical group order:', error);
  }
  
  // Return alphabetical order
  return [...availableVerticals].sort((a, b) => a.localeCompare(b));
}

// ============================================================================
// SYNC FUNCTIONS
// ============================================================================

/**
 * Sync custom order with available statuses from StatusManager
 * 
 * Called whenever StatusManager data changes to ensure order list
 * stays in sync with actual available statuses.
 * 
 * @param currentOrder - Current custom order
 * @param availableStatuses - All available statuses from StatusManager
 * @param isArchive - Whether this is for archive tab (Done, Canceled)
 * @returns Synced order array
 */
export function syncStatusOrder(
  currentOrder: string[],
  availableStatuses: string[],
  isArchive: boolean
): string[] {
  // Determine which statuses should be in this order
  const relevantStatuses = isArchive
    ? availableStatuses.filter(s => s === "Done" || s === "Canceled")
    : availableStatuses.filter(s => s !== "Done" && s !== "Canceled");
  
  // Merge with current order (don't sort alphabetically for statuses)
  return mergeOrderWithItems(currentOrder, relevantStatuses, false);
}

/**
 * Sync custom order with available verticals from VerticalManager
 * 
 * Called whenever VerticalManager data changes to ensure order list
 * stays in sync with actual available verticals.
 * 
 * @param currentOrder - Current custom order
 * @param availableVerticals - All available verticals from VerticalManager
 * @returns Synced order array
 */
export function syncVerticalOrder(
  currentOrder: string[],
  availableVerticals: string[]
): string[] {
  // Merge with current order (sort new items alphabetically for verticals)
  return mergeOrderWithItems(currentOrder, availableVerticals, true);
}
