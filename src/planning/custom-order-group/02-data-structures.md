# Custom Group Order Feature - Data Structures

## 📦 Database Schema

### **KV Store Keys**

```typescript
// Status Group Order - Active Projects
KEY: "status_group_order_active"
VALUE: string[]  // Array of status names
EXAMPLE: ["In Progress", "In Review", "Lightroom", "Not Started", "Babysit", "On Hold"]

// Status Group Order - Archive Projects
KEY: "status_group_order_archive"
VALUE: string[]  // Array of status names
EXAMPLE: ["Done", "Canceled"]

// Vertical Group Order
KEY: "vertical_group_order"
VALUE: string[]  // Array of vertical names
EXAMPLE: ["Brand", "Creative", "Marketing", "Product"]
```

---

## 🏗️ TypeScript Interfaces

### **Core Types**

```typescript
// /types/project.ts (existing file - add these)

/**
 * Custom group order settings
 */
export interface GroupOrderSettings {
  statusActive: string[];     // Order for active status groups
  statusArchive: string[];    // Order for archive status groups
  verticals: string[];        // Order for vertical groups
}

/**
 * Individual order item for UI rendering
 */
export interface OrderItem {
  id: string;           // Unique identifier (status/vertical name)
  name: string;         // Display name
  color?: string;       // Optional color for visual indicator
  index: number;        // Current position in order
}
```

---

## 🎯 Default Values

### **Constants File**

```typescript
// /utils/groupOrderUtils.ts

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
```

---

## 🔄 Data Transformation Logic

### **Merging Algorithm**

When loading order from database, we need to merge with actual available items:

```typescript
/**
 * Merge saved order with current available items
 * Handles:
 * - New items not in saved order → append to end (alphabetically for verticals)
 * - Deleted items in saved order → remove from list
 * - Preserve user's custom order for existing items
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
```

### **Example Scenarios**

#### **Scenario 1: User adds new status "Waiting for Client"**

```typescript
// Saved order (from DB)
savedOrder = ["In Progress", "In Review", "Not Started"];

// Available statuses (from StatusManager)
availableStatuses = ["In Progress", "In Review", "Not Started", "Waiting for Client"];

// Result
mergeOrderWithItems(savedOrder, availableStatuses, false)
// => ["In Progress", "In Review", "Not Started", "Waiting for Client"]
```

#### **Scenario 2: User deletes status "Lightroom"**

```typescript
// Saved order (from DB)
savedOrder = ["In Progress", "In Review", "Lightroom", "Not Started"];

// Available statuses (from StatusManager)
availableStatuses = ["In Progress", "In Review", "Not Started"];

// Result
mergeOrderWithItems(savedOrder, availableStatuses, false)
// => ["In Progress", "In Review", "Not Started"]
```

#### **Scenario 3: User adds new vertical "Sales"**

```typescript
// Saved order (from DB)
savedOrder = ["Brand", "Marketing", "Product"];

// Available verticals (from VerticalManager)
availableVerticals = ["Brand", "Marketing", "Product", "Sales"];

// Result (alphabetically sorted new items)
mergeOrderWithItems(savedOrder, availableVerticals, true)
// => ["Brand", "Marketing", "Product", "Sales"]

// If "Analytics" is added later
availableVerticals = ["Analytics", "Brand", "Marketing", "Product", "Sales"];
mergeOrderWithItems(savedOrder, availableVerticals, true)
// => ["Brand", "Marketing", "Product", "Analytics", "Sales"]
// Note: Analytics goes after Sales because Sales was already at the end
```

---

## 🎣 Custom Hooks Data Flow

### **useStatusGroupOrder Hook**

```typescript
// /hooks/useStatusGroupOrder.ts

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
  // State management
  const [activeOrder, setActiveOrder] = useState<string[]>([]);
  const [archiveOrder, setArchiveOrder] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Load from database
  useEffect(() => {
    loadOrders();
  }, []);
  
  // Auto-sync with StatusManager changes
  useEffect(() => {
    syncWithAvailableStatuses();
  }, [availableStatuses]);
  
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
```

### **useVerticalGroupOrder Hook**

```typescript
// /hooks/useVerticalGroupOrder.ts

interface UseVerticalGroupOrderReturn {
  verticalOrder: string[];
  isLoading: boolean;
  error: Error | null;
  
  updateVerticalOrder: (newOrder: string[]) => Promise<void>;
  resetVerticalOrder: () => Promise<void>;
}

export function useVerticalGroupOrder(): UseVerticalGroupOrderReturn {
  // State management
  const [verticalOrder, setVerticalOrder] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Load from database
  useEffect(() => {
    loadOrder();
  }, []);
  
  // Auto-sync with VerticalManager changes
  useEffect(() => {
    syncWithAvailableVerticals();
  }, [availableVerticals]);
  
  return {
    verticalOrder,
    isLoading,
    error,
    updateVerticalOrder,
    resetVerticalOrder
  };
}
```

---

## 🔀 Sorting & Grouping Logic

### **Project Grouping in Table**

