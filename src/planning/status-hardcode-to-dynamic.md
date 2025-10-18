# Status Hardcode to Dynamic - Planning & Implementation

## Problem Identified

User mengubah label status dari "In Queue Lightroom" menjadi "Lightroom", yang menyebabkan bug di grouping logic. Root cause: **ada hardcoded references** ke status names di codebase.

### Evidence from Code Search:

**Location 1: `/components/ProjectTable.tsx` Line 367**
```tsx
const manualStatuses = [
  'canceled', 
  'babysit', 
  'on review', 
  'on list lightroom',
  'in review', 
  'in queue lightroom', // ❌ HARDCODED - akan break kalau user ganti nama
  'done'
];
```

**Location 2: `/components/ProjectCard.tsx` Line 207**
```tsx
const manualStatuses = [
  'canceled', 
  'babysit', 
  'on review', 
  'on list lightroom',
  'in review',
  'in queue lightroom', // ❌ HARDCODED - akan break kalau user ganti nama
  'done'
];
```

## Root Cause Analysis

### Current Implementation Issues:

1. **Hardcoded Status Names** - Code menggunakan hardcoded string untuk status validation
2. **Case-Sensitive Comparison** - Menggunakan `.toLowerCase()` tapi tetap hardcoded
3. **Not Context-Aware** - Tidak menggunakan StatusContext untuk validasi
4. **Duplicate Logic** - Same logic di 2 file berbeda (ProjectTable.tsx & ProjectCard.tsx)

### Why This Is a Problem:

- ❌ User tidak bisa rename status tanpa break functionality
- ❌ Duplicate code = maintenance nightmare
- ❌ Tidak scalable - setiap tambah status harus update hardcode
- ❌ Tidak konsisten dengan StatusContext architecture

## Current Status Flow (Good ✅)

```
StatusContext (single source of truth)
  ↓
statuses array with { id, name, color, order, badge_color, badge_text_color }
  ↓
Used for:
  - Display status badges
  - Status dropdowns
  - Status ordering in grouping ✅ (uses statusOrder dari context)
```

## Broken Logic Flow (Bad ❌)

```
Hardcoded 'in queue lightroom' string
  ↓
manualStatuses array for auto-status logic
  ↓
❌ Breaks when user renames status
```

## Solution Design: Make Everything Dynamic

### Principle: **StatusContext is Single Source of Truth**

All status-related logic MUST use StatusContext, never hardcoded strings.

### Architecture Change:

```
StatusContext
  ↓
Add new metadata field: `is_manual_status: boolean`
  ↓
Use this field instead of hardcoded array
```

### Alternative Solution (Simpler):

Use **naming convention** or **status properties** instead:
- Option A: Add `is_manual` boolean field to status type
- Option B: Use status.order or other metadata to determine manual vs auto
- Option C: Create separate "manual status" category in StatusManager

## Proposed Implementation

### Phase 1: Audit All Hardcoded Status References ✅ (DONE)

Found 2 locations:
- `/components/ProjectTable.tsx` - Line 367
- `/components/ProjectCard.tsx` - Line 207

### Phase 2: Update Status Type Definition

**File: `/types/status.ts`**

Add optional metadata field:
```tsx
export interface Status {
  id: string;
  name: string;
  color: string;
  order: number;
  badge_color?: string;
  badge_text_color?: string;
  is_manual?: boolean; // NEW: Flag for manual vs auto-calculated statuses
}
```

### Phase 3: Update StatusContext Default Statuses

**File: `/components/StatusContext.tsx`**

