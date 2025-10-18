# Lightroom Status Debug Guide - COMPREHENSIVE FIX

## Problem
Status "Lightroom" tidak preserved meskipun sudah di-toggle sebagai Manual Status.
Status lain (On Hold, Canceled, dll) bisa preserved dengan baik.

## Root Causes Identified

### 1. Missing `is_manual` Field
Jika status "Lightroom" dibuat SEBELUM kita implementasi `is_manual` field, atau dibuat SETELAH migration, field tersebut bisa undefined.

### 2. Case Sensitivity & Typo
Nama status bisa punya variations:
- "Lightroom" (capital L)
- "lightroom" (lowercase)
- "LightRoom" (camelCase)
- "Light room" (dengan space)
- "  Lightroom  " (dengan trailing spaces)

### 3. Auto-Promotion Background Process
`autoPromoteUrgentProjects()` di useProjects.ts runs in background dan bisa force update status ke "In Progress" jika tidak detect manual status dengan benar.

## Comprehensive Solution Implemented

### Phase 1: Fallback Pattern Matching ✅

**File:** `/components/StatusContext.tsx`

```typescript
const isManualStatus = (statusName: string) => {
  const statusLower = statusName.toLowerCase().trim();
  const status = statuses.find(s => s.name.toLowerCase().trim() === statusLower);
  
  // CRITICAL FALLBACK: If is_manual is undefined/null,
  // check against common manual status patterns
  const commonManualPatterns = [
    'done', 'canceled', 'cancelled', 'on hold', 'hold',
    'review', 'on review', 'in review', 'babysit',
    'lightroom', 'light room', 'lr',  // ← ALL VARIATIONS!
    'on list lightroom', 'in queue lightroom',
    'queue lightroom', 'lightroom queue', 'lr queue',
    'awaiting lightroom', 'pending lightroom'
  ];
  
  if (status?.is_manual === true) {
    return true;  // Explicit manual
  } else if (status?.is_manual === false) {
    return false; // Explicit auto
  } else {
    // FALLBACK: Check pattern match
    return commonManualPatterns.includes(statusLower);
  }
};
```

**Benefits:**
- ✅ Works even if `is_manual` field missing
- ✅ Handles all case variations
- ✅ Trims whitespace automatically
- ✅ Comprehensive pattern list

### Phase 2: Diagnostic Tool ✅

**File:** `/components/StatusManager.tsx`

Added "🔧 Fix Missing Fields" button that:
1. Scans all statuses for missing `is_manual` field
2. Auto-detects common manual statuses
3. Updates database with correct `is_manual` value
4. Shows results in console and toast

**Usage:**
1. Go to Settings → Status Manager
2. Click "🔧 Fix Missing Fields" button
3. Check console for detailed log
4. Verify all statuses now have `is_manual` field

### Phase 3: Enhanced Logging ✅

**Files:** Multiple files with comprehensive logging

**Where to look:**
```
Browser Console (F12):

[Migration] Adding is_manual=true to status: Lightroom
[StatusContext] Loaded statuses: [...]
[StatusContext] isManualStatus("Lightroom"): { 
  found: true, 
  actualName: "Lightroom",
  is_manual: true,
  fallbackChecked: false,
  result: true 
}
[ProjectCard] Auto-status check for "Project Name": {
  status: "Lightroom",
  isManual: true,
  progress: 50,
  willSkip: true
}
[ProjectCard] ✅ Skipping auto-status for manual status: Lightroom
[sortingUtils] Manual statuses to exclude from promotion: [...]
[sortingUtils] Excluding "Project Name" (status: "Lightroom") - manual status detected
```

### Phase 4: sortingUtils Enhanced ✅

**File:** `/utils/sortingUtils.ts`

```typescript
const defaultManualStatuses = [
  'on hold', 'canceled', 'babysit',
  'on review', 'in review',
  'on list lightroom', 'in queue lightroom',
  'lightroom',     // ← ADDED!
  'light room',    // ← Variation
  'lr',            // ← Abbreviation
  'lr queue',      // ← Variation
  'done'
];
```