```typescript
// /components/ProjectTable.tsx

/**
 * Group projects by status using custom order
 */
function groupProjectsByStatus(
  projects: Project[],
  customOrder: string[]
): Map<string, Project[]> {
  const groups = new Map<string, Project[]>();
  
  // 1. Initialize groups in custom order
  customOrder.forEach(status => {
    groups.set(status, []);
  });
  
  // 2. Assign projects to groups
  projects.forEach(project => {
    const status = project.status || "Not Started";
    if (!groups.has(status)) {
      // Status not in custom order → create new group at end
      groups.set(status, []);
    }
    groups.get(status)!.push(project);
  });
  
  // 3. Add ungrouped statuses (not in custom order) - sorted alphabetically
  const ungroupedStatuses = Array.from(groups.keys())
    .filter(status => !customOrder.includes(status))
    .sort((a, b) => a.localeCompare(b));
  
  // 4. Final order: custom order + ungrouped (alphabetically)
  const finalOrder = [...customOrder, ...ungroupedStatuses];
  
  // 5. Return groups in final order
  const orderedGroups = new Map<string, Project[]>();
  finalOrder.forEach(status => {
    if (groups.has(status) && groups.get(status)!.length > 0) {
      orderedGroups.set(status, groups.get(status)!);
    }
  });
  
  return orderedGroups;
}

/**
 * Group projects by vertical using custom order
 */
function groupProjectsByVertical(
  projects: Project[],
  customOrder: string[]
): Map<string, Project[]> {
  // Same logic as groupProjectsByStatus
  // ...
}
```

---

## 💾 Database Operations

### **Save Operation**

```typescript
// /utils/groupOrderUtils.ts

/**
 * Save status group order to database
 */
export async function saveStatusGroupOrder(
  type: 'active' | 'archive',
  order: string[]
): Promise<void> {
  const key = type === 'active' 
    ? GROUP_ORDER_KEYS.STATUS_ACTIVE 
    : GROUP_ORDER_KEYS.STATUS_ARCHIVE;
  
  await kv.set(key, order);
}

/**
 * Save vertical group order to database
 */
export async function saveVerticalGroupOrder(
  order: string[]
): Promise<void> {
  await kv.set(GROUP_ORDER_KEYS.VERTICALS, order);
}
```

### **Load Operation**

```typescript
/**
 * Load status group order from database
 */
export async function loadStatusGroupOrder(
  type: 'active' | 'archive'
): Promise<string[]> {
  const key = type === 'active' 
    ? GROUP_ORDER_KEYS.STATUS_ACTIVE 
    : GROUP_ORDER_KEYS.STATUS_ARCHIVE;
  
  const saved = await kv.get(key);
  
  if (!saved || !Array.isArray(saved)) {
    // Return default order
    return type === 'active' 
      ? DEFAULT_ACTIVE_STATUS_ORDER 
      : DEFAULT_ARCHIVE_STATUS_ORDER;
  }
  
  return saved;
}

/**
 * Load vertical group order from database
 */
export async function loadVerticalGroupOrder(
  availableVerticals: string[]
): Promise<string[]> {
  const saved = await kv.get(GROUP_ORDER_KEYS.VERTICALS);
  
  if (!saved || !Array.isArray(saved)) {
    // Return alphabetical order
    return [...availableVerticals].sort((a, b) => a.localeCompare(b));
  }
  
  return saved;
}
```

---

## 🔄 Sync Logic

### **Status Sync Algorithm**

```typescript
/**
 * Sync custom order with available statuses from StatusManager
 * Called whenever StatusManager data changes
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
  
  // Merge with current order
  return mergeOrderWithItems(currentOrder, relevantStatuses, false);
}
```

### **Vertical Sync Algorithm**

```typescript
/**
 * Sync custom order with available verticals from VerticalManager
 * Called whenever VerticalManager data changes
 */
export function syncVerticalOrder(
  currentOrder: string[],
  availableVerticals: string[]
): string[] {
  // Merge with current order (alphabetically sort new items)
  return mergeOrderWithItems(currentOrder, availableVerticals, true);
}
```

---

## 🧪 Test Data

### **Mock Database State**

```typescript
// For testing purposes

export const MOCK_GROUP_ORDER_DATA = {
  status_group_order_active: [
    "In Progress",
    "In Review",
    "Lightroom",
    "Not Started",
    "Babysit",
    "On Hold"
  ],
  status_group_order_archive: [
    "Done",
    "Canceled"
  ],
  vertical_group_order: [
    "Brand",
    "Creative",
    "Marketing",
    "Product"
  ]
};
```

### **Mock Available Items**

```typescript
export const MOCK_AVAILABLE_STATUSES = [
  "In Progress",
  "In Review",
  "Lightroom",
  "Not Started",
  "Babysit",
  "On Hold",
  "Done",
  "Canceled",
  "Waiting for Client"  // New status added by user
];

export const MOCK_AVAILABLE_VERTICALS = [
  "Brand",
  "Creative",
  "Marketing",
  "Product",
  "Sales"  // New vertical added by user
];
```

---

## 📊 Data Validation

### **Validation Rules**

```typescript
/**
 * Validate status group order data
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
 */
export function validateVerticalOrder(order: unknown): order is string[] {
  // Same validation as status order
  return validateStatusOrder(order);
}
```

---

## 🔍 Edge Case Handling

### **Edge Case Matrix**

| Scenario | Saved Order | Available Items | Result | Notes |
|----------|-------------|-----------------|--------|-------|
| First time user | `null` | `["A", "B", "C"]` | Default order | Use DEFAULT_ACTIVE_STATUS_ORDER |
| User deleted item | `["A", "B", "C"]` | `["A", "C"]` | `["A", "C"]` | Remove "B" from order |
| User added item | `["A", "B"]` | `["A", "B", "C"]` | `["A", "B", "C"]` | Append "C" to end |
| Corrupted data | `"invalid"` | `["A", "B", "C"]` | Default order | Validation fails → use default |
| Empty array | `[]` | `["A", "B", "C"]` | `["A", "B", "C"]` | Treat as first time |
| All items deleted | `["A", "B", "C"]` | `[]` | `[]` | Empty result (show empty state) |

---

**Next Document**: [03-implementation-plan.md](./03-implementation-plan.md)
