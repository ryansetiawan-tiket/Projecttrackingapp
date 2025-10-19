# Draggable Columns - Data Structures

## Column Definition

### Column Identifier Type
```typescript
// types/project.ts

export type TableColumnId = 
  | 'projectName'    // LOCKED - always first
  | 'status'
  | 'type'
  | 'vertical'
  | 'deliverables'
  | 'assetsProgress'
  | 'startDate'
  | 'endDate'
  | 'collaborators'
  | 'links';

export interface TableColumn {
  id: TableColumnId;
  label: string;
  locked?: boolean;        // true for projectName
  defaultOrder: number;    // Original position (0-9)
  currentOrder?: number;   // User's custom position
  visible: boolean;        // Future: column visibility toggle
  width?: string;          // Optional: custom width
}
```

### Default Column Configuration
```typescript
export const DEFAULT_TABLE_COLUMNS: TableColumn[] = [
  { 
    id: 'projectName', 
    label: 'Project Name', 
    locked: true, 
    defaultOrder: 0, 
    visible: true 
  },
  { 
    id: 'status', 
    label: 'Status', 
    defaultOrder: 1, 
    visible: true 
  },
  { 
    id: 'type', 
    label: 'Type', 
    defaultOrder: 2, 
    visible: true 
  },
  { 
    id: 'vertical', 
    label: 'Vertical', 
    defaultOrder: 3, 
    visible: true 
  },
  { 
    id: 'deliverables', 
    label: 'Deliverables', 
    defaultOrder: 4, 
    visible: true 
  },
  { 
    id: 'assetsProgress', 
    label: 'Assets', 
    defaultOrder: 5, 
    visible: true 
  },
  { 
    id: 'startDate', 
    label: 'Start Date', 
    defaultOrder: 6, 
    visible: true 
  },
  { 
    id: 'endDate', 
    label: 'End Date', 
    defaultOrder: 7, 
    visible: true 
  },
  { 
    id: 'collaborators', 
    label: 'Collaborators', 
    defaultOrder: 8, 
    visible: true 
  },
  { 
    id: 'links', 
    label: 'Links', 
    defaultOrder: 9, 
    visible: true 
  },
];
```

## Database Schema

### Storing Column Order Preferences

**Approach: Store as JSON array in settings table**

#### Option A: In Existing `settings` Table
```sql
-- Add to existing kv_store_691c6bba table
-- Key format: "table_column_order:{userId}"

{
  "key": "table_column_order:user-abc-123",
  "value": {
    "columnOrder": [
      "projectName",    // Position 0
      "deliverables",   // Position 1 (moved up)
      "status",         // Position 2
      "collaborators",  // Position 3 (moved up)
      "type",           // Position 4
      "vertical",       // Position 5
      "assetsProgress", // Position 6
      "startDate",      // Position 7
      "endDate",        // Position 8
      "links"           // Position 9
    ],
    "lastUpdated": "2025-10-19T10:30:00Z"
  }
}
```

#### Option B: Dedicated Column (Future Enhancement)
```typescript
// If we want more structured approach later
interface TableSettings {
  userId: string;
  columnOrder: TableColumnId[];
  columnWidths?: Record<TableColumnId, string>;
  columnVisibility?: Record<TableColumnId, boolean>;
  lastUpdated: string;
}
```

**Decision: Use Option A** - Leverage existing KV store system

## State Management

### React State Structure

```typescript
// In ProjectTable.tsx or custom hook

interface ColumnOrderState {
  columns: TableColumn[];           // Current ordered columns
  isLoading: boolean;                // Loading from DB
  isDragging: boolean;               // Currently dragging
  draggedColumn: TableColumnId | null;
  dropTarget: number | null;         // Index where column will drop
}

// Hook signature
function useColumnOrder(): {
  columns: TableColumn[];
  reorderColumn: (fromIndex: number, toIndex: number) => void;
  resetToDefault: () => void;
  isLoading: boolean;
  saveColumnOrder: (order: TableColumnId[]) => Promise<void>;
}
```

### Context (Optional)
```typescript
// contexts/ColumnOrderContext.tsx

interface ColumnOrderContextValue {
  columnOrder: TableColumnId[];
  setColumnOrder: (order: TableColumnId[]) => void;
  resetColumnOrder: () => void;
  isCustomOrder: boolean;  // true if different from default
}

export const ColumnOrderProvider: React.FC<{children: React.ReactNode}>
```

**Decision: Start with Hook** - Context only if needed by multiple components

## Drag & Drop Data Structure

### react-dnd Item Type
```typescript
// components/project-table/types.ts

export const COLUMN_DRAG_TYPE = 'TABLE_COLUMN';

export interface DragItem {
  type: typeof COLUMN_DRAG_TYPE;
  columnId: TableColumnId;
  index: number;
}

export interface DragCollectedProps {
  isDragging: boolean;
  handlerId: string | symbol | null;
}

export interface DropCollectedProps {
  isOver: boolean;
  canDrop: boolean;
}
```

### Drag State Tracking
```typescript
interface DragState {
  sourceIndex: number | null;
  targetIndex: number | null;
  isActive: boolean;
}
```

