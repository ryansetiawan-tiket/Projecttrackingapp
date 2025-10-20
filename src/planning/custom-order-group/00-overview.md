# Custom Group Order Feature - Overview

## 📋 Feature Summary

Implementasi fitur custom ordering untuk group sections di ProjectTable (Table View) yang memungkinkan user mengatur urutan tampilan group baik untuk **Group by Status** maupun **Group by Vertical**.

---

## 🎯 Goals

1. **Flexible Group Ordering**: User dapat mengatur urutan tampilan group sesuai preferensi workflow mereka
2. **Persistent Settings**: Custom order disimpan ke database dan sync across sessions
3. **Smart Defaults**: Sistem memiliki default order yang masuk akal untuk user baru
4. **Auto-sync**: Handle penambahan/penghapusan status atau vertical dengan intelligent behavior
5. **Easy Management**: Interface drag & drop yang intuitif di Settings Page

---

## 📊 Scope

### **In Scope**

✅ **Status Group Order** (Group by Status)
- Dua set ordering terpisah: Active Projects & Archive Projects
- Default order untuk Active: In Progress, In Review, Lightroom, Not Started, Babysit, On Hold
- Default order untuk Archive: Done, Canceled
- Drag & drop reorder interface di Settings
- Reset to default functionality

✅ **Vertical Group Order** (Group by Vertical)
- Single ordering untuk semua vertical
- Default order: Alphabetical (A-Z)
- Drag & drop reorder interface di Settings
- Reset to default functionality

✅ **Database Integration**
- Persistent storage via KV store
- Keys: `status_group_order_active`, `status_group_order_archive`, `vertical_group_order`
- Auto-sync dengan perubahan di StatusManager/VerticalManager

✅ **Settings Page Integration**
- New section: "Status Group Order" dengan 2 subsections
- New section: "Vertical Group Order"
- Consistent UI dengan existing "Table Column Order" section

### **Out of Scope**

❌ Group ordering untuk Timeline view (hanya untuk Table view)
❌ Group ordering untuk Mobile view (mobile uses different UI pattern)
❌ Custom grouping rules (hanya order, bukan grouping logic)
❌ Group color customization (separate feature)

---

## 🔄 User Flow

### **Status Group Order Management**

```
User → Settings Page 
  → Scroll to "Status Group Order" section
  → See 2 subsections: "Active Projects Order" & "Archive Projects Order"
  → Drag & drop status items to reorder
  → Click "Reset to Default" if needed
  → Changes auto-save
  → Go to Dashboard → Table View → Group by Status
  → See groups in custom order
```

### **Vertical Group Order Management**

```
User → Settings Page 
  → Scroll to "Vertical Group Order" section
  → Drag & drop vertical items to reorder
  → Click "Reset to Default" (alphabetical)
  → Changes auto-save
  → Go to Dashboard → Table View → Group by Vertical
  → See groups in custom order
```

---

## 🏗️ Architecture Overview

### **Component Structure**

```
SettingsPage.tsx
├── StatusGroupOrderManager.tsx (NEW)
│   ├── ActiveProjectsOrderEditor (internal)
│   └── ArchiveProjectsOrderEditor (internal)
└── VerticalGroupOrderManager.tsx (NEW)
    └── VerticalOrderEditor (internal)

ProjectTable.tsx
├── Uses custom order from hooks
└── Renders ProjectGroup in custom order

Hooks:
├── useStatusGroupOrder.ts (NEW)
└── useVerticalGroupOrder.ts (NEW)

Utils:
└── groupOrderUtils.ts (NEW)
```

### **Data Flow**

```
Database (KV Store)
    ↓
Custom Hooks (useStatusGroupOrder, useVerticalGroupOrder)
    ↓
Settings Page (drag & drop management)
    ↑↓
ProjectTable.tsx (render groups in order)
```

---

## 📦 Default Values

### **Status Group Order - Active**
```typescript
DEFAULT_ACTIVE_STATUS_ORDER = [
  "In Progress",
  "In Review", 
  "Lightroom",
  "Not Started",
  "Babysit",
  "On Hold"
]
```

