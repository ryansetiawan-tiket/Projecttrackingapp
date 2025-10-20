# Custom Group Order Feature - Implementation Plan

## 🎯 Implementation Phases

---

## 📋 Phase 1: Foundation & Utilities

### **Step 1.1: Create Utility Functions**

**File**: `/utils/groupOrderUtils.ts`

```typescript
/**
 * Core utility functions for group ordering
 */

// Constants
export const DEFAULT_ACTIVE_STATUS_ORDER = [/* ... */];
export const DEFAULT_ARCHIVE_STATUS_ORDER = [/* ... */];
export const GROUP_ORDER_KEYS = {/* ... */};

// Merge algorithm
export function mergeOrderWithItems(/* ... */): string[] {/* ... */}

// Database operations
export async function saveStatusGroupOrder(/* ... */): Promise<void> {/* ... */}
export async function loadStatusGroupOrder(/* ... */): Promise<string[]> {/* ... */}
export async function saveVerticalGroupOrder(/* ... */): Promise<void> {/* ... */}
export async function loadVerticalGroupOrder(/* ... */): Promise<string[]> {/* ... */}

// Sync functions
export function syncStatusOrder(/* ... */): string[] {/* ... */}
export function syncVerticalOrder(/* ... */): string[] {/* ... */}

// Validation
export function validateStatusOrder(order: unknown): order is string[] {/* ... */}
export function validateVerticalOrder(order: unknown): order is string[] {/* ... */}
```

**Dependencies:**
- None (pure utility functions)

**Testing:**
- Unit test `mergeOrderWithItems` with various scenarios
- Unit test validation functions
- Unit test sync functions

---

### **Step 1.2: Create Custom Hooks**

#### **File**: `/hooks/useStatusGroupOrder.ts`

```typescript
import { useState, useEffect } from 'react';
import { useStatuses } from './useStatuses';
import * as groupOrderUtils from '../utils/groupOrderUtils';

export function useStatusGroupOrder() {
  const { statuses } = useStatuses();
  const [activeOrder, setActiveOrder] = useState<string[]>([]);
  const [archiveOrder, setArchiveOrder] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Load initial orders from database
  useEffect(() => {
    const loadOrders = async () => {
      try {
        setIsLoading(true);
        const [active, archive] = await Promise.all([
          groupOrderUtils.loadStatusGroupOrder('active'),
          groupOrderUtils.loadStatusGroupOrder('archive')
        ]);
        setActiveOrder(active);
        setArchiveOrder(archive);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };
    loadOrders();
  }, []);

  // Auto-sync when available statuses change
  useEffect(() => {
    if (statuses.length > 0 && !isLoading) {
      const statusNames = statuses.map(s => s.name);
      const syncedActive = groupOrderUtils.syncStatusOrder(
        activeOrder,
        statusNames,
        false
      );
      const syncedArchive = groupOrderUtils.syncStatusOrder(
        archiveOrder,
        statusNames,
        true
      );
      
      if (JSON.stringify(syncedActive) !== JSON.stringify(activeOrder)) {
        setActiveOrder(syncedActive);
        groupOrderUtils.saveStatusGroupOrder('active', syncedActive);
      }
      if (JSON.stringify(syncedArchive) !== JSON.stringify(archiveOrder)) {
        setArchiveOrder(syncedArchive);
        groupOrderUtils.saveStatusGroupOrder('archive', syncedArchive);
      }
    }
  }, [statuses, isLoading]);

  const updateActiveOrder = async (newOrder: string[]) => {
    setActiveOrder(newOrder);
    await groupOrderUtils.saveStatusGroupOrder('active', newOrder);
  };

  const updateArchiveOrder = async (newOrder: string[]) => {
    setArchiveOrder(newOrder);
    await groupOrderUtils.saveStatusGroupOrder('archive', newOrder);
  };

  const resetActiveOrder = async () => {
    const defaultOrder = groupOrderUtils.DEFAULT_ACTIVE_STATUS_ORDER;
    setActiveOrder(defaultOrder);
    await groupOrderUtils.saveStatusGroupOrder('active', defaultOrder);
  };

  const resetArchiveOrder = async () => {
    const defaultOrder = groupOrderUtils.DEFAULT_ARCHIVE_STATUS_ORDER;
    setArchiveOrder(defaultOrder);
    await groupOrderUtils.saveStatusGroupOrder('archive', defaultOrder);
  };

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

**Dependencies:**
- `useStatuses` hook (existing)
- `groupOrderUtils` utility

**Testing:**
- Test initial load from database
- Test auto-sync when statuses change
- Test update functions
- Test reset functions

---

#### **File**: `/hooks/useVerticalGroupOrder.ts`

```typescript
import { useState, useEffect } from 'react';
import { useVerticals } from './useVerticals';
import * as groupOrderUtils from '../utils/groupOrderUtils';

