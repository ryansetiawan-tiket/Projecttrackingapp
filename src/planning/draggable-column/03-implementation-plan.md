# Draggable Columns - Implementation Plan

## Phase Overview

### Phase 1: Foundation & Data Layer (30%)
- Setup column order types and utilities
- Implement database storage/retrieval
- Create custom hook for column order management

### Phase 2: Drag & Drop UI (40%)
- Integrate react-dnd library
- Build draggable table headers
- Implement visual feedback and animations

### Phase 3: Integration & Polish (20%)
- Connect to existing ProjectTable
- Add reset functionality
- Accessibility improvements

### Phase 4: Testing & Documentation (10%)
- Comprehensive testing
- User documentation
- Performance optimization

---

## Phase 1: Foundation & Data Layer

### Step 1.1: Type Definitions
**File: `/types/project.ts`**

```typescript
// Add to existing file

export type TableColumnId = 
  | 'projectName'
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
  locked?: boolean;
  defaultOrder: number;
  visible: boolean;
  width?: string;
}

export const DEFAULT_TABLE_COLUMNS: TableColumn[] = [
  { id: 'projectName', label: 'Project Name', locked: true, defaultOrder: 0, visible: true },
  { id: 'status', label: 'Status', defaultOrder: 1, visible: true },
  { id: 'type', label: 'Type', defaultOrder: 2, visible: true },
  { id: 'vertical', label: 'Vertical', defaultOrder: 3, visible: true },
  { id: 'deliverables', label: 'Deliverables', defaultOrder: 4, visible: true },
  { id: 'assetsProgress', label: 'Assets', defaultOrder: 5, visible: true },
  { id: 'startDate', label: 'Start Date', defaultOrder: 6, visible: true },
  { id: 'endDate', label: 'End Date', defaultOrder: 7, visible: true },
  { id: 'collaborators', label: 'Collaborators', defaultOrder: 8, visible: true },
  { id: 'links', label: 'Links', defaultOrder: 9, visible: true },
];
```

**Checklist:**
- [ ] Add types to `/types/project.ts`
- [ ] Export DEFAULT_TABLE_COLUMNS constant
- [ ] Verify type safety with existing Project type

---

### Step 1.2: Utility Functions
**File: `/utils/columnOrderUtils.ts` (NEW)**

```typescript
import { TableColumn, TableColumnId, DEFAULT_TABLE_COLUMNS } from '../types/project';

export function reorderColumns(
  columns: TableColumn[],
  fromIndex: number,
  toIndex: number
): TableColumn[] {
  if (columns[fromIndex].locked || toIndex === 0) {
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
  savedOrder: TableColumnId[]
): TableColumn[] {
  const columnMap = new Map(
    DEFAULT_TABLE_COLUMNS.map(col => [col.id, col])
  );
  
  const ordered = savedOrder
    .map(id => columnMap.get(id))
    .filter(Boolean) as TableColumn[];
  
  DEFAULT_TABLE_COLUMNS.forEach(col => {
    if (!savedOrder.includes(col.id)) {
      ordered.push(col);
    }
  });
  
  return ordered;
}

export function isDefaultOrder(currentOrder: TableColumnId[]): boolean {
  const defaultOrder = DEFAULT_TABLE_COLUMNS.map(col => col.id);
  return JSON.stringify(currentOrder) === JSON.stringify(defaultOrder);
}
```

**Checklist:**
- [ ] Create `/utils/columnOrderUtils.ts`
- [ ] Implement all helper functions
- [ ] Add unit tests (optional but recommended)

---

### Step 1.3: Backend API Routes
**File: `/supabase/functions/server/index.tsx`**

Add new routes for column order management:

```typescript
// GET /make-server-691c6bba/table-column-order
app.get('/make-server-691c6bba/table-column-order', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const key = `table_column_order:${user.id}`;
    const result = await kv.get(key);
    
    return c.json({
      success: true,
      columnOrder: result?.columnOrder || null,
    });
  } catch (error) {
    console.error('Error loading column order:', error);
    return c.json({ error: 'Failed to load column order' }, 500);
  }
});

// PUT /make-server-691c6bba/table-column-order
app.put('/make-server-691c6bba/table-column-order', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const { columnOrder } = await c.req.json();
    
    if (!Array.isArray(columnOrder)) {
      return c.json({ error: 'Invalid column order format' }, 400);
    }
    
    const key = `table_column_order:${user.id}`;
    await kv.set(key, {
      columnOrder,
      lastUpdated: new Date().toISOString(),
    });
    
    return c.json({
      success: true,
      columnOrder,
    });
  } catch (error) {
    console.error('Error saving column order:', error);
    return c.json({ error: 'Failed to save column order' }, 500);
  }
});

// DELETE /make-server-691c6bba/table-column-order (Reset to default)
app.delete('/make-server-691c6bba/table-column-order', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const key = `table_column_order:${user.id}`;
    await kv.del(key);
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting column order:', error);
    return c.json({ error: 'Failed to reset column order' }, 500);
  }
});
```

