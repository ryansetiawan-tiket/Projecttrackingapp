# Custom Group Order Feature - README

## 📚 Overview

The **Custom Group Order Feature** allows users to customize the display order of status and vertical groups in the Table view. This feature provides two independent ordering systems:

1. **Status Group Order** - Separate orderings for Active and Archive projects
2. **Vertical Group Order** - Single ordering for all verticals (default: alphabetical)

---

## 🎯 Key Features

### ✨ Status Group Order
- **Dual Ordering**: Separate custom orders for "Table" tab (Active) and "Archive" tab
- **Smart Defaults**: Workflow-based default order for active statuses
- **Auto-sync**: New statuses automatically append to end of list
- **Drag & Drop**: Intuitive reordering interface

### ✨ Vertical Group Order
- **Alphabetical Default**: Verticals sorted A-Z by default
- **Flexible Reordering**: Drag & drop to customize
- **Smart Insertion**: New verticals insert in alphabetical position
- **Quick Reset**: One-click reset to alphabetical order

---

## 🚀 Quick Start

### For End Users

#### **Customize Status Order**
1. Navigate to **Settings Page**
2. Scroll to **"Status Group Order"** section
3. You'll see two subsections:
   - **Active Projects Order** - for Table tab
   - **Archive Projects Order** - for Archive tab
4. Drag & drop items to reorder
5. Changes save automatically
6. Click **"Reset to Default"** to restore default order

#### **Customize Vertical Order**
1. Navigate to **Settings Page**
2. Scroll to **"Vertical Group Order"** section
3. Drag & drop items to reorder
4. Changes save automatically
5. Click **"Reset to Alphabetical"** to restore A-Z order

#### **View in Table**
1. Go to **Dashboard** → **Table View**
2. Set **Group by** to "Status" or "Vertical"
3. Groups will appear in your custom order

---

## 🏗️ Architecture

### **File Structure**

```
/utils
  └── groupOrderUtils.ts          # Core utilities and constants

/hooks
  ├── useStatusGroupOrder.ts      # Hook for status order management
  └── useVerticalGroupOrder.ts    # Hook for vertical order management

/components
  ├── DraggableOrderItem.tsx      # Reusable drag & drop item component
  ├── StatusGroupOrderManager.tsx # Status order manager UI
  ├── VerticalGroupOrderManager.tsx # Vertical order manager UI
  └── SettingsPage.tsx            # Integration point

/components/ProjectTable.tsx      # Consumes custom order for grouping
```

### **Database Schema**

```
KV Store Keys:
├── status_group_order_active   → string[] (status names for active tab)
├── status_group_order_archive  → string[] (status names for archive tab)
└── vertical_group_order        → string[] (vertical names)
```

---

## 💻 For Developers

### **Using the Hooks**

#### **useStatusGroupOrder**

```typescript
import { useStatusGroupOrder } from '../hooks/useStatusGroupOrder';

function MyComponent() {
  const {
    activeOrder,          // string[] - current active status order
    archiveOrder,         // string[] - current archive status order
    isLoading,            // boolean - loading state
    error,                // Error | null - error state
    updateActiveOrder,    // (newOrder: string[]) => Promise<void>
    updateArchiveOrder,   // (newOrder: string[]) => Promise<void>
    resetActiveOrder,     // () => Promise<void>
    resetArchiveOrder     // () => Promise<void>
  } = useStatusGroupOrder();

  // Use activeOrder for rendering, updateActiveOrder for changes
}
```

#### **useVerticalGroupOrder**

```typescript
import { useVerticalGroupOrder } from '../hooks/useVerticalGroupOrder';

function MyComponent() {
  const {
    verticalOrder,        // string[] - current vertical order
    isLoading,            // boolean - loading state
    error,                // Error | null - error state
    updateVerticalOrder,  // (newOrder: string[]) => Promise<void>
    resetVerticalOrder    // () => Promise<void>
  } = useVerticalGroupOrder();

  // Use verticalOrder for rendering, updateVerticalOrder for changes
}
```

---

### **Utility Functions**

#### **mergeOrderWithItems**

Merges saved order with currently available items. Handles added/deleted items intelligently.

```typescript
import { mergeOrderWithItems } from '../utils/groupOrderUtils';

const savedOrder = ['A', 'B', 'C'];
const availableItems = ['A', 'B', 'C', 'D', 'E'];

// For statuses (append new items to end)
const merged = mergeOrderWithItems(savedOrder, availableItems, false);
// Result: ['A', 'B', 'C', 'D', 'E']

// For verticals (sort new items alphabetically)
const merged = mergeOrderWithItems(savedOrder, availableItems, true);
// Result: ['A', 'B', 'C', 'D', 'E'] (alphabetically sorted: D, E)
```

#### **Database Operations**