export function useVerticalGroupOrder() {
  const { verticals } = useVerticals();
  const [verticalOrder, setVerticalOrder] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Load initial order from database
  useEffect(() => {
    const loadOrder = async () => {
      try {
        setIsLoading(true);
        const verticalNames = verticals.map(v => v.name);
        const order = await groupOrderUtils.loadVerticalGroupOrder(verticalNames);
        setVerticalOrder(order);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };
    loadOrder();
  }, []);

  // Auto-sync when available verticals change
  useEffect(() => {
    if (verticals.length > 0 && !isLoading) {
      const verticalNames = verticals.map(v => v.name);
      const synced = groupOrderUtils.syncVerticalOrder(
        verticalOrder,
        verticalNames
      );
      
      if (JSON.stringify(synced) !== JSON.stringify(verticalOrder)) {
        setVerticalOrder(synced);
        groupOrderUtils.saveVerticalGroupOrder(synced);
      }
    }
  }, [verticals, isLoading]);

  const updateVerticalOrder = async (newOrder: string[]) => {
    setVerticalOrder(newOrder);
    await groupOrderUtils.saveVerticalGroupOrder(newOrder);
  };

  const resetVerticalOrder = async () => {
    const verticalNames = verticals.map(v => v.name);
    const alphabetical = [...verticalNames].sort((a, b) => a.localeCompare(b));
    setVerticalOrder(alphabetical);
    await groupOrderUtils.saveVerticalGroupOrder(alphabetical);
  };

  return {
    verticalOrder,
    isLoading,
    error,
    updateVerticalOrder,
    resetVerticalOrder
  };
}
```

**Dependencies:**
- `useVerticals` hook (existing)
- `groupOrderUtils` utility

**Testing:**
- Test initial load from database
- Test auto-sync when verticals change
- Test update functions
- Test reset to alphabetical

---

## 📋 Phase 2: UI Components

### **Step 2.1: Create Draggable Item Component**

**File**: `/components/DraggableOrderItem.tsx`

```typescript
import { useDrag, useDrop } from 'react-dnd';
import { GripVertical } from 'lucide-react';

interface DraggableOrderItemProps {
  id: string;
  name: string;
  index: number;
  color?: string;
  onMove: (fromIndex: number, toIndex: number) => void;
}

export function DraggableOrderItem({
  id,
  name,
  index,
  color,
  onMove
}: DraggableOrderItemProps) {
  const [{ isDragging }, drag, preview] = useDrag({
    type: 'ORDER_ITEM',
    item: { id, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  });

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: 'ORDER_ITEM',
    hover: (item: { id: string; index: number }) => {
      if (item.index !== index) {
        onMove(item.index, index);
        item.index = index;
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop()
    })
  });

  return (
    <div
      ref={(node) => drag(drop(node))}
      className={`
        flex items-center gap-3 p-3 bg-card border rounded-lg 
        hover:bg-accent/50 transition-colors group cursor-move
        ${isDragging ? 'opacity-50' : ''}
        ${isOver && canDrop ? 'border-primary border-2 bg-primary/5' : ''}
      `}
    >
      <GripVertical className="h-4 w-4 text-muted-foreground" />
      
      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium">
        {index + 1}
      </div>
      
      <div className="flex-1 text-sm font-medium">
        {name}
      </div>
      
      {color && (
        <div 
          className="w-3 h-3 rounded-full border" 
          style={{ backgroundColor: color }}
        />
      )}
    </div>
  );
}
```

**Dependencies:**
- `react-dnd` (already used in project)
- Lucide icons

**Testing:**
- Test drag & drop interaction
- Test visual states (dragging, hover)
- Test onMove callback

---

### **Step 2.2: Create Status Group Order Manager**

**File**: `/components/StatusGroupOrderManager.tsx`

```typescript
import { useState, useCallback } from 'react';
import { useStatusGroupOrder } from '../hooks/useStatusGroupOrder';
import { useStatuses } from '../hooks/useStatuses';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { DraggableOrderItem } from './DraggableOrderItem';
import { Skeleton } from './ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { toast } from 'sonner@2.0.3';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