**Checklist:**
- [ ] Add GET route for loading column order
- [ ] Add PUT route for saving column order
- [ ] Add DELETE route for resetting column order
- [ ] Test all routes with proper auth headers

---

### Step 1.4: Custom Hook
**File: `/hooks/useColumnOrder.ts` (NEW)**

```typescript
import { useState, useEffect, useCallback } from 'react';
import { TableColumn, TableColumnId, DEFAULT_TABLE_COLUMNS } from '../types/project';
import { 
  reorderColumns, 
  getColumnOrderIds, 
  applyColumnOrder,
  isDefaultOrder 
} from '../utils/columnOrderUtils';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from '../utils/toast';

export function useColumnOrder(userId: string | undefined) {
  const [columns, setColumns] = useState<TableColumn[]>(DEFAULT_TABLE_COLUMNS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load column order from database
  useEffect(() => {
    if (!userId) {
      setColumns(DEFAULT_TABLE_COLUMNS);
      setIsLoading(false);
      return;
    }

    const loadColumnOrder = async () => {
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-691c6bba/table-column-order`,
          {
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
            },
          }
        );

        if (!response.ok) throw new Error('Failed to load column order');

        const data = await response.json();
        
        if (data.columnOrder) {
          setColumns(applyColumnOrder(data.columnOrder));
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
  }, [userId]);

  // Save column order to database
  const saveColumnOrder = useCallback(async (newOrder: TableColumnId[]) => {
    if (!userId) return;

    setIsSaving(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-691c6bba/table-column-order`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ columnOrder: newOrder }),
        }
      );

      if (!response.ok) throw new Error('Failed to save column order');
    } catch (error) {
      console.error('Error saving column order:', error);
      toast.error('Failed to save column order');
    } finally {
      setIsSaving(false);
    }
  }, [userId]);

  // Reorder columns (with optimistic update)
  const handleReorder = useCallback((fromIndex: number, toIndex: number) => {
    const newColumns = reorderColumns(columns, fromIndex, toIndex);
    setColumns(newColumns);
    
    const newOrder = getColumnOrderIds(newColumns);
    saveColumnOrder(newOrder);
  }, [columns, saveColumnOrder]);

  // Reset to default order
  const resetToDefault = useCallback(async () => {
    if (!userId) return;

    setColumns(DEFAULT_TABLE_COLUMNS);
    
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-691c6bba/table-column-order`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to reset column order');
      toast.success('Column order reset to default');
    } catch (error) {
      console.error('Error resetting column order:', error);
      toast.error('Failed to reset column order');
    }
  }, [userId]);

  const hasCustomOrder = !isDefaultOrder(getColumnOrderIds(columns));

  return {
    columns,
    reorderColumn: handleReorder,
    resetToDefault,
    isLoading,
    isSaving,
    hasCustomOrder,
  };
}
```

**Checklist:**
- [ ] Create `/hooks/useColumnOrder.ts`
- [ ] Implement load, save, and reset logic
- [ ] Add optimistic updates
- [ ] Add error handling with toast notifications

---

## Phase 2: Drag & Drop UI

### Step 2.1: Install Dependencies
```bash
# react-dnd is already available, no installation needed
```

**Checklist:**
- [ ] Verify react-dnd is available in environment
- [ ] Check dnd-kit as alternative if needed

---

### Step 2.2: DnD Provider Setup
**File: `/App.tsx`**

Wrap app with DndProvider (if not already present):

```typescript
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

// In App component
<DndProvider backend={HTML5Backend}>
  {/* existing app content */}