Mark which statuses are manual (user-set) vs auto-calculated:
```tsx
const defaultStatuses: Status[] = [
  { name: 'Draft', color: '#9333ea', order: 0, is_manual: false },
  { name: 'Not Started', color: '#6b7280', order: 1, is_manual: false },
  { name: 'In Progress', color: '#f59e0b', order: 2, is_manual: false },
  { name: 'In Review', color: '#eab308', order: 3, is_manual: true }, // MANUAL
  { name: 'Lightroom', color: '#3b82f6', order: 4, is_manual: true }, // MANUAL (renamed from "In Queue Lightroom")
  { name: 'Done', color: '#10b981', order: 5, is_manual: true }, // MANUAL
  { name: 'Babysit', color: '#a855f7', order: 6, is_manual: true }, // MANUAL
  { name: 'On Hold', color: '#1f2937', order: 7, is_manual: true }, // MANUAL
  { name: 'Canceled', color: '#ef4444', order: 8, is_manual: true }, // MANUAL
];
```

### Phase 4: Add Helper Function to StatusContext

**File: `/components/StatusContext.tsx`**

```tsx
export function StatusProvider({ children }: { children: React.ReactNode }) {
  // ... existing code ...
  
  // NEW: Helper to get all manual status names
  const getManualStatusNames = () => {
    return statuses
      .filter(s => s.is_manual === true)
      .map(s => s.name.toLowerCase());
  };
  
  // NEW: Helper to check if status is manual
  const isManualStatus = (statusName: string) => {
    const statusLower = statusName.toLowerCase();
    return statuses.some(
      s => s.name.toLowerCase() === statusLower && s.is_manual === true
    );
  };
  
  return (
    <StatusContext.Provider value={{
      statuses,
      getStatusColor,
      addStatus,
      updateStatus,
      deleteStatus,
      reorderStatuses,
      getManualStatusNames, // NEW
      isManualStatus, // NEW
    }}>
      {children}
    </StatusContext.Provider>
  );
}
```

### Phase 5: Replace Hardcoded Arrays with Context Helpers

**File: `/components/ProjectTable.tsx`**

**BEFORE (Line 360-372):**
```tsx
const manualStatuses = [
  'canceled', 
  'babysit', 
  'on review', 
  'on list lightroom',
  'in review',
  'in queue lightroom', // ❌ HARDCODED
  'done'
];

// CRITICAL: If current status is a manual status, ALWAYS preserve it
const currentStatusLower = project.status.toLowerCase();
if (manualStatuses.includes(currentStatusLower)) {
  return project.status; // Preserve manual status
}
```

**AFTER:**
```tsx
const { isManualStatus } = useStatusContext();

// CRITICAL: If current status is a manual status, ALWAYS preserve it
// This ensures user's explicit status choices are never overridden
if (isManualStatus(project.status)) {
  return project.status; // Preserve manual status
}
```

**File: `/components/ProjectCard.tsx`**

Same replacement at Line 195-212.

### Phase 6: Update StatusManager UI

**File: `/components/StatusManager.tsx`**

Add checkbox/toggle to mark status as "Manual Status":
```tsx
<div className="space-y-2">
  <Label>Status Type</Label>
  <div className="flex items-center space-x-2">
    <Switch
      checked={editingStatus.is_manual ?? false}
      onCheckedChange={(checked) => 
        setEditingStatus(prev => ({ ...prev, is_manual: checked }))
      }
    />
    <span className="text-sm text-muted-foreground">
      Manual Status (preserves user selection, not auto-calculated)
    </span>
  </div>
</div>
```

### Phase 7: Database Migration Consideration

**IMPORTANT:** The `is_manual` field is frontend-only metadata, stored in localStorage alongside other status data.

**Action:** When user saves statuses, ensure `is_manual` is persisted:
```tsx
// In StatusContext save logic
const statusData = {
  statuses: statuses.map(s => ({
    id: s.id,
    name: s.name,
    color: s.color,
    order: s.order,
    badge_color: s.badge_color,
    badge_text_color: s.badge_text_color,
    is_manual: s.is_manual // ✅ Include in save
  }))
};
```

## Benefits of This Solution