export function StatusGroupOrderManager() {
  const { statuses } = useStatuses();
  const {
    activeOrder,
    archiveOrder,
    isLoading,
    updateActiveOrder,
    updateArchiveOrder,
    resetActiveOrder,
    resetArchiveOrder
  } = useStatusGroupOrder();

  const [showResetActiveDialog, setShowResetActiveDialog] = useState(false);
  const [showResetArchiveDialog, setShowResetArchiveDialog] = useState(false);

  // Get status color by name
  const getStatusColor = (statusName: string) => {
    const status = statuses.find(s => s.name === statusName);
    return status?.color;
  };

  // Handle reorder for active statuses
  const handleMoveActive = useCallback((fromIndex: number, toIndex: number) => {
    const newOrder = [...activeOrder];
    const [moved] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, moved);
    updateActiveOrder(newOrder);
  }, [activeOrder, updateActiveOrder]);

  // Handle reorder for archive statuses
  const handleMoveArchive = useCallback((fromIndex: number, toIndex: number) => {
    const newOrder = [...archiveOrder];
    const [moved] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, moved);
    updateArchiveOrder(newOrder);
  }, [archiveOrder, updateArchiveOrder]);

  // Handle reset active
  const handleResetActive = async () => {
    await resetActiveOrder();
    toast.success('Active status order reset to default');
    setShowResetActiveDialog(false);
  };

  // Handle reset archive
  const handleResetArchive = async () => {
    await resetArchiveOrder();
    toast.success('Archive status order reset to default');
    setShowResetArchiveDialog(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">Status Group Order</h3>
          <p className="text-sm text-muted-foreground">
            Customize the order of status groups in Table view. 
            Active and Archive tabs have separate orderings.
          </p>
        </div>

        {/* Active Projects Order */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span>Active Projects Order</span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowResetActiveDialog(true)}
              >
                Reset to Default
              </Button>
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              These statuses appear in the "Table" tab (non-archive projects)
            </p>
          </CardHeader>
          
          <CardContent className="space-y-2">
            {activeOrder.length > 0 ? (
              activeOrder.map((statusName, index) => (
                <DraggableOrderItem
                  key={statusName}
                  id={statusName}
                  name={statusName}
                  index={index}
                  color={getStatusColor(statusName)}
                  onMove={handleMoveActive}
                />
              ))
            ) : (
              <div className="p-8 text-center text-sm text-muted-foreground">
                <p>No active statuses found.</p>
                <p className="mt-2">Create statuses in Status Manager to customize order.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Archive Projects Order */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span>Archive Projects Order</span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowResetArchiveDialog(true)}
              >
                Reset to Default
              </Button>
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              These statuses appear in the "Archive" tab
            </p>
          </CardHeader>
          
          <CardContent className="space-y-2">
            {archiveOrder.length > 0 ? (
              archiveOrder.map((statusName, index) => (
                <DraggableOrderItem
                  key={statusName}
                  id={statusName}
                  name={statusName}
                  index={index}
                  color={getStatusColor(statusName)}
                  onMove={handleMoveArchive}
                />
              ))
            ) : (
              <div className="p-8 text-center text-sm text-muted-foreground">
                <p>No archive statuses found.</p>
                <p className="mt-2">"Done" and "Canceled" are default archive statuses.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reset Active Dialog */}
        <AlertDialog open={showResetActiveDialog} onOpenChange={setShowResetActiveDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reset to Default Order?</AlertDialogTitle>
              <AlertDialogDescription>
                This will restore the default active status order. Your custom order will be lost.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleResetActive}>
                Reset
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Reset Archive Dialog */}
        <AlertDialog open={showResetArchiveDialog} onOpenChange={setShowResetArchiveDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reset to Default Order?</AlertDialogTitle>
              <AlertDialogDescription>
                This will restore the default archive status order. Your custom order will be lost.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleResetArchive}>
                Reset
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DndProvider>
  );
}
```

**Dependencies:**
- `useStatusGroupOrder` hook
- `useStatuses` hook
- `DraggableOrderItem` component
- ShadCN UI components

**Testing:**
- Test drag & drop reordering
- Test reset functionality
- Test empty states
- Test loading states

---

### **Step 2.3: Create Vertical Group Order Manager**

**File**: `/components/VerticalGroupOrderManager.tsx`

```typescript
import { useState, useCallback } from 'react';
import { useVerticalGroupOrder } from '../hooks/useVerticalGroupOrder';
import { useVerticals } from '../hooks/useVerticals';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { DraggableOrderItem } from './DraggableOrderItem';
import { Skeleton } from './ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { toast } from 'sonner@2.0.3';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

export function VerticalGroupOrderManager() {
  const { verticals } = useVerticals();
  const {
    verticalOrder,
    isLoading,
    updateVerticalOrder,
    resetVerticalOrder
  } = useVerticalGroupOrder();

  const [showResetDialog, setShowResetDialog] = useState(false);

  // Get vertical color by name
  const getVerticalColor = (verticalName: string) => {
    const vertical = verticals.find(v => v.name === verticalName);
    return vertical?.color;
  };

  // Handle reorder
  const handleMove = useCallback((fromIndex: number, toIndex: number) => {
    const newOrder = [...verticalOrder];
    const [moved] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, moved);
    updateVerticalOrder(newOrder);
  }, [verticalOrder, updateVerticalOrder]);

  // Handle reset
  const handleReset = async () => {
    await resetVerticalOrder();
    toast.success('Vertical order reset to alphabetical');
    setShowResetDialog(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium">Vertical Group Order</h3>
          <p className="text-sm text-muted-foreground">
            Customize the order of vertical groups when grouping by Vertical in Table view.
            Default order is alphabetical (A-Z).
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span>Vertical Order</span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowResetDialog(true)}
              >
                Reset to Alphabetical
              </Button>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-2">
            {verticalOrder.length > 0 ? (
              verticalOrder.map((verticalName, index) => (
                <DraggableOrderItem
                  key={verticalName}
                  id={verticalName}
                  name={verticalName}
                  index={index}
                  color={getVerticalColor(verticalName)}
                  onMove={handleMove}
                />
              ))
            ) : (
              <div className="p-8 text-center text-sm text-muted-foreground">
                <p>No verticals found.</p>
                <p className="mt-2">Create verticals in Type & Vertical Management to customize order.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reset Dialog */}
        <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reset to Alphabetical Order?</AlertDialogTitle>
              <AlertDialogDescription>
                This will sort verticals alphabetically (A-Z). Your custom order will be lost.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleReset}>
                Reset
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DndProvider>
  );
}
```

**Dependencies:**
- `useVerticalGroupOrder` hook
- `useVerticals` hook
- `DraggableOrderItem` component
- ShadCN UI components

**Testing:**
- Test drag & drop reordering
- Test reset to alphabetical
- Test empty states
- Test loading states

---

### **Step 2.4: Integrate to Settings Page**

**File**: `/components/SettingsPage.tsx` (modify existing)

```typescript
// Add imports
import { StatusGroupOrderManager } from './StatusGroupOrderManager';
import { VerticalGroupOrderManager } from './VerticalGroupOrderManager';

