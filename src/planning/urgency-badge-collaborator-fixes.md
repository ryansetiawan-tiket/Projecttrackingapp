# Urgency Badge & Collaborator Hover Fixes

## Issues Reported

### Issue 1: Badge Urgency Click Inconsistency
**Problem:** Clicking urgency badge sometimes works (expands) and sometimes doesn't. Should always work when there's a chevron to expand.

**Root Cause:** 
- In single asset mode: urgency badge had proper onClick handler (line 186-200 in AssetProgressBar.tsx)
- In multiple assets mode: urgency badge was just a `<div>` without onClick handler (line 318-326)
- Inconsistent behavior between single and multiple asset modes

### Issue 2: Missing Add Collaborator Icon on Hover
**Problem:** No icon button appears when hovering over collaborator cell to add collaborators.

**Root Cause:**
- `CollaboratorAvatars` component has UserPlus button that shows based on `isHovered` prop
- In `renderProjectRow.tsx` line 242, `isHovered` was hardcoded to `false` with comment "Will be managed by parent if needed"
- No hover state management was implemented in the parent component

## Fixes Applied

### Fix 1: Make All Urgency Badges Clickable ✅

**File:** `/components/project-table/AssetProgressBar.tsx`

**Before (Line 318-326):**
```tsx
return (
  <div 
    className="text-[10px] px-1.5 py-0.5 rounded flex-shrink-0 tabular-nums font-medium"
    style={{
      backgroundColor: bgColor,
      color: color,
    }}
  >
    {urgency.label}
  </div>
);
```

**After:**
```tsx
return (
  <button 
    onClick={onToggleExpansion}
    className="text-[10px] px-1.5 py-0.5 rounded flex-shrink-0 tabular-nums font-medium cursor-pointer hover:opacity-80 transition-opacity"
    style={{
      backgroundColor: bgColor,
      color: color,
    }}
  >
    {urgency.label}
  </button>
);
```

**Changes:**
1. Changed `<div>` to `<button>` for proper clickable element
2. Added `onClick={onToggleExpansion}` to handle click
3. Added `cursor-pointer hover:opacity-80 transition-opacity` for visual feedback
4. Now consistent with single asset urgency badge behavior

### Fix 2: Implement Collaborator Cell Hover State ✅

**File:** `/components/project-table/renderProjectRow.tsx`

**Step 1 - Add useState import (Line 1):**
```tsx
import { useState } from 'react';
```

**Step 2 - Add hover state (Line 37):**
```tsx
const [hoveredCollaboratorCell, setHoveredCollaboratorCell] = useState(false);
```

**Step 3 - Update CollaboratorAvatars cell (Lines 234-251):**

**Before:**
```tsx
<TableCell
  className="w-[160px] min-w-[160px] max-w-[160px]"
  onClick={(e) => e.stopPropagation()}
>
  <CollaboratorAvatars
    projectId={project.id}
    projectCollaborators={project.collaborators || []}
    allCollaborators={collaborators}
    isPublicView={isPublicView}
    isHovered={false} // Will be managed by parent if needed
    onUpdate={(updatedCollaborators) => {
      handlers.onUpdate(project.id, { collaborators: updatedCollaborators });
    }}
  />
</TableCell>
```

**After:**
```tsx
<TableCell
  className="w-[160px] min-w-[160px] max-w-[160px]"
  onClick={(e) => e.stopPropagation()}
  onMouseEnter={() => setHoveredCollaboratorCell(true)}
  onMouseLeave={() => setHoveredCollaboratorCell(false)}
>
  <CollaboratorAvatars
    projectId={project.id}
    projectCollaborators={project.collaborators || []}
    allCollaborators={collaborators}
    isPublicView={isPublicView}
    isHovered={hoveredCollaboratorCell}
    onUpdate={(updatedCollaborators) => {
      handlers.onUpdate(project.id, { collaborators: updatedCollaborators });
    }}
  />
</TableCell>
```

**Changes:**
1. Added `onMouseEnter` event to set hover state to `true`
2. Added `onMouseLeave` event to set hover state to `false`
3. Changed `isHovered={false}` to `isHovered={hoveredCollaboratorCell}`
4. Now UserPlus button in CollaboratorAvatars will show on hover

## How It Works Now

### Urgency Badge Click Behavior
1. **Single Asset Mode:** Badge is clickable, expands to show actions ✅
2. **Multiple Assets Mode:** Badge is clickable, expands to show all assets ✅
3. **Consistent UX:** All urgency badges now have same hover and click behavior ✅

### Collaborator Cell Hover Behavior
1. **Default State:** Only shows collaborator avatars and names
2. **On Hover:** UserPlus button fades in (transition from opacity-0 to opacity-100)
3. **Click UserPlus:** Opens popover to add/remove collaborators
4. **Public View:** UserPlus button never shows (respects isPublicView prop) ✅

## Testing Checklist

- [x] Single asset with urgency badge: Click expands to show actions
- [x] Multiple assets with urgency badge: Click expands to show asset list
- [x] Hover over collaborator cell: UserPlus button appears
- [x] Click UserPlus: Popover opens with collaborator list
- [x] Public view: No UserPlus button shows on hover
- [x] Hover visual feedback: Urgency badge has opacity change on hover
- [x] Hover visual feedback: UserPlus button fades in smoothly

## Files Changed

1. `/components/project-table/AssetProgressBar.tsx` - Made urgency badge clickable for multiple assets
2. `/components/project-table/renderProjectRow.tsx` - Added hover state management for collaborator cell

## Related Components

- `CollaboratorAvatars.tsx` - Already had hover logic, just needed parent to provide hover state
- `AssetProgressBar.tsx` - Now has consistent clickable urgency badges in all modes

## Impact

- **UX Improvement:** Users can now always click urgency badges to expand when chevron is visible
- **Feature Discovery:** UserPlus button now visible on hover as designed
- **Consistency:** Both single and multiple asset modes behave identically
- **No Breaking Changes:** All existing functionality preserved