## Helper Functions

### Column Reordering Logic
```typescript
// utils/columnOrderUtils.ts

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

export function getColumnOrderIds(columns: TableColumn[]): TableColumnId[] {
  return columns.map(col => col.id);
}

export function applyColumnOrder(
  defaultColumns: TableColumn[],
  savedOrder: TableColumnId[]
): TableColumn[] {
  const columnMap = new Map(
    defaultColumns.map(col => [col.id, col])
  );
  
  // Build ordered array based on savedOrder
  const ordered = savedOrder
    .map(id => columnMap.get(id))
    .filter(Boolean) as TableColumn[];
  
  // Add any missing columns (for backward compatibility)
  defaultColumns.forEach(col => {
    if (!savedOrder.includes(col.id)) {
      ordered.push(col);
    }
  });
  
  return ordered;
}

export function isDefaultOrder(
  currentOrder: TableColumnId[]
): boolean {
  const defaultOrder = DEFAULT_TABLE_COLUMNS.map(col => col.id);
  return JSON.stringify(currentOrder) === JSON.stringify(defaultOrder);
}
```

## API Payloads

### Save Column Order
```typescript
// POST/PUT to backend
interface SaveColumnOrderRequest {
  userId: string;           // From auth context
  columnOrder: TableColumnId[];
}

interface SaveColumnOrderResponse {
  success: boolean;
  message?: string;
  columnOrder: TableColumnId[];
}
```

### Load Column Order
```typescript
// GET from backend
interface LoadColumnOrderRequest {
  userId: string;
}

interface LoadColumnOrderResponse {
  success: boolean;
  columnOrder: TableColumnId[] | null;  // null if no custom order
  isDefault: boolean;
}
```

## Migration Considerations

### Backward Compatibility
```typescript
// Handle users who don't have saved column order yet
function getInitialColumnOrder(
  savedOrder: TableColumnId[] | null | undefined
): TableColumn[] {
  if (!savedOrder || savedOrder.length === 0) {
    return DEFAULT_TABLE_COLUMNS;
  }
  
  return applyColumnOrder(DEFAULT_TABLE_COLUMNS, savedOrder);
}
```

### Future Column Additions
```typescript
// When new columns are added to the table
function mergeNewColumns(
  savedOrder: TableColumnId[],
  newColumns: TableColumn[]
): TableColumnId[] {
  const existingIds = new Set(savedOrder);
  const newIds = newColumns
    .filter(col => !existingIds.has(col.id))
    .map(col => col.id);
  
  // Add new columns at the end
  return [...savedOrder, ...newIds];
}
```

## Performance Considerations

### Debouncing Saves
```typescript
// Prevent too many DB writes during rapid reordering
const debouncedSave = useDebouncedCallback(
  (order: TableColumnId[]) => saveColumnOrder(order),
  1000  // 1 second delay
);
```

### Optimistic Updates
```typescript
// Update UI immediately, save to DB in background
function handleReorder(fromIndex: number, toIndex: number) {
  // 1. Update local state immediately
  const newColumns = reorderColumns(columns, fromIndex, toIndex);
  setColumns(newColumns);
  
  // 2. Save to DB (background)
  debouncedSave(getColumnOrderIds(newColumns));
}
```

### Memoization
```typescript
// Prevent unnecessary re-renders
const orderedColumns = useMemo(
  () => applyColumnOrder(DEFAULT_TABLE_COLUMNS, savedOrder),
  [savedOrder]
);
```

## Type Safety

### Column Rendering Map
```typescript
type ColumnRenderer = {
  [K in TableColumnId]: (project: Project) => React.ReactNode;
};

const columnRenderers: ColumnRenderer = {
  projectName: (project) => <ProjectNameCell project={project} />,
  status: (project) => <StatusCell status={project.status} />,
  type: (project) => <TypeCell type={project.type} />,
  // ... etc
};
```

## Example Usage

### In ProjectTable Component
```typescript
function ProjectTable() {
  const { user } = useAuth();
  const {
    columns,
    reorderColumn,
    resetToDefault,
    isLoading
  } = useColumnOrder(user?.id);
  
  if (isLoading) {
    return <Skeleton />;
  }
  
  return (
    <table>
      <thead>
        <tr>
          {columns.map((column, index) => (
            <DraggableTableHeader
              key={column.id}
              column={column}
              index={index}
              onReorder={reorderColumn}
            />
          ))}
        </tr>
      </thead>
      {/* ... */}
    </table>
  );
}
```

## Error Handling

### Save Failures
```typescript
try {
  await saveColumnOrder(newOrder);
} catch (error) {
  console.error('Failed to save column order:', error);
  // Revert to previous order
  setColumns(previousColumns);
  toast.error('Failed to save column order. Please try again.');
}
```

### Load Failures
```typescript
try {
  const savedOrder = await loadColumnOrder(userId);
  setColumns(applyColumnOrder(DEFAULT_TABLE_COLUMNS, savedOrder));
} catch (error) {
  console.error('Failed to load column order:', error);
  // Fall back to default
  setColumns(DEFAULT_TABLE_COLUMNS);
}
```