// In the render, add sections after TableColumnOrderManager:

{/* Table Column Order - Existing */}
<TableColumnOrderManager />

{/* Status Group Order - NEW */}
<Separator />
<StatusGroupOrderManager />

{/* Vertical Group Order - NEW */}
<Separator />
<VerticalGroupOrderManager />
```

**Testing:**
- Verify sections appear in correct order
- Verify responsive layout
- Verify no conflicts with existing sections

---

## 📋 Phase 3: Table Integration

### **Step 3.1: Modify ProjectTable Grouping Logic**

**File**: `/components/ProjectTable.tsx` (modify existing)

```typescript
import { useStatusGroupOrder } from '../hooks/useStatusGroupOrder';
import { useVerticalGroupOrder } from '../hooks/useVerticalGroupOrder';

export function ProjectTable() {
  const { activeOrder, archiveOrder } = useStatusGroupOrder();
  const { verticalOrder } = useVerticalGroupOrder();
  
  // Existing code...
  
  // Modify grouping logic
  const groupedProjects = useMemo(() => {
    if (groupBy === 'status') {
      const customOrder = currentTab === 'archive' ? archiveOrder : activeOrder;
      return groupProjectsByStatus(filteredProjects, customOrder);
    } else if (groupBy === 'vertical') {
      return groupProjectsByVertical(filteredProjects, verticalOrder);
    }
    // ... other groupBy options
  }, [filteredProjects, groupBy, activeOrder, archiveOrder, verticalOrder, currentTab]);
  
  // Rest of component...
}
```

**Helper Functions** (add to ProjectTable.tsx or separate utils):

```typescript
function groupProjectsByStatus(
  projects: Project[],
  customOrder: string[]
): Map<string, Project[]> {
  const groups = new Map<string, Project[]>();
  
  // Initialize groups in custom order
  customOrder.forEach(status => {
    groups.set(status, []);
  });
  
  // Assign projects to groups
  projects.forEach(project => {
    const status = project.status || "Not Started";
    if (!groups.has(status)) {
      groups.set(status, []);
    }
    groups.get(status)!.push(project);
  });
  
  // Find ungrouped statuses and sort alphabetically
  const ungroupedStatuses = Array.from(groups.keys())
    .filter(status => !customOrder.includes(status))
    .sort((a, b) => a.localeCompare(b));
  
  // Build final ordered map
  const orderedGroups = new Map<string, Project[]>();
  
  // Add custom ordered groups (only if they have projects)
  customOrder.forEach(status => {
    const projectsInGroup = groups.get(status) || [];
    if (projectsInGroup.length > 0) {
      orderedGroups.set(status, projectsInGroup);
    }
  });
  
  // Add ungrouped statuses at the end
  ungroupedStatuses.forEach(status => {
    const projectsInGroup = groups.get(status) || [];
    if (projectsInGroup.length > 0) {
      orderedGroups.set(status, projectsInGroup);
    }
  });
  
  return orderedGroups;
}