</DndProvider>
```

**Checklist:**
- [ ] Add DndProvider to App.tsx
- [ ] Verify it wraps all routes

---

### Step 2.3: Draggable Table Header Component
**File: `/components/project-table/DraggableTableHeader.tsx` (NEW)**

```typescript
import { useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { GripVertical, Lock } from 'lucide-react';
import { TableColumn } from '../../types/project';

const COLUMN_DRAG_TYPE = 'TABLE_COLUMN';

interface DragItem {
  index: number;
  columnId: string;
}

interface DraggableTableHeaderProps {
  column: TableColumn;
  index: number;
  onReorder: (fromIndex: number, toIndex: number) => void;
  children: React.ReactNode;
}

export function DraggableTableHeader({
  column,
  index,
  onReorder,
  children,
}: DraggableTableHeaderProps) {
  const ref = useRef<HTMLTableCellElement>(null);

  const [{ isDragging }, drag, preview] = useDrag({
    type: COLUMN_DRAG_TYPE,
    item: { index, columnId: column.id },
    canDrag: !column.locked,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isOver }, drop] = useDrop({
    accept: COLUMN_DRAG_TYPE,
    canDrop: (item: DragItem) => {
      // Cannot drop into position 0 (reserved for locked column)
      return index !== 0 && item.index !== index;
    },
    drop: (item: DragItem) => {
      if (item.index !== index) {
        onReorder(item.index, index);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver() && monitor.canDrop(),
    }),
  });

  // Combine drag and drop refs
  drag(drop(ref));

  return (
    <th
      ref={ref}
      className={`
        relative
        transition-all duration-200
        ${isDragging ? 'opacity-60 scale-105 shadow-2xl z-50' : 'opacity-100'}
        ${isOver ? 'bg-primary/10' : ''}
        ${column.locked ? 'bg-muted/50' : 'hover:bg-muted cursor-grab active:cursor-grabbing'}
      `}
    >
      {/* Drop indicator */}
      {isOver && (
        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary z-10" />
      )}
      
      {/* Content wrapper */}
      <div className="flex items-center gap-2">
        {/* Drag handle or lock icon */}
        {column.locked ? (
          <Lock className="h-3 w-3 text-muted-foreground" />
        ) : (
          <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
        
        {/* Column content */}
        {children}
      </div>
    </th>
  );
}
```

**Checklist:**
- [ ] Create DraggableTableHeader component
- [ ] Implement drag & drop logic
- [ ] Add visual feedback (opacity, shadow, drop indicator)
- [ ] Handle locked column logic

---

### Step 2.4: Update ProjectTable Component
**File: `/components/ProjectTable.tsx`**

Integrate the new draggable headers:

```typescript
import { useColumnOrder } from '../hooks/useColumnOrder';
import { DraggableTableHeader } from './project-table/DraggableTableHeader';
import { useAuth } from '../contexts/AuthContext';

// Inside ProjectTable component
const { user } = useAuth();
const {
  columns,
  reorderColumn,
  resetToDefault,
  hasCustomOrder,
  isLoading: isLoadingColumns,
} = useColumnOrder(user?.id);

// Render table headers
<thead>
  <tr className="group">
    {columns.map((column, index) => (
      <DraggableTableHeader
        key={column.id}
        column={column}
        index={index}
        onReorder={reorderColumn}
      >
        {/* Existing header content based on column.id */}
        {renderColumnHeader(column)}
      </DraggableTableHeader>
    ))}
  </tr>
</thead>

// Helper function to render column content
function renderColumnHeader(column: TableColumn) {
  switch (column.id) {
    case 'projectName':
      return 'Project Name';
    case 'status':
      return 'Status';
    // ... etc
    default:
      return column.label;
  }
}

// Render table cells in same order
<tbody>
  {projects.map(project => (
    <tr key={project.id}>
      {columns.map(column => (
        <td key={column.id}>
          {renderColumnCell(column, project)}
        </td>
      ))}
    </tr>
  ))}
</tbody>
```

**Checklist:**
- [ ] Import and use useColumnOrder hook
- [ ] Replace static headers with DraggableTableHeader
- [ ] Update cell rendering to match column order
- [ ] Test drag & drop functionality

---

## Phase 3: Integration & Polish

### Step 3.1: Reset Button
**File: `/components/ProjectTable.tsx`**

Add reset button above table:

```typescript
import { RotateCcw } from 'lucide-react';
import { Button } from './ui/button';

// Above table, in header section
{hasCustomOrder && (
  <Button
    variant="outline"
    size="sm"
    onClick={resetToDefault}
    className="gap-2"
  >
    <RotateCcw className="h-4 w-4" />
    Reset Column Order
  </Button>
)}
```

**Checklist:**
- [ ] Add reset button (only show when hasCustomOrder)
- [ ] Style button appropriately
- [ ] Test reset functionality

---

### Step 3.2: Loading State
**File: `/components/ProjectTable.tsx`**

```typescript
if (isLoadingColumns) {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-96 w-full" />
    </div>
  );
}
```

**Checklist:**
- [ ] Add loading skeleton while columns load
- [ ] Ensure smooth transition to content

---

### Step 3.3: Accessibility
**File: `/components/project-table/DraggableTableHeader.tsx`**

Add keyboard support and ARIA attributes:

```typescript
<th
  ref={ref}
  role="columnheader"
  aria-label={column.locked ? `${column.label} (locked)` : `${column.label} (draggable)`}
  tabIndex={column.locked ? -1 : 0}
  onKeyDown={handleKeyDown}
  // ... other props
>

// Keyboard handler
const handleKeyDown = (e: React.KeyboardEvent) => {
  if (column.locked) return;
  
  switch (e.key) {
    case 'ArrowLeft':
      if (index > 1) onReorder(index, index - 1);
      break;
    case 'ArrowRight':
      if (index < totalColumns - 1) onReorder(index, index + 1);
      break;
  }
};
```

**Checklist:**
- [ ] Add ARIA labels
- [ ] Implement keyboard navigation
- [ ] Test with screen reader
- [ ] Add focus indicators

---

## Phase 4: Testing & Documentation

### Step 4.1: Manual Testing Checklist

**Drag & Drop:**
- [ ] Drag status column to position 3
- [ ] Drag deliverables to position 2
- [ ] Try to drag project name (should not work)
- [ ] Try to drag column to position 0 (should not work)
- [ ] Drag multiple columns rapidly

**Persistence:**
- [ ] Reorder columns
- [ ] Refresh page → order persists
- [ ] Logout and login → order persists
- [ ] Different user → different order

**Reset:**
- [ ] Click reset button
- [ ] Columns return to default order
- [ ] Reset button disappears
- [ ] Reorder again → button reappears

**Edge Cases:**
- [ ] Fast drag & drop (performance)
- [ ] Drag while scrolling
- [ ] Drag on different screen sizes
- [ ] Network offline (should still work locally)

---

### Step 4.2: Performance Testing

```typescript
// Add performance monitoring
console.time('Column reorder');
reorderColumn(fromIndex, toIndex);
console.timeEnd('Column reorder');
// Should be < 16ms for 60fps
```

**Checklist:**
- [ ] Reorder performance < 16ms
- [ ] No layout thrashing
- [ ] Smooth animations (60fps)
- [ ] No memory leaks

---

### Step 4.3: Documentation

**Create: `/planning/draggable-column/USER_GUIDE.md`**

Simple guide for users:
- How to reorder columns
- How to reset
- Keyboard shortcuts
- Limitations (locked columns)

**Checklist:**
- [ ] Create user guide
- [ ] Add screenshots/GIFs (optional)
- [ ] Update main documentation

---

## Implementation Timeline

### Day 1: Foundation (Phase 1)
- Morning: Types and utilities (Step 1.1, 1.2)
- Afternoon: Backend routes (Step 1.3)
- Evening: Custom hook (Step 1.4)

### Day 2: Drag & Drop (Phase 2)
- Morning: DnD setup and component (Step 2.1, 2.2, 2.3)
- Afternoon: ProjectTable integration (Step 2.4)
- Evening: Initial testing

### Day 3: Polish & Testing (Phase 3 & 4)
- Morning: Reset button, loading, accessibility (Step 3.1, 3.2, 3.3)
- Afternoon: Manual testing (Step 4.1, 4.2)
- Evening: Documentation (Step 4.3)

---

## Rollback Plan

If critical issues arise:

1. **Quick fix:** Comment out DraggableTableHeader, use static headers
2. **Database:** Column order stored separately, won't affect other data
3. **Hook:** Can return DEFAULT_TABLE_COLUMNS if hook fails
4. **User impact:** Minimal - reverts to default column order

---

## Post-Launch Enhancements (Future)

1. **Column Visibility Toggle** - Show/hide columns
2. **Column Width Adjustment** - Resize columns
3. **Saved Presets** - Multiple column layout presets
4. **Team Defaults** - Admin sets default for whole team
5. **Mobile Support** - (Low priority, mobile uses cards)

---

## Success Metrics

- [ ] 0 errors in console during drag & drop
- [ ] < 16ms reorder latency
- [ ] 100% persistence success rate
- [ ] Positive user feedback
- [ ] No regression in existing features