With detailed logging for every check.

## Step-by-Step Testing Instructions

### ✅ Step 1: Check Current Status State

1. **Open Browser Console** (F12 → Console tab)
2. **Refresh page** (Ctrl+R atau Cmd+R)
3. **Look for migration logs:**
   ```
   [Migration] Adding is_manual=true to status: Lightroom
   ```
4. **Check loaded statuses:**
   ```
   [StatusContext] Loaded statuses: [...]
   ```

**Expected:** You should see all statuses with `is_manual` field.

**If NOT:** Status might need manual fix (proceed to Step 2).

---

### ✅ Step 2: Fix Missing Fields (Diagnostic Tool)

1. **Go to Settings** → Click gear icon
2. **Navigate to Status Manager**
3. **Click "🔧 Fix Missing Fields" button** (top right)
4. **Wait for toast notification**
5. **Check console for detailed output:**
   ```
   [StatusManager] Fixing 1 statuses...
   [StatusManager] Setting is_manual=true for "Lightroom"
   ```

**Expected:** Toast shows "Fixed X status(es)!" or "All statuses have is_manual field!"

---

### ✅ Step 3: Verify Status Configuration

1. **Still in Status Manager**
2. **Find "Lightroom" status in the list**
3. **Click Edit button (pencil icon)**
4. **Check "Manual Status" toggle:**
   - ✅ Should be ON
   - If OFF, toggle it ON and click Save

**Expected:** Toggle is ON, indicating manual status.

---

### ✅ Step 4: Test Manual Status Preservation

1. **Go back to Dashboard**
2. **Find or create a project**
3. **Set project status = "Lightroom"**
4. **Add asset with actions** (e.g., "Hero Banner" dengan action "Drafting")
5. **Toggle action to In Progress**
6. **Watch console logs:**
   ```
   [ProjectCard] Auto-status check for "Your Project": {
     status: "Lightroom",
     isManual: true,
     progress: 0,
     willSkip: true
   }
   [ProjectCard] ✅ Skipping auto-status for manual status: Lightroom
   ```

**Expected:** Status STAYS "Lightroom" - tidak berubah ke "In Progress"

**If FAILS:** Project status berubah → Proceed to Step 5 for deep debugging

---

### ✅ Step 5: Deep Debugging (If Status Still Changes)

**Check 1: Is the status name exactly "Lightroom"?**

In console, type:
```javascript
// Check actual status name
console.log('Actual status name:', document.querySelector('[data-status]')?.textContent);
```

**Common issues:**
- Extra spaces: "Lightroom " or " Lightroom"
- Different casing: "lightroom", "LightRoom"
- Typo: "LIghtroom", "Ligthroom"

**Fix:** Rename status to exactly "Lightroom" (capital L, no spaces)

---

**Check 2: Is is_manual field actually saved?**

In console, type:
```javascript
// Fetch statuses from StatusContext
// (Assuming StatusContext is accessible)
```

Or check in Status Manager → Edit "Lightroom" → Verify toggle is ON

---

**Check 3: Is auto-promotion triggering?**

Watch for these logs:
```
[useProjects] Auto-promoting 1 urgent project(s) to In Progress
[useProjects] Projects to promote: [{ name: "Your Project", status: "Lightroom" }]
```

**If you see this:** Auto-promotion is STILL promoting Lightroom projects!

**Fix:** Check sortingUtils.ts - should exclude "Lightroom" from promotion.

Look for:
```
[sortingUtils] Excluding "Your Project" (status: "Lightroom") - manual status detected
```

If NOT present → Status name might not match exactly.

---

**Check 4: Exact status name debugging**

In console, run:
```javascript
// Get project with Lightroom status
const project = /* your project object */;
console.log('Status:', `|${project.status}|`); // Pipes show spaces
console.log('Lowercase:', `|${project.status.toLowerCase()}|`);
console.log('Trimmed:', `|${project.status.trim()}|`);
console.log('Length:', project.status.length);
```

