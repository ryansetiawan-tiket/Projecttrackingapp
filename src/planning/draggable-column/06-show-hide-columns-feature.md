# Show/Hide Columns Feature - v2.5.0

## Overview
Fitur untuk show/hide kolom di table view yang terintegrasi dengan Table Column Order Manager di Settings → App Settings tab.

## Implementation Date
October 19, 2025

## Features Implemented

### 1. **Toggle Visibility UI**
- Switch toggle untuk setiap kolom di TableColumnOrderManager
- Eye/EyeOff icon indicator
- "Hidden" badge untuk kolom yang tersembunyi
- Smooth transition dan visual feedback

### 2. **Business Rules**
- ✅ Kolom "Project" tidak bisa di-hide (locked)
- ✅ Minimal 1 kolom harus visible (selain Project)
- ✅ Admin-only feature
- ✅ Auto-save ke database
- ✅ Real-time reflection di table view

### 3. **Database Integration**
- Backend endpoint updated untuk save/load visibility state
- Data structure: `columnVisibility: Record<TableColumnId, boolean>`
- Backward compatibility maintained

## Technical Changes

### Files Modified

#### 1. `/utils/columnOrderUtils.ts`
```typescript
// New functions added:
- toggleColumnVisibility(columns, columnId) → TableColumn[]
- getColumnVisibility(columns) → Record<TableColumnId, boolean>

// Updated functions:
- applyColumnOrder(savedOrder, savedVisibility?) → TableColumn[]
```

#### 2. `/supabase/functions/server/index.tsx`
```typescript
// GET /table-column-order
- Returns: { columnOrder, columnVisibility }

// PUT /table-column-order
- Accepts: { columnOrder, columnVisibility }
- Saves both to KV store
```

#### 3. `/hooks/useColumnOrder.ts`
```typescript
// New exports:
- toggleVisibility(columnId) → void

// Updated:
- saveColumnOrder accepts visibility parameter
- loadColumnOrder applies visibility settings
```

#### 4. `/components/TableColumnOrderManager.tsx`
**New UI Elements:**
- Switch component untuk toggle visibility
- Eye/EyeOff icons
- "Hidden" badge untuk kolom tersembunyi
- Opacity 50% untuk item yang hidden

**New Functions:**
- handleToggleVisibility(columnId)

**Updated:**
- DraggableColumnItem props (added onToggleVisibility, isAdmin)
- Help text description
- CardDescription

#### 5. `/components/ProjectTable.tsx`
```typescript
// New:
const visibleColumns = columns.filter(col => col.visible);

// Updated:
- Table header renders visibleColumns instead of columns
- ProjectTableRow receives visibleColumns as prop
```

#### 6. `/components/project-table/renderProjectRow.tsx`
- Already supports dynamic columns via props
- No changes needed (already implemented in v2.4.0)

## User Flow

### Admin User:
1. Navigate to Settings → App Settings
2. Scroll to "Table Column Order" section
3. See list of all columns with visibility toggles
4. Click Switch to hide/show column
5. Changes save automatically
6. Go to Dashboard → Table view
7. See columns updated immediately

### Non-Admin User:
1. Can view column order manager (read-only)
2. Cannot modify visibility
3. Sees current visibility state set by admin

## Validation Rules

### Frontend:
```typescript
// Cannot hide locked column (Project)
if (column.locked) {
  toast.error('Cannot hide the Project column');
  return;
}

// Cannot hide if last visible column
const visibleCount = columns.filter(col => col.visible).length;
if (visibleCount <= 2 && column.visible) {
  toast.error('At least one column must be visible');
  return;
}
```

### Backend:
- Validates columnVisibility is object (if provided)
- Preserves existing visibility if not provided
- No breaking changes for existing implementations

## UI/UX Enhancements

### Visual Indicators:
1. **Visible State:**
   - ✅ Switch ON (primary color)
   - 👁️ Eye icon
   - Full opacity

2. **Hidden State:**
   - ❌ Switch OFF (muted)
   - 🚫 EyeOff icon
   - 50% opacity
   - "Hidden" badge (outline, dashed)

3. **Locked State:**
   - 🔒 Lock icon
   - "Locked" badge
   - "Always visible" description text
   - Switch disabled

### Accessibility:
- Switch component from shadcn/ui (Radix UI)
- Keyboard navigation support
- ARIA labels
- Focus states
- Disabled states for non-admins

## Data Structure

### KV Store Schema:
```typescript
{
  key: `table_column_order:${userId}`,
  value: {
    columnOrder: TableColumnId[],           // Array of column IDs
    columnVisibility: {                     // NEW
      projectName: true,     // locked, always true
      status: true,
      collaborators: false,  // hidden example
      startDate: true,
      endDate: true,
      links: true,
      deliverables: true
    },
    lastUpdated: "2025-10-19T..."
  }
}
```

### Default State:
```typescript
// All columns visible by default
visible: true  // in DEFAULT_TABLE_COLUMNS
```

## Backward Compatibility

✅ **Existing users without visibility data:**
- All columns default to visible
- No breaking changes
- Smooth migration

✅ **Existing column order data:**
- Preserved during visibility updates
- No data loss

## Testing Checklist

### Functional Tests:
- [x] Toggle visibility on/off
- [x] Changes persist after page refresh
- [x] Cannot hide Project column
- [x] Cannot hide last visible column
- [x] Non-admin cannot modify
- [x] Table view updates immediately
- [x] Works with column reordering
- [x] Reset to default works

### Visual Tests:
- [x] Switch animation smooth
- [x] Icons display correctly
- [x] Badges show/hide properly
- [x] Opacity changes visible
- [x] Layout doesn't break with few columns
- [x] Mobile responsive (settings page)

### Integration Tests:
- [x] Saves to database correctly
- [x] Loads from database correctly
- [x] Works with existing column order
- [x] Works in group by status mode
- [x] Works in group by vertical mode

## Known Limitations

1. **Mobile Table View:**
   - Mobile uses card view, not affected by column visibility
   - Feature only applies to desktop table view

2. **Minimum Columns:**
   - At least 2 columns must be visible (Project + 1 other)
   - This ensures table remains functional

3. **Admin Only:**
   - Only admins can modify visibility
   - All users see the same column configuration

## Future Enhancements

### Potential Features:
1. **Per-User Visibility:**
   - Each user can customize their own view
   - Requires role-based visibility storage

2. **Preset Views:**
   - Save/load different column configurations
   - "Minimal", "Full", "Custom" presets

3. **Bulk Actions:**
   - "Show All" / "Hide All" buttons
   - Select multiple columns at once

4. **Column Groups:**
   - Group related columns
   - Show/hide entire groups

## Performance Impact

- ✅ Minimal performance impact
- ✅ Filter operation is O(n) where n = number of columns (max 7)
- ✅ No re-renders on toggle (optimistic updates)
- ✅ Database calls throttled via auto-save

## Success Metrics

✅ **Implementation Complete:**
- Full feature working end-to-end
- All validation rules implemented
- Database persistence working
- UI/UX polished
- No breaking changes

✅ **Code Quality:**
- Type-safe implementation
- Reusable utility functions
- Clean separation of concerns
- Comprehensive error handling

## Version History

- **v2.5.0** (Oct 19, 2025): Show/Hide columns feature
- **v2.4.0** (Oct 18, 2025): Reorderable columns base
- **v2.3.0**: Stats as separate page
- **v2.2.0**: Stats mobile drawer migration
- **v2.1.0**: Stats tabs implementation

---

**Status:** ✅ COMPLETE & TESTED
**Author:** AI Assistant
**Last Updated:** October 19, 2025