```typescript
import { 
  saveStatusGroupOrder, 
  loadStatusGroupOrder,
  saveVerticalGroupOrder,
  loadVerticalGroupOrder
} from '../utils/groupOrderUtils';

// Save status order
await saveStatusGroupOrder('active', ['In Progress', 'In Review']);
await saveStatusGroupOrder('archive', ['Done', 'Canceled']);

// Load status order
const activeOrder = await loadStatusGroupOrder('active');
const archiveOrder = await loadStatusGroupOrder('archive');

// Save vertical order
await saveVerticalGroupOrder(['Brand', 'Creative', 'Marketing']);

// Load vertical order
const verticalOrder = await loadVerticalGroupOrder(['Brand', 'Creative', 'Marketing']);
```

---

### **Constants**

```typescript
import { 
  DEFAULT_ACTIVE_STATUS_ORDER,
  DEFAULT_ARCHIVE_STATUS_ORDER,
  GROUP_ORDER_KEYS
} from '../utils/groupOrderUtils';

// Default active status order
// ['In Progress', 'In Review', 'Lightroom', 'Not Started', 'Babysit', 'On Hold']

// Default archive status order
// ['Done', 'Canceled']

// Database keys
// {
//   STATUS_ACTIVE: 'status_group_order_active',
//   STATUS_ARCHIVE: 'status_group_order_archive',
//   VERTICALS: 'vertical_group_order'
// }
```

---

### **Grouping Projects**

Example of using custom order to group projects in ProjectTable:

```typescript
import { useStatusGroupOrder } from '../hooks/useStatusGroupOrder';

function ProjectTable() {
  const { activeOrder, archiveOrder } = useStatusGroupOrder();
  const currentTab = 'table'; // or 'archive'
  
  // Select appropriate order based on current tab
  const customOrder = currentTab === 'archive' ? archiveOrder : activeOrder;
  
  // Group projects
  const groupedProjects = useMemo(() => {
    return groupProjectsByStatus(projects, customOrder);
  }, [projects, customOrder]);
  
  // Render groups in order
  return (
    <div>
      {Array.from(groupedProjects.entries()).map(([status, projects]) => (
        <ProjectGroup key={status} status={status} projects={projects} />
      ))}
    </div>
  );
}

function groupProjectsByStatus(
  projects: Project[],
  customOrder: string[]
): Map<string, Project[]> {
  const groups = new Map<string, Project[]>();
  
  // Initialize groups in custom order
  customOrder.forEach(status => groups.set(status, []));
  
  // Assign projects to groups
  projects.forEach(project => {
    const status = project.status || "Not Started";
    if (!groups.has(status)) {
      groups.set(status, []);
    }
    groups.get(status)!.push(project);
  });
  
  // Sort ungrouped statuses alphabetically and append
  const ungroupedStatuses = Array.from(groups.keys())
    .filter(s => !customOrder.includes(s))
    .sort((a, b) => a.localeCompare(b));
  
  // Build final ordered map (only groups with projects)
  const orderedGroups = new Map<string, Project[]>();
  
  [...customOrder, ...ungroupedStatuses].forEach(status => {
    const projectsInGroup = groups.get(status) || [];
    if (projectsInGroup.length > 0) {
      orderedGroups.set(status, projectsInGroup);
    }
  });
  
  return orderedGroups;
}
```

---

## 🧩 Integration Points

### **Settings Page**

The feature integrates into `SettingsPage.tsx` as two new sections:

```tsx
import { StatusGroupOrderManager } from './StatusGroupOrderManager';
import { VerticalGroupOrderManager } from './VerticalGroupOrderManager';

function SettingsPage() {
  return (
    <div>
      {/* ... existing sections ... */}
      
      <Separator />
      <StatusGroupOrderManager />
      
      <Separator />
      <VerticalGroupOrderManager />
      
      {/* ... other sections ... */}
    </div>
  );
}
```

### **Project Table**

The feature modifies grouping logic in `ProjectTable.tsx`:

- When `groupBy === 'status'`: Uses `activeOrder` or `archiveOrder` depending on tab
- When `groupBy === 'vertical'`: Uses `verticalOrder`
- Groups appear in custom order
- Ungrouped items (not in custom order) appear at end, sorted alphabetically

---

## 🔄 Auto-Sync Behavior

### **When Status is Added**

```
User creates new status "Waiting for Client"
  ↓
Hook auto-detects new status (via useStatuses)
  ↓
Appends "Waiting for Client" to END of active order
  ↓
Auto-saves to database
  ↓
User can reorder it in Settings
```

### **When Status is Deleted**

```
User deletes status "Lightroom" (must not be used in any project)
  ↓
Hook auto-detects missing status
  ↓
Removes "Lightroom" from custom order
  ↓
Auto-saves updated order to database
  ↓
Other items maintain their relative order
```

### **When Vertical is Added**