### ✅ Pros:
1. **Fully Dynamic** - No more hardcoded status names
2. **Context-Driven** - Single source of truth (StatusContext)
3. **Scalable** - Easy to add new manual statuses via UI
4. **Maintainable** - No duplicate logic
5. **User-Friendly** - Status Manager UI makes it clear which statuses are manual
6. **Backward Compatible** - Existing statuses work without changes

### ⚠️ Considerations:
1. Need to set default `is_manual: true/false` for existing statuses
2. Need UI to let users toggle this setting
3. Need clear documentation of what "manual status" means

## Implementation Checklist

- [ ] **Phase 1**: Update `/types/status.ts` - Add `is_manual?: boolean`
- [ ] **Phase 2**: Update `/components/StatusContext.tsx`:
  - [ ] Add `is_manual` to default statuses
  - [ ] Add `getManualStatusNames()` helper
  - [ ] Add `isManualStatus()` helper
  - [ ] Export new helpers in context value
  - [ ] Ensure `is_manual` is persisted in localStorage
- [ ] **Phase 3**: Update `/components/StatusManager.tsx`:
  - [ ] Add UI toggle for "Manual Status" setting
  - [ ] Update add/edit status handlers
- [ ] **Phase 4**: Update `/components/ProjectTable.tsx`:
  - [ ] Import `useStatusContext` hook
  - [ ] Replace hardcoded `manualStatuses` array with `isManualStatus()` call
  - [ ] Remove hardcoded array (Line 360-372)
- [ ] **Phase 5**: Update `/components/ProjectCard.tsx`:
  - [ ] Import `useStatusContext` hook
  - [ ] Replace hardcoded `manualStatuses` array with `isManualStatus()` call
  - [ ] Remove hardcoded array (Line 195-212)
- [ ] **Phase 6**: Search for other potential hardcoded status references
- [ ] **Phase 7**: Test scenarios:
  - [ ] Rename "Lightroom" status → should work in grouping
  - [ ] Add new manual status → should preserve user selection
  - [ ] Add new auto status → should auto-calculate
  - [ ] Delete manual status → should not break
  - [ ] Reorder statuses → should maintain manual/auto designation

## Testing Scenarios

### Test 1: Rename Status (Original Bug)
1. Go to Settings → Status Manager
2. Rename "Lightroom" to "LR Processing"
3. Go to Dashboard → Group by Status
4. ✅ Should show "LR Processing" group, not "Lightroom"
5. ✅ Manual status logic should still work

### Test 2: Add New Manual Status
1. Go to Settings → Status Manager
2. Add new status "QA Review" with manual=true
3. Assign to a project
4. Update project dates
5. ✅ Status should stay "QA Review", not auto-calculate

### Test 3: Auto vs Manual Status
1. Create project with no status (auto-calculates to "Not Started")
2. Manually change to "Lightroom" (manual status)
3. Update due date to yesterday
4. ✅ Status should stay "Lightroom", NOT change to "Overdue"

## Questions for User (If Needed)

1. **Default is_manual values** - Do these look correct?
   - Draft: `false` (auto)
   - Not Started: `false` (auto)
   - In Progress: `false` (auto)
   - In Review: `true` (manual)
   - Lightroom: `true` (manual)
   - Done: `true` (manual)
   - Babysit: `true` (manual)
   - On Hold: `true` (manual)
   - Canceled: `true` (manual)

2. **UI Placement** - Should "Manual Status" toggle be:
   - Option A: In Status Manager during create/edit
   - Option B: Hidden (use sensible defaults only)

## Next Steps

Ready to implement? Confirm if:
1. ✅ Architecture looks good
2. ✅ Default `is_manual` values are correct
3. ✅ Proceed with implementation

---

**Status:** PLANNING COMPLETE - READY FOR IMPLEMENTATION
**Priority:** HIGH - Bug fix for renamed status
**Estimated Effort:** 1-2 hours
**Files to Modify:** 5 files (types, context, manager, table, card)