function groupProjectsByVertical(
  projects: Project[],
  customOrder: string[]
): Map<string, Project[]> {
  // Same logic as groupProjectsByStatus
  const groups = new Map<string, Project[]>();
  
  customOrder.forEach(vertical => {
    groups.set(vertical, []);
  });
  
  projects.forEach(project => {
    const vertical = project.vertical || "Uncategorized";
    if (!groups.has(vertical)) {
      groups.set(vertical, []);
    }
    groups.get(vertical)!.push(project);
  });
  
  const ungroupedVerticals = Array.from(groups.keys())
    .filter(vertical => !customOrder.includes(vertical))
    .sort((a, b) => a.localeCompare(b));
  
  const orderedGroups = new Map<string, Project[]>();
  
  customOrder.forEach(vertical => {
    const projectsInGroup = groups.get(vertical) || [];
    if (projectsInGroup.length > 0) {
      orderedGroups.set(vertical, projectsInGroup);
    }
  });
  
  ungroupedVerticals.forEach(vertical => {
    const projectsInGroup = groups.get(vertical) || [];
    if (projectsInGroup.length > 0) {
      orderedGroups.set(vertical, projectsInGroup);
    }
  });
  
  return orderedGroups;
}
```

**Testing:**
- Test groups appear in custom order
- Test new status appears at end
- Test deleted status doesn't break rendering
- Test switching between active/archive tabs
- Test switching between groupBy options

---

## 📋 Phase 4: Testing & Polish

### **Step 4.1: End-to-End Testing**

**Test Scenarios:**

1. **First Time User**
   - Default orders are applied
   - No errors in console
   - Groups appear in default order

2. **Drag & Drop Reordering**
   - Smooth animation
   - Correct final order
   - Auto-save works
   - Changes reflected in Table view immediately

3. **Reset to Default**
   - Confirmation dialog appears
   - Default order restored
   - Changes reflected in Table view

4. **Add New Status**
   - New status appears at end of active list
   - Can be reordered
   - Order persists after refresh

5. **Delete Status**
   - Deleted status removed from order
   - No visual glitches
   - Order remains stable

6. **Add New Vertical**
   - New vertical appears in alphabetical position
   - Can be reordered
   - Order persists after refresh

7. **Cross-Browser Testing**
   - Chrome ✅
   - Firefox ✅
   - Safari ✅
   - Edge ✅

8. **Mobile Testing**
   - Touch drag & drop works
   - Layout is responsive
   - Buttons are tappable

---

### **Step 4.2: Performance Optimization**

**Optimizations:**

1. **Memoization**
   ```typescript
   const groupedProjects = useMemo(() => {
     return groupProjectsByStatus(projects, customOrder);
   }, [projects, customOrder]);
   ```

2. **Debounce Auto-save** (if needed)
   ```typescript
   const debouncedSave = useMemo(
     () => debounce(saveStatusGroupOrder, 500),
     []
   );
   ```

3. **Lazy Load Managers**
   ```typescript
   const StatusGroupOrderManager = lazy(() => 
     import('./StatusGroupOrderManager')
   );
   ```

---

### **Step 4.3: Documentation**

Create `/planning/custom-order-group/README.md`:

```markdown
# Custom Group Order Feature