```
User creates new vertical "Sales"
  ↓
Hook auto-detects new vertical
  ↓
Inserts "Sales" in ALPHABETICAL position
  ↓
Auto-saves to database
  ↓
Example: ['Brand', 'Creative', 'Marketing'] → ['Brand', 'Creative', 'Marketing', 'Sales']
```

### **When Vertical is Deleted**

```
User deletes vertical "Creative"
  ↓
Hook auto-detects missing vertical
  ↓
Removes "Creative" from custom order
  ↓
Auto-saves updated order to database
```

---

## 🎨 UI Components

### **DraggableOrderItem**

Reusable component for drag & drop list items.

**Props:**
```typescript
interface DraggableOrderItemProps {
  id: string;           // Unique identifier
  name: string;         // Display name
  index: number;        // Current position (0-based)
  color?: string;       // Optional color indicator
  onMove: (fromIndex: number, toIndex: number) => void;
}
```

**Features:**
- Drag handle icon
- Order number badge (1-based)
- Name label
- Optional color dot
- Hover states
- Dragging states

---

### **StatusGroupOrderManager**

Manager component for status order customization.

**Features:**
- Two subsections (Active / Archive)
- Drag & drop reordering
- Reset to default buttons
- Confirmation dialogs
- Loading states
- Empty states
- Toast notifications

---

### **VerticalGroupOrderManager**

Manager component for vertical order customization.

**Features:**
- Single vertical order list
- Drag & drop reordering
- Reset to alphabetical button
- Confirmation dialog
- Loading states
- Empty states
- Toast notifications

---

## 🧪 Testing

Comprehensive testing guide available at: [04-testing-guide.md](./04-testing-guide.md)

**Test Coverage:**
- ✅ Unit tests for utilities
- ✅ Integration tests for hooks
- ✅ Component tests
- ✅ E2E tests for user flows
- ✅ Edge case handling
- ✅ Cross-browser compatibility
- ✅ Mobile responsiveness
- ✅ Accessibility (keyboard, screen reader)
- ✅ Performance with large datasets

---

## 📖 Documentation

### **Planning Documents**

1. [00-overview.md](./00-overview.md) - Feature overview and scope
2. [01-ui-specifications.md](./01-ui-specifications.md) - UI design and components
3. [02-data-structures.md](./02-data-structures.md) - Data models and schemas
4. [03-implementation-plan.md](./03-implementation-plan.md) - Implementation phases
5. [04-testing-guide.md](./04-testing-guide.md) - Comprehensive testing procedures

---

## ❓ FAQ

### **Q: Can I have different orders for different users?**
A: Currently, order is stored globally in the database. Multi-user custom orders would require extending the data model to include user IDs.

### **Q: What happens if I delete a status that's in the custom order?**
A: The status is automatically removed from the custom order. Other statuses maintain their positions.

### **Q: Can I reorder statuses in the Table view directly?**
A: No, reordering must be done in Settings Page. This ensures intentional changes and prevents accidental reordering.

### **Q: Does this affect Timeline view?**
A: No, this feature only affects Table view grouping. Timeline view has its own chronological ordering.

### **Q: Does this affect Mobile view?**
A: Mobile view uses a different layout (card-based), but it respects the custom order when grouping is applied.

### **Q: What if I want to reset everything to default?**
A: Use the "Reset to Default" button in each subsection (Active, Archive) and the "Reset to Alphabetical" button for verticals.

### **Q: Can I export/import custom orders?**
A: Not currently supported. Orders are stored in the database and managed through the UI.

---

## 🐛 Troubleshooting

### **Order not saving**
- Check browser console for errors
- Verify database connection
- Check KV store permissions

### **New status not appearing**
- Refresh the page
- Check if status was created successfully in Status Manager
- Verify it's not filtered by archive/active logic

### **Drag & drop not working**
- Ensure JavaScript is enabled
- Try a different browser
- Check for console errors related to react-dnd

### **Performance issues with many items**
- Expected to handle 50+ items smoothly
- If experiencing lag, check browser performance tools
- Consider reducing number of statuses/verticals

---

## 🔮 Future Enhancements

Potential improvements for future versions:

- [ ] **Multi-user orders**: Per-user customization
- [ ] **Order presets**: Save and load different order configurations
- [ ] **Bulk operations**: Select multiple items to move together
- [ ] **Order templates**: Share custom orders across teams
- [ ] **Analytics**: Track which orders are most popular
- [ ] **Keyboard shortcuts**: Quick reordering with keyboard
- [ ] **Undo/Redo**: Revert accidental changes
- [ ] **Order history**: View past order changes

---

## 📞 Support

For issues or questions:
1. Check this README
2. Review planning documents in `/planning/custom-order-group/`
3. Check testing guide for common scenarios
4. Review console logs for errors
5. Contact development team

---

## 📜 License

Same license as parent project.

---

**Last Updated**: January 2025  
**Version**: 1.0.0  
**Status**: ✅ Planning Complete - Ready for Implementation