### **Status Group Order - Archive**
```typescript
DEFAULT_ARCHIVE_STATUS_ORDER = [
  "Done",
  "Canceled"
]
```

### **Vertical Group Order**
```typescript
// Alphabetical by vertical name (A-Z)
// Computed dynamically from VerticalManager
```

---

## 🔧 Technical Decisions

### **1. Why Separate Active/Archive Status Orders?**
- Different use cases: Active projects need workflow-based order, Archive needs outcome-based order
- Prevents mixing "Done" with "In Progress" in same list
- Cleaner UX: each tab has its own logical order

### **2. Why Alphabetical Default for Verticals?**
- Verticals are business units/categories (predictable, doesn't change often)
- Alphabetical is universal, language-agnostic sorting
- Easy mental model for new users

### **3. Why Auto-append New Items to End?**
- **Status**: New status is usually experimental, user should explicitly place it
- **Vertical**: New vertical auto-sorted alphabetically maintains consistency

### **4. Why Not Delete from Order List When Item Deleted?**
- Prevents data loss if user accidentally deletes then recreates
- Order list is source of truth, actual items come from managers
- Orphaned items in order list are harmless (filtered out on render)

---

## 🧪 Testing Strategy

### **Unit Tests**
- `groupOrderUtils.ts`: sorting logic, merge logic, reset logic
- Custom hooks: data fetching, saving, default generation

### **Integration Tests**
- Settings Page: drag & drop, save, reset
- ProjectTable: correct group order rendering
- Sync: add/delete status/vertical → order list updates correctly

### **Manual Tests**
- Create new status → appears at end of active list
- Create new vertical → appears in alphabetical position
- Delete status (not in use) → removed from order list
- Reset to default → correct default order restored
- Drag & drop → visual feedback, correct save

---

## 📝 Implementation Phases

### **Phase 1: Data Layer** ✅
- Create `groupOrderUtils.ts`
- Create `useStatusGroupOrder.ts` hook
- Create `useVerticalGroupOrder.ts` hook
- Database schema setup

### **Phase 2: Settings UI** ✅
- Create `StatusGroupOrderManager.tsx`
- Create `VerticalGroupOrderManager.tsx`
- Integrate to `SettingsPage.tsx`

### **Phase 3: Table Integration** ✅
- Modify `ProjectTable.tsx` to use custom order
- Update `ProjectGroup.tsx` rendering logic
- Handle edge cases (missing items, new items)

### **Phase 4: Testing & Polish** ✅
- End-to-end testing
- Edge case handling
- Performance optimization
- Documentation

---

## 🚨 Edge Cases to Handle

1. **Status/Vertical not in order list**
   - Solution: Append to end, sorted alphabetically
   
2. **Order list contains deleted items**
   - Solution: Filter out non-existent items on render
   
3. **User has old localStorage data**
   - Solution: Migration handled by existing settings migration system
   
4. **Empty order list in database**
   - Solution: Use default order
   
5. **Concurrent edits (multiple tabs)**
   - Solution: Last write wins (acceptable for settings)

6. **Status used in projects cannot be deleted**
   - Solution: Already handled by StatusManager, no special case needed

---

## 📚 Related Features

- **Table Column Order**: Similar drag & drop UI pattern
- **Status Manager**: Source of truth for available statuses
- **Vertical Manager**: Source of truth for available verticals
- **Group by functionality**: Existing grouping logic in ProjectTable
- **Settings Migration**: Existing localStorage → database migration

---

## ✅ Success Criteria

- [ ] User can reorder status groups for Active projects
- [ ] User can reorder status groups for Archive projects
- [ ] User can reorder vertical groups
- [ ] Custom order persists across sessions
- [ ] Reset to default works correctly
- [ ] New status/vertical appears in correct position
- [ ] Deleted items don't break the order
- [ ] UI is consistent with existing Settings sections
- [ ] Drag & drop is smooth and provides visual feedback
- [ ] Changes are reflected immediately in Table view

---

**Next Document**: [01-ui-specifications.md](./01-ui-specifications.md)