## Quick Start

### For Users
1. Go to Settings Page
2. Find "Status Group Order" section
3. Drag & drop to reorder
4. Changes auto-save

### For Developers
- Hooks: `useStatusGroupOrder`, `useVerticalGroupOrder`
- Utils: `groupOrderUtils.ts`
- Components: `StatusGroupOrderManager`, `VerticalGroupOrderManager`

## Database Keys
- `status_group_order_active`
- `status_group_order_archive`
- `vertical_group_order`

## Testing
See `03-implementation-plan.md` for test scenarios
```

---

## 📦 Deliverables Checklist

### **Phase 1: Foundation**
- [ ] `groupOrderUtils.ts` created with all functions
- [ ] `useStatusGroupOrder.ts` hook created and tested
- [ ] `useVerticalGroupOrder.ts` hook created and tested
- [ ] Unit tests written for utilities

### **Phase 2: UI Components**
- [ ] `DraggableOrderItem.tsx` component created
- [ ] `StatusGroupOrderManager.tsx` component created
- [ ] `VerticalGroupOrderManager.tsx` component created
- [ ] Integrated to `SettingsPage.tsx`
- [ ] UI components tested

### **Phase 3: Table Integration**
- [ ] `ProjectTable.tsx` modified to use custom order
- [ ] `groupProjectsByStatus` function implemented
- [ ] `groupProjectsByVertical` function implemented
- [ ] Table integration tested

### **Phase 4: Testing & Polish**
- [ ] All end-to-end scenarios tested
- [ ] Performance optimizations applied
- [ ] Documentation created
- [ ] Code reviewed

---

## 🚀 Deployment Strategy

1. **Feature Flag** (optional)
   - Enable for admin users first
   - Gradual rollout to all users

2. **Migration**
   - No data migration needed (new feature)
   - Default values used for existing users

3. **Monitoring**
   - Track database save errors
   - Monitor drag & drop performance
   - Collect user feedback

---

**Next Document**: [04-testing-guide.md](./04-testing-guide.md)