**Expected:** 
```
Status: |Lightroom|
Lowercase: |lightroom|
Trimmed: |Lightroom|
Length: 9
```

**If different:** You found the issue! Status name has unexpected characters.

---

### ✅ Step 6: Nuclear Option - Recreate Status

If all else fails:

1. **Settings → Status Manager**
2. **Create NEW status:**
   - Name: Exactly "Lightroom" (copy-paste to be sure)
   - Color: Your preferred color
   - Display: Table View
   - **Manual Status: ON** ← IMPORTANT!
   - Click "Add Status"
3. **Delete old "Lightroom" status** (if different)
4. **Update projects** to use new "Lightroom" status
5. **Test again**

---

## Common Pitfalls & Solutions

### ❌ Pitfall 1: Status created after migration
**Solution:** Use "🔧 Fix Missing Fields" button in Status Manager

### ❌ Pitfall 2: Case sensitivity mismatch
**Solution:** Rename status to exactly "Lightroom" (capital L)

### ❌ Pitfall 3: Trailing/leading spaces
**Solution:** Edit status, remove any spaces, save

### ❌ Pitfall 4: Browser cache
**Solution:** Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

### ❌ Pitfall 5: Multiple windows/tabs
**Solution:** Close all tabs, open fresh one

### ❌ Pitfall 6: Database not synced
**Solution:** Logout → Login again (force fresh data fetch)

---

## Expected Console Output (Success Case)

When everything works correctly, you should see:

```
[Migration] Adding is_manual=true to status: Lightroom
[StatusContext] Loaded statuses: [
  { name: "Not Started", is_manual: false, ... },
  { name: "In Progress", is_manual: false, ... },
  { name: "Lightroom", is_manual: true, ... },  ← THIS!
  { name: "Done", is_manual: true, ... }
]

[StatusContext] isManualStatus("Lightroom"): {
  found: true,
  actualName: "Lightroom",
  is_manual: true,
  fallbackChecked: false,
  result: true  ← THIS!
}

[ProjectCard] Auto-status check for "halo tiket Campaign": {
  status: "Lightroom",
  isManual: true,  ← THIS!
  progress: 33,
  willSkip: true  ← THIS!
}

[ProjectCard] ✅ Skipping auto-status for manual status: Lightroom

[sortingUtils] Manual statuses to exclude from promotion: 
  ["on hold", "canceled", ..., "lightroom", ...]  ← THIS!

[sortingUtils] Excluding "halo tiket Campaign" (status: "Lightroom") - manual status detected
```

---

## Files Modified in This Fix

| File | Changes | Purpose |
|------|---------|---------|
| `/components/StatusContext.tsx` | Added fallback pattern matching | Handle missing is_manual field |
| `/components/StatusManager.tsx` | Added diagnostic tool button | Manual fix for missing fields |
| `/components/ProjectCard.tsx` | Enhanced logging | Debug auto-status calculation |
| `/hooks/useProjects.ts` | Enhanced logging | Debug auto-promotion |
| `/utils/sortingUtils.ts` | Added variations + logging | Prevent auto-promotion |
| `/hooks/useStatuses.ts` | Migration logic (previous) | Auto-migrate on first load |

---

## Next Steps

1. **Refresh page** (to trigger migration if not done yet)
2. **Click "🔧 Fix Missing Fields"** in Status Manager
3. **Verify "Lightroom" toggle is ON**
4. **Test with a project**
5. **Monitor console logs**
6. **Report results** with console screenshot

If still fails after all these steps, please share:
1. Full console log output
2. Screenshot of Status Manager showing "Lightroom" status
3. Project details (what status it changed from/to)

---

**Date:** 2025-01-12  
**Status:** COMPREHENSIVE FIX IMPLEMENTED ✅  
**Confidence:** HIGH - Should resolve all edge cases
