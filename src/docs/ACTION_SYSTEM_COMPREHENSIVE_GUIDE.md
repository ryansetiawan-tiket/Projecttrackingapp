# Action System - Comprehensive Technical Documentation

## 📋 Table of Contents

1. [Overview](#overview)
2. [Data Structure](#data-structure)
3. [Core Logic](#core-logic)
4. [Status Correlation](#status-correlation)
5. [Grouping System](#grouping-system)
6. [Progress Bar Integration](#progress-bar-integration)
7. [Auto-Check System](#auto-check-system)
8. [Auto-Trigger System](#auto-trigger-system)
9. [Manual Status Preservation](#manual-status-preservation)
10. [UI Components](#ui-components)
11. [Special Conditions & Edge Cases](#special-conditions--edge-cases)
12. [Implementation Details](#implementation-details)
13. [Visual Examples](#visual-examples)

---

## Overview

### What is the Action System?

Action System adalah fitur manajemen tugas granular yang memungkinkan user untuk:
- Memecah Asset menjadi action items yang dapat di-check
- Track progress completion per Asset dan per Project
- Auto-trigger status changes berdasarkan action completion
- Auto-group actions berdasarkan trigger capability
- Auto-check actions above ketika user check action tertentu

### Key Features

1. **Checkable Actions** - Setiap action dapat di-check/uncheck
2. **Auto-Check Above** - Check action otomatis check semua action di atasnya
3. **Auto-Trigger Status** - Action tertentu otomatis update project status
4. **Manual Grouping** - Actions dikelompokkan berdasarkan trigger capability
5. **Progress Tracking** - Real-time progress calculation
6. **wasAutoChecked Flag** - Track yang mana action auto-checked vs manual
7. **Status Preservation** - Manual statuses tidak di-override

### Architecture

```
Project
  └─ Assets (actionable_items)
      └─ Actions
          ├─ id: string
          ├─ name: string
          ├─ completed: boolean
          └─ wasAutoChecked?: boolean (optional flag)
```

---

## Data Structure

### Type Definitions

```typescript
// From /types/project.ts
interface AssetAction {
  id: string;                    // Unique identifier
  name: string;                  // Action name (e.g., "Reference", "Drafting")
  completed: boolean;            // Completion state
  wasAutoChecked?: boolean;      // Flag if auto-checked (vs manual)
}

interface ActionableItem {
  id: string;                    // Asset unique identifier
  title: string;                 // Asset title (e.g., "Hero Banner")
  status?: string;               // Asset-level status (optional)
  is_completed?: boolean;        // Asset completion flag
  actions?: AssetAction[];       // Array of actions (optional)
}

interface Project {
  id: string;
  name: string;
  status: string;                // Project-level status
  actionable_items: ActionableItem[];
  // ... other fields
}
```

### Database Storage

Actions disimpan sebagai nested JSON di dalam project object:

```json
{
  "id": "project_123",
  "name": "Product Launch Campaign",
  "status": "In Progress",
  "actionable_items": [
    {
      "id": "asset_001",
      "title": "Hero Banner",
      "status": "Done",
      "is_completed": true,
      "actions": [
        {
          "id": "action_001",
          "name": "Reference",
          "completed": true,
          "wasAutoChecked": false
        },
        {
          "id": "action_002",
          "name": "Drafting",
          "completed": true,
          "wasAutoChecked": true
        },
        {
          "id": "action_003",
          "name": "Done",
          "completed": true,
          "wasAutoChecked": false
        }
      ]
    }
  ]
}
```

### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✅ Yes | Unique identifier for action |
| `name` | string | ✅ Yes | Display name of action |
| `completed` | boolean | ✅ Yes | Whether action is completed |
| `wasAutoChecked` | boolean | ❌ No | Flag indicating auto-completion |

### wasAutoChecked Flag

**Purpose**: Track HOW an action was completed
- `undefined` or `false` = Manually checked by user
- `true` = Auto-checked by system (via "auto-check above" feature)

**Use Cases**:
1. **Visual Indicator** - Show 🎯 badge on auto-checked actions
2. **Debugging** - Track auto-check behavior
3. **Analytics** - Understand user workflow patterns
4. **Undo Logic** - Potential future feature to undo auto-checks

---

## Core Logic

### Action State Management

#### 1. **Creating Actions**

```typescript
// Location: /components/AssetActionManager.tsx

const addAction = (name: string) => {
  const trimmed = name.trim();
  if (!trimmed) return;

  const newAction: AssetAction = {
    id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: trimmed,
    completed: false
    // wasAutoChecked is undefined initially
  };

  onChange([...actions, newAction]);
  setNewActionName('');
};
```

**Key Points**:
- ID generation: `action_${timestamp}_${random}`
- Name is trimmed to remove whitespace
- Default `completed: false`
- `wasAutoChecked` not set initially (undefined)

#### 2. **Toggling Action State**

```typescript
// Location: /components/AssetActionManager.tsx

const toggleAction = (id: string) => {
  const actionIndex = actions.findIndex(a => a.id === id);
  if (actionIndex === -1) return;

  const isChecking = !actions[actionIndex].completed;

  if (isChecking && autoCheckAbove) {
    // AUTO-CHECK ABOVE LOGIC
    const updatedActions = [...actions];
    
    for (let idx = 0; idx < actions.length; idx++) {
      if (idx < actionIndex) {
        // Auto-check all actions above
        updatedActions[idx] = { 
          ...actions[idx], 
          completed: true, 
          wasAutoChecked: true 
        };
      } else if (idx === actionIndex) {
        // Manually check this action
        updatedActions[idx] = { 
          ...actions[idx], 
          completed: true, 
          wasAutoChecked: undefined 
        };
      } else {
        // Keep unchanged
        updatedActions[idx] = actions[idx];
      }
    }
    
    onChange(updatedActions);
  } else {
    // NORMAL TOGGLE (unchecking or auto-check disabled)
    const updatedActions = actions.map(a => 
      a.id === id 
        ? { ...a, completed: !a.completed, wasAutoChecked: undefined } 
        : a
    );
    onChange(updatedActions);
  }
};
```

**Logic Flow**:

1. **Find action index** in array
2. **Determine action**: Checking (true) or Unchecking (false)
3. **If Checking + Auto-Check Enabled**:
   - Loop through all actions
   - Actions ABOVE target → Set `completed: true`, `wasAutoChecked: true`
   - Target action → Set `completed: true`, `wasAutoChecked: undefined`
   - Actions BELOW target → Keep unchanged
4. **If Unchecking OR Auto-Check Disabled**:
   - Simple toggle `completed` state
   - Clear `wasAutoChecked` flag

#### 3. **Editing Action Name**

```typescript
// Location: /components/AssetActionManager.tsx

const saveEdit = (id: string) => {
  const trimmed = editingName.trim();
  if (trimmed) {
    onChange(actions.map(a => 
      a.id === id ? { ...a, name: trimmed } : a
    ));
  }
  setEditingId(null);
  setEditingName('');
};
```

**Key Points**:
- Name is trimmed
- Only `name` field is updated
- `completed` and `wasAutoChecked` preserved

#### 4. **Deleting Actions**

```typescript
// Location: /components/AssetActionManager.tsx

const deleteAction = (id: string) => {
  onChange(actions.filter(a => a.id !== id));
};
```

**Key Points**:
- Simple filter operation
- Immediate removal from array
- No confirmation dialog (can be undone via Ctrl+Z if needed)

---

## Status Correlation

### Overview

Actions dan Status memiliki **bidirectional relationship**:
- **Actions → Status**: Completion progress auto-updates project status
- **Status → Actions**: Changing status to "Done" auto-completes all actions

### Status Context Integration

```typescript
// Location: /components/StatusContext.tsx

interface StatusContextType {
  statuses: Status[];
  isManualStatus: (statusName: string) => boolean;
  shouldAutoTriggerStatus: (actionName: string) => { 
    shouldTrigger: boolean; 
    statusName?: string 
  };
  getAutoTriggerStatuses: () => Status[];
  // ... other methods
}
```

### 1. Progress → Status Auto-Update

**Location**: `/components/ProjectCard.tsx` (useEffect)

```typescript
useEffect(() => {
  if (!onProjectUpdate || projectProgress === null) return;

  // CRITICAL: DO NOT auto-calculate for manual statuses
  const isManual = isManualStatus(project.status);
  
  if (isManual) {
    console.log(`Skipping auto-status for manual status: ${project.status}`);
    return; // Never auto-calculate for manual statuses
  }

  let newStatus: string | null = null;

  // Calculate total action count
  const totalActionCount = (project.actionable_items || []).reduce((sum, asset) => {
    return sum + (asset.actions?.length || 0);
  }, 0);

  if (projectProgress === 100 && project.status !== 'Done') {
    // All actions completed → Set to Done
    newStatus = 'Done';
  } else if (projectProgress === 0 && project.status !== 'Not Started') {
    // Edge case: Single-action projects
    if (project.status === 'In Progress' && totalActionCount === 1) {
      console.log(`Preserving "In Progress" for single-action project at 0%`);
      newStatus = null; // Do NOT revert to "Not Started"
    } else {
      // Multi-action projects at 0% → Set to Not Started
      newStatus = 'Not Started';
    }
  } else if (projectProgress > 0 && projectProgress < 100 && project.status === 'Not Started') {
    // Some actions completed → Set to In Progress
    newStatus = 'In Progress';
  }

  if (newStatus && newStatus !== project.status) {
    console.log(`Auto-updating status: "${project.status}" → "${newStatus}"`);
    onProjectUpdate(project.id, { status: newStatus });
  }
}, [projectProgress, project.status, project.actionable_items, isManualStatus, onProjectUpdate]);
```

**Status Update Rules**:

| Progress | Current Status | New Status | Condition |
|----------|---------------|------------|-----------|
| 100% | Any (except Done) | Done | All actions completed |
| 0% | Any (except Not Started) | Not Started | All actions unchecked (multi-action) |
| 0% | In Progress | In Progress | Single-action project (preserved) |
| 0-99% | Not Started | In Progress | Some actions completed |
| Any | Manual Status | NO CHANGE | Manual status preserved |

**Special Cases**:

1. **Single-Action Projects**: 
   - At 0% progress, preserve "In Progress" status
   - Prevents ping-pong between "Not Started" ↔ "In Progress"
   - Only affects projects with exactly 1 action total

2. **Manual Status Protection**:
   - If `isManualStatus() === true`, skip all auto-updates
   - Manual statuses are sacred, set by user explicitly

### 2. Status → Actions Auto-Complete

**Location**: `/components/ProjectCard.tsx` (Status dropdown)

```typescript
// When status changes to "Done"
if (status === 'Done' && project.actionable_items && project.actionable_items.length > 0) {
  const updatedAssets = project.actionable_items.map(asset => ({
    ...asset,
    status: 'Done',
    is_completed: true,
    // Complete ALL actions within this asset
    actions: asset.actions?.map(action => ({
      ...action,
      completed: true,
      wasAutoChecked: true  // Mark as auto-completed
    }))
  }));
  
  onProjectUpdate(project.id, { 
    status, 
    actionable_items: updatedAssets 
  });
}
```

**Logic Flow**:
1. User changes status to "Done"
2. System checks if project has assets with actions
3. Loop through ALL assets
4. Loop through ALL actions in each asset
5. Set `completed: true` and `wasAutoChecked: true`
6. Update both status AND actions in single database call

**Why wasAutoChecked: true?**
- Indicates completion was system-triggered, not manual
- Helps user understand bulk completion happened
- Shows 🎯 badge on all auto-completed actions

### 3. Action Name → Status Auto-Trigger

**Location**: `/components/ProjectCard.tsx` (handleActionToggle - Mobile)

```typescript
const handleActionToggle = (assetId: string, actionId: string, completed: boolean) => {
  // Find the action being toggled
  const asset = project.actionable_items?.find(a => a.id === assetId);
  const action = asset?.actions?.find(a => a.id === actionId);
  
  if (!action) return;
  
  // Check if this action should auto-trigger a status change
  const { shouldTrigger, statusName } = shouldAutoTriggerStatus(action.name);
  
  // Update the asset actions
  const updatedAssets = (project.actionable_items || []).map(asset => {
    if (asset.id === assetId) {
      const updatedActions = (asset.actions || []).map(a => 
        a.id === actionId 
          ? { 
              ...a, 
              completed, 
              wasAutoChecked: completed && shouldTrigger ? true : a.wasAutoChecked 
            } 
          : a
      );
      return { ...asset, actions: updatedActions };
    }
    return asset;
  });
  
  // If action is being checked AND should trigger status change
  if (completed && shouldTrigger && statusName) {
    console.log(`Auto-trigger: "${action.name}" → status "${statusName}"`);
    
    // Update BOTH actions AND status
    onProjectUpdate(project.id, { 
      actionable_items: updatedAssets,
      status: statusName
    });
    
    toast.success(`Action completed • Status updated to "${statusName}"`);
  } else {
    // Just update the actions
    onProjectUpdate(project.id, { actionable_items: updatedAssets });
    toast.success(completed ? 'Action completed' : 'Action unchecked');
  }
};
```

**Auto-Trigger Logic**:

1. **Action Name Matching**:
   ```typescript
   // In StatusContext.tsx
   const shouldAutoTriggerStatus = (actionName: string) => {
     const actionLower = actionName.toLowerCase().trim();
     
     const matchingStatus = statuses.find(
       s => s.name.toLowerCase().trim() === actionLower 
         && s.auto_trigger_from_action === true
     );
     
     if (matchingStatus) {
       return { shouldTrigger: true, statusName: matchingStatus.name };
     }
     
     return { shouldTrigger: false };
   };
   ```

2. **Matching Criteria**:
   - Case-insensitive name comparison
   - Trimmed whitespace
   - Status must have `auto_trigger_from_action: true` flag

3. **Examples**:
   ```
   Action "Done" → Status "Done" (if auto_trigger enabled)
   Action "On Hold" → Status "On Hold" (if auto_trigger enabled)
   Action "Review" → Status "Review" (if auto_trigger enabled)
   Action "Shoot" → NO TRIGGER (no matching status)
   ```

4. **Update Behavior**:
   - If match found + action being checked:
     - Update action `completed: true`
     - Set `wasAutoChecked: true`
     - Update project `status` to matching status
     - Show enhanced toast notification
   - If no match OR action being unchecked:
     - Just toggle action state
     - Standard toast notification

---

## Grouping System

### Overview

Actions are **visually grouped** based on their auto-trigger capability untuk memberikan clarity kepada user tentang action behavior.

### Group Types

#### 1. Manual Trigger Actions

**Characteristics**:
- Action name matches a manual status name
- Status has `auto_trigger_from_action: true`
- Checking action auto-updates project status
- Displayed first in list

**Visual Indicators**:
- Section header: "MANUAL TRIGGER ACTIONS"
- Badge: 🖐️ (hand emoji)
- Target badge: "→ StatusName" (shows which status will be set)

#### 2. Regular Actions

**Characteristics**:
- Action name does NOT match any manual status
- Normal checkbox behavior
- No status change on check
- Displayed below manual trigger actions

**Visual Indicators**:
- Section header: "REGULAR ACTIONS" (only if manual trigger actions exist)
- Badge: 🎯 (if `wasAutoChecked: true`)

### Grouping Logic

**Location**: `/components/ProjectCard.tsx` (Mobile expandable view)

```typescript
// Group actions by auto-trigger capability
const manualTriggerActions = item.actions.filter(action => 
  shouldAutoTriggerStatus(action.name).shouldTrigger
);

const regularActions = item.actions.filter(action => 
  !shouldAutoTriggerStatus(action.name).shouldTrigger
);
```

**Rendering Logic**:

```tsx
{/* Manual Trigger Actions Section */}
{manualTriggerActions.length > 0 && (
  <div className="space-y-1">
    {/* Section Header */}
    <div className="flex items-center gap-1.5 px-1.5 py-0.5">
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
        Manual Trigger Actions
      </span>
      <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5">
        🖐️
      </Badge>
    </div>
    
    {/* Actions with status badges */}
    {manualTriggerActions.map((action) => {
      const { statusName } = shouldAutoTriggerStatus(action.name);
      return (
        <label key={action.id}>
          <input type="checkbox" ... />
          <span>{action.name}</span>
          <Badge title={`Will update status to "${statusName}"`}>
            → {statusName}
          </Badge>
        </label>
      );
    })}
  </div>
)}

{/* Regular Actions Section */}
{regularActions.length > 0 && (
  <div className="space-y-1">
    {manualTriggerActions.length > 0 && (
      <div className="px-1.5 py-0.5">
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
          Regular Actions
        </span>
      </div>
    )}
    
    {regularActions.map((action) => (
      <label key={action.id}>
        <input type="checkbox" ... />
        <span>{action.name}</span>
        {action.wasAutoChecked && <Badge>🎯</Badge>}
      </label>
    ))}
  </div>
)}
```

### Visual Examples

#### Example 1: Mixed Actions

```
┌─────────────────────────────────────┐
│ MANUAL TRIGGER ACTIONS 🖐️           │
├─────────────────────────────────────┤
│ ☑ Submit to Client  [→ Done]        │
│ ☐ On Hold          [→ On Hold]      │
│                                     │
│ REGULAR ACTIONS                     │
├─────────────────────────────────────┤
│ ☐ Reference                         │
│ ☑ Drafting                      🎯  │
│ ☐ Finishing                         │
└─────────────────────────────────────┘
```

#### Example 2: Only Regular Actions

```
┌─────────────────────────────────────┐
│ ☐ Reference                         │
│ ☐ Drafting                          │
│ ☐ Finishing                         │
│ ☐ Exporting                         │
└─────────────────────────────────────┘
```
(No grouping header shown)

#### Example 3: Only Manual Trigger Actions

```
┌─────────────────────────────────────┐
│ MANUAL TRIGGER ACTIONS 🖐️           │
├─────────────────────────────────────┤
│ ☐ Done             [→ Done]         │
│ ☐ On Hold          [→ On Hold]      │
│ ☐ Review           [→ Review]       │
└─────────────────────────────────────┘
```
(No "Regular Actions" section)

### Grouping Benefits

1. **Visual Clarity**: User tahu actions mana yang trigger status change
2. **Workflow Understanding**: Clear distinction between types
3. **Mistake Prevention**: User aware of consequences before checking
4. **Progressive Disclosure**: Important actions shown first

---

## Progress Bar Integration

### Overview

Progress bar menampilkan **visual representation** dari action completion percentage untuk setiap Asset dan untuk keseluruhan Project.

### Calculation Logic

**Location**: `/utils/taskProgress.ts`

```typescript
export const calculateProjectProgress = (
  actionableItems: ActionableItem[] | undefined
): number | null => {
  if (!actionableItems || actionableItems.length === 0) {
    return null; // No items to calculate
  }

  // Calculate total actions across ALL assets
  const totalActions = actionableItems.reduce((sum, asset) => {
    return sum + (asset.actions?.length || 0);
  }, 0);

  // If no actions exist, return null
  if (totalActions === 0) {
    return null;
  }

  // Calculate completed actions
  const completedActions = actionableItems.reduce((sum, asset) => {
    return sum + (asset.actions?.filter(a => a.completed).length || 0);
  }, 0);

  // Return percentage (0-100)
  return Math.round((completedActions / totalActions) * 100);
};
```

**Key Points**:
1. **Returns null** if no actionable items OR no actions
2. **Counts ALL actions** across ALL assets
3. **Counts completed actions** (where `completed: true`)
4. **Returns rounded percentage** (0-100)

### Progress Color System

**Location**: `/utils/taskProgress.ts`

```typescript
export const getProgressColorValue = (progress: number): string => {
  if (progress === 0) return '#9CA3AF'; // Gray - Not started
  if (progress < 25) return '#EF4444';  // Red - Just started
  if (progress < 50) return '#F97316';  // Orange - Some progress
  if (progress < 75) return '#EAB308';  // Yellow - Halfway
  if (progress < 100) return '#22C55E'; // Green - Almost done
  return '#10B981';                     // Emerald - Complete
};
```

**Color Ranges**:

| Progress | Color | Hex | Meaning |
|----------|-------|-----|---------|
| 0% | Gray | `#9CA3AF` | Not started |
| 1-24% | Red | `#EF4444` | Just started |
| 25-49% | Orange | `#F97316` | Some progress |
| 50-74% | Yellow | `#EAB308` | Halfway there |
| 75-99% | Green | `#22C55E` | Almost done |
| 100% | Emerald | `#10B981` | Complete |

### Asset-Level Progress

**Location**: `/components/project-table/AssetProgressBar.tsx`

```tsx
<div className="flex items-center gap-3">
  {/* Circular Progress Indicator */}
  <div className="relative w-10 h-10 flex-shrink-0">
    <svg className="w-10 h-10 transform -rotate-90">
      {/* Background circle */}
      <circle
        cx="20"
        cy="20"
        r="16"
        stroke="currentColor"
        strokeWidth="3"
        fill="none"
        className="text-gray-200 dark:text-gray-700"
      />
      {/* Progress circle */}
      <circle
        cx="20"
        cy="20"
        r="16"
        stroke={progressColor}
        strokeWidth="3"
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={circumference - (progress / 100) * circumference}
        className="transition-all duration-500 ease-out"
      />
    </svg>
    
    {/* Percentage text */}
    <div className="absolute inset-0 flex items-center justify-center">
      <span className="text-xs font-semibold" style={{ color: progressColor }}>
        {progress}%
      </span>
    </div>
  </div>
  
  {/* Action count */}
  <div className="flex flex-col">
    <span className="text-sm font-medium">
      {completedCount} / {totalCount}
    </span>
    <span className="text-xs text-muted-foreground">
      actions
    </span>
  </div>
</div>
```

**Features**:
- Circular progress indicator (SVG)
- Percentage text in center
- Color changes based on progress
- Smooth animation (500ms ease-out)
- Action count below (e.g., "3 / 5 actions")

### Project-Level Progress

**Location**: `/components/ProjectCard.tsx` (Mobile card)

```tsx
{/* Progress bar - Always visible */}
<div className="mt-3">
  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
    <div 
      className="h-1 rounded-full transition-all duration-300"
      style={{ 
        width: `${projectProgress}%`,
        backgroundColor: getProgressColorValue(projectProgress)
      }}
    />
  </div>
</div>
```

**Features**:
- Linear progress bar
- Full width of card
- Color based on progress
- Smooth animation (300ms)
- Always visible at bottom of ASSETS section

### Table View Progress

**Location**: `/components/project-table/renderProjectRow.tsx`

```tsx
// Asset name cell with inline progress
<div className="flex items-center justify-between gap-2 w-full">
  <span className={assetDone ? 'line-through text-muted-foreground' : ''}>
    {asset.title}
  </span>
  
  {hasActions && (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">
        {completedCount}/{totalActions}
      </span>
      <div className="w-12 bg-muted rounded-full h-1">
        <div
          className="h-1 rounded-full transition-all duration-300"
          style={{
            width: `${assetProgress}%`,
            backgroundColor: getProgressColorValue(assetProgress)
          }}
        />
      </div>
    </div>
  )}
</div>
```

**Features**:
- Mini progress bar in table cell
- Shows completion count (e.g., "3/5")
- Color-coded progress
- Only visible if actions exist

### Progress Update Flow

```
User checks action checkbox
  ↓
toggleAction() called
  ↓
Action.completed = true
  ↓
onChange(updatedActions) triggered
  ↓
Parent component receives new actions array
  ↓
calculateProjectProgress() recalculates
  ↓
Progress bar updates with new percentage
  ↓
Color recalculates via getProgressColorValue()
  ↓
UI re-renders with new progress
  ↓
Smooth animation plays (300ms or 500ms)
```

### Real-Time Updates

**Triggers Progress Recalculation**:
1. ✅ Checking/unchecking action
2. ✅ Adding new action
3. ✅ Deleting action
4. ✅ Status change to "Done" (auto-completes all)
5. ✅ Bulk workflow addition

**Does NOT Trigger**:
1. ❌ Editing action name only
2. ❌ Reordering actions
3. ❌ Expanding/collapsing asset

---

## Auto-Check System

### Overview

**Auto-Check Above** adalah fitur yang otomatis check semua actions yang berada DI ATAS action yang user check, following **sequential workflow logic**.

### User Setting

**Location**: `/components/ActionSettingsContext.tsx`

```typescript
interface ActionSettingsContextType {
  autoCheckAbove: boolean;
  setAutoCheckAbove: (value: boolean) => void;
}

// Default: true (enabled)
const [autoCheckAbove, setAutoCheckAbove] = useState(true);
```

**Settings UI**: 
- Location: Settings Page → Action Settings tab
- Toggle switch: "Auto-check actions above"
- Description: "When enabled, checking an action will automatically check all actions above it"
- Default: ON

### Implementation Logic

**Location**: `/components/AssetActionManager.tsx`

```typescript
const toggleAction = (id: string) => {
  const actionIndex = actions.findIndex(a => a.id === id);
  if (actionIndex === -1) return;

  const isChecking = !actions[actionIndex].completed;

  if (isChecking && autoCheckAbove) {
    // AUTO-CHECK ABOVE LOGIC
    const updatedActions = [...actions];
    
    for (let idx = 0; idx < actions.length; idx++) {
      if (idx < actionIndex) {
        // Auto-check all actions above
        updatedActions[idx] = { 
          ...actions[idx], 
          completed: true, 
          wasAutoChecked: true 
        };
      } else if (idx === actionIndex) {
        // Manually check this action (wasAutoChecked stays undefined)
        updatedActions[idx] = { 
          ...actions[idx], 
          completed: true, 
          wasAutoChecked: undefined 
        };
      } else {
        // Keep unchanged
        updatedActions[idx] = actions[idx];
      }
    }
    
    onChange(updatedActions);
  } else {
    // Normal toggle (unchecking or auto-check disabled)
    const updatedActions = actions.map(a => 
      a.id === id 
        ? { ...a, completed: !a.completed, wasAutoChecked: undefined } 
        : a
    );
    onChange(updatedActions);
  }
};
```

### Examples

#### Example 1: Auto-Check Above Enabled

**Initial State**:
```
☐ Reference
☐ Drafting
☐ Finishing
☐ Exporting
☐ Done
```

**User checks "Finishing"**:
```
☑ Reference      🎯  (auto-checked)
☑ Drafting       🎯  (auto-checked)
☑ Finishing          (manually checked)
☐ Exporting
☐ Done
```

#### Example 2: Auto-Check Above Disabled

**Initial State**:
```
☐ Reference
☐ Drafting
☐ Finishing
☐ Exporting
☐ Done
```

**User checks "Finishing"**:
```
☐ Reference
☐ Drafting
☑ Finishing          (manually checked)
☐ Exporting
☐ Done
```

#### Example 3: Unchecking Action

**Initial State**:
```
☑ Reference      🎯
☑ Drafting       🎯
☑ Finishing
☐ Exporting
☐ Done
```

**User unchecks "Finishing"**:
```
☑ Reference      🎯  (remains checked)
☑ Drafting       🎯  (remains checked)
☐ Finishing          (unchecked)
☐ Exporting
☐ Done
```

**Note**: Unchecking does NOT auto-uncheck actions above. Only forward progression is automatic.

### wasAutoChecked Flag Logic

| Scenario | wasAutoChecked Value |
|----------|---------------------|
| User manually checks action | `undefined` or `false` |
| Action auto-checked via "above" logic | `true` |
| User unchecks action | `undefined` (cleared) |
| Status "Done" auto-completes all | `true` |

### Visual Indicators

**Badge Display**:
```tsx
{action.wasAutoChecked && (
  <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
    🎯
  </Badge>
)}
```

**Badge Styling**:
- Emoji: 🎯 (target/bullseye)
- Size: Very small (10px text)
- Variant: Outline
- Placement: Right side of action name

### Benefits

1. **Efficiency**: User tidak perlu check satu-satu
2. **Workflow Logic**: Enforces sequential completion
3. **Clear Tracking**: wasAutoChecked flag shows which were auto
4. **Flexible**: Can be disabled via settings

### Edge Cases

#### Case 1: First Action Checked
```
Initial: ☐ Action 1, ☐ Action 2, ☐ Action 3
Check Action 1: ☑ Action 1 (no actions above to auto-check)
```

#### Case 2: Last Action Checked
```
Initial: ☐ Action 1, ☐ Action 2, ☐ Action 3
Check Action 3: ☑ Action 1 🎯, ☑ Action 2 🎯, ☑ Action 3
```

#### Case 3: Already Completed Actions
```
Initial: ☑ Action 1, ☑ Action 2, ☐ Action 3, ☐ Action 4
Check Action 4: ☑ Action 1, ☑ Action 2, ☑ Action 3 🎯, ☑ Action 4
(Only Action 3 gets wasAutoChecked flag)
```

---

## Auto-Trigger System

### Overview

**Auto-Trigger** adalah fitur yang otomatis update project status ketika user check action yang nama-nya match dengan manual status name.

### Status Configuration

**Location**: Database - Status object

```typescript
interface Status {
  id: string;
  name: string;                       // e.g., "Done", "On Hold"
  color: string;
  is_manual: boolean;                 // Manual vs Auto status
  auto_trigger_from_action: boolean;  // Enable auto-trigger
  displayIn: 'active' | 'archive';
  // ... other fields
}
```

**Key Fields**:
- `is_manual: true` = Status is manually set, preserved from auto-updates
- `auto_trigger_from_action: true` = Enable auto-trigger when action name matches

### Detection Logic

**Location**: `/components/StatusContext.tsx`

```typescript
const shouldAutoTriggerStatus = (actionName: string) => {
  const actionLower = actionName.toLowerCase().trim();
  
  // Find status with matching name and auto_trigger enabled
  const matchingStatus = statuses.find(
    s => s.name.toLowerCase().trim() === actionLower 
      && s.auto_trigger_from_action === true
  );
  
  if (matchingStatus) {
    console.log(`Auto-trigger match: action "${actionName}" → status "${matchingStatus.name}"`);
    return { shouldTrigger: true, statusName: matchingStatus.name };
  }
  
  return { shouldTrigger: false };
};
```

**Matching Rules**:
1. **Case-insensitive**: "Done" = "done" = "DONE"
2. **Trimmed whitespace**: " Done " = "Done"
3. **Exact match**: "Done" ≠ "Almost Done"
4. **Must have flag**: `auto_trigger_from_action === true`

### Trigger Implementation

**Location**: `/components/ProjectCard.tsx` (Mobile) or table row handler

```typescript
const handleActionToggle = (assetId: string, actionId: string, completed: boolean) => {
  const asset = project.actionable_items?.find(a => a.id === assetId);
  const action = asset?.actions?.find(a => a.id === actionId);
  
  if (!action) return;
  
  // Check if should auto-trigger
  const { shouldTrigger, statusName } = shouldAutoTriggerStatus(action.name);
  
  // Update actions
  const updatedAssets = (project.actionable_items || []).map(asset => {
    if (asset.id === assetId) {
      const updatedActions = (asset.actions || []).map(a => 
        a.id === actionId 
          ? { 
              ...a, 
              completed, 
              wasAutoChecked: completed && shouldTrigger ? true : a.wasAutoChecked 
            } 
          : a
      );
      return { ...asset, actions: updatedActions };
    }
    return asset;
  });
  
  // Auto-trigger logic
  if (completed && shouldTrigger && statusName) {
    console.log(`🎯 Auto-trigger: "${action.name}" → updating status to "${statusName}"`);
    
    // Update BOTH actions AND status
    onProjectUpdate(project.id, { 
      actionable_items: updatedAssets,
      status: statusName
    });
    
    toast.success(`Action completed • Status updated to "${statusName}"`);
  } else {
    // Just update actions
    onProjectUpdate(project.id, { actionable_items: updatedAssets });
    toast.success(completed ? 'Action completed' : 'Action unchecked');
  }
};
```

### Example Scenarios

#### Scenario 1: "Done" Action

**Setup**:
- Status "Done" has `auto_trigger_from_action: true`
- Asset has action named "Done"

**Flow**:
```
User checks "Done" action
  ↓
shouldAutoTriggerStatus("Done") → { shouldTrigger: true, statusName: "Done" }
  ↓
Action.completed = true
Action.wasAutoChecked = true
  ↓
Project.status = "Done"
  ↓
Toast: "Action completed • Status updated to "Done""
  ↓
Card header turns green (Done status color)
```

#### Scenario 2: "On Hold" Action

**Setup**:
- Status "On Hold" has `auto_trigger_from_action: true`
- Asset has action named "On Hold"

**Flow**:
```
User checks "On Hold" action
  ↓
shouldAutoTriggerStatus("On Hold") → { shouldTrigger: true, statusName: "On Hold" }
  ↓
Action.completed = true
Action.wasAutoChecked = true
  ↓
Project.status = "On Hold"
  ↓
Toast: "Action completed • Status updated to "On Hold""
```

#### Scenario 3: "Shoot" Action (No Trigger)

**Setup**:
- No status named "Shoot"
- Asset has action named "Shoot"

**Flow**:
```
User checks "Shoot" action
  ↓
shouldAutoTriggerStatus("Shoot") → { shouldTrigger: false }
  ↓
Action.completed = true
Action.wasAutoChecked = undefined
  ↓
Project.status = unchanged
  ↓
Toast: "Action completed"
```

### Visual Indicators

#### Target Badge

**Location**: Next to manual trigger actions in grouped view

```tsx
<Badge 
  variant="outline" 
  className="text-[9px] px-1 py-0 h-4"
  title={`Will update status to "${statusName}"`}
>
  → {statusName}
</Badge>
```

**Styling**:
- Arrow prefix: →
- Status name: Dynamic (e.g., "Done", "On Hold")
- Tooltip: Full explanation
- Size: Very small (9px text)

#### Section Header

```tsx
<div className="flex items-center gap-1.5 px-1.5 py-0.5">
  <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
    Manual Trigger Actions
  </span>
  <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5">
    🖐️
  </Badge>
</div>
```

### Benefits

1. **Workflow Automation**: Reduces manual status updates
2. **Consistency**: Status always reflects action completion
3. **User Intent**: Action names like "Done" clearly indicate intent
4. **Visibility**: User sees target status before checking

### Common Use Cases

| Action Name | Status Triggered | Use Case |
|-------------|-----------------|----------|
| Done | Done | Final completion |
| Submit to Client | Done | Deliverable submission |
| On Hold | On Hold | Pause work |
| Review | Review | Ready for feedback |
| Lightroom | Lightroom | Photo editing phase |
| Babysit | Babysit | Client revision phase |

---

## Manual Status Preservation

### Overview

**Manual Status Preservation** memastikan status yang di-set user secara EXPLICIT tidak di-override oleh auto-calculation logic.

### is_manual Flag

**Location**: Status object in database

```typescript
interface Status {
  id: string;
  name: string;
  color: string;
  is_manual: boolean;  // ← Key flag
  auto_trigger_from_action: boolean;
  displayIn: 'active' | 'archive';
}
```

**Values**:
- `is_manual: true` = Manual status (preserved from auto-updates)
- `is_manual: false` = Auto status (can be auto-updated based on progress)

### Detection Logic

**Location**: `/components/StatusContext.tsx`

```typescript
const isManualStatus = (statusName: string) => {
  const statusLower = statusName.toLowerCase().trim();
  const status = statuses.find(
    s => s.name.toLowerCase().trim() === statusLower
  );
  
  let result: boolean;
  
  if (status?.is_manual === true) {
    // Explicit manual status
    result = true;
  } else if (status?.is_manual === false) {
    // Explicit auto status
    result = false;
  } else {
    // FALLBACK: Check against common patterns
    const commonManualPatterns = [
      'done', 'canceled', 'cancelled', 'on hold', 'hold',
      'review', 'on review', 'in review', 'babysit',
      'lightroom', 'light room', 'lr', 'on list lightroom',
      'in queue lightroom', 'queue lightroom', 'lightroom queue',
      'lr queue', 'awaiting lightroom', 'pending lightroom'
    ];
    
    result = commonManualPatterns.includes(statusLower);
  }
  
  return result;
};
```

**Fallback Logic**:
- If `is_manual` field is undefined/null, check against common patterns
- Handles legacy data or statuses created before migration

### Preservation in Action

**Location**: `/components/ProjectCard.tsx` (useEffect for auto-status)

```typescript
useEffect(() => {
  if (!onProjectUpdate || projectProgress === null) return;

  // ⚠️ CRITICAL: Check if status is manual
  const isManual = isManualStatus(project.status);
  
  console.log(`[ProjectCard] Auto-status check for "${project.name}":`, {
    status: project.status,
    isManual,
    progress: projectProgress,
    willSkip: isManual
  });
  
  if (isManual) {
    console.log(`[ProjectCard] ✅ Skipping auto-status for manual status: ${project.status}`);
    return; // STOP - Do not auto-calculate
  }

  // ... rest of auto-status logic
}, [projectProgress, project.status, isManualStatus]);
```

**Key Point**: If `isManualStatus() === true`, ALL auto-status logic is skipped.

### Example Scenarios

#### Scenario 1: Manual Status "On Hold"

```
Project Status: "On Hold" (is_manual: true)
Progress: 50% (3/6 actions completed)
  ↓
Auto-status logic runs
  ↓
isManualStatus("On Hold") → true
  ↓
Skip auto-update
  ↓
Status remains: "On Hold" ✅
```

**Without Preservation**:
```
Project Status: "On Hold"
Progress: 50%
  ↓
Auto-status would set to: "In Progress" ❌
```

#### Scenario 2: Auto Status "In Progress"

```
Project Status: "In Progress" (is_manual: false)
Progress: 100% (6/6 actions completed)
  ↓
Auto-status logic runs
  ↓
isManualStatus("In Progress") → false
  ↓
Continue with auto-update
  ↓
Status updated to: "Done" ✅
```

#### Scenario 3: Unchecking Actions in Manual Status

```
Project Status: "Done" (is_manual: true)
Progress: 100% → 80% (user unchecks 1 action)
  ↓
Auto-status logic runs
  ↓
isManualStatus("Done") → true
  ↓
Skip auto-update
  ↓
Status remains: "Done" ✅
```

**Reason**: User explicitly set to "Done", should not auto-revert.

### Setting Manual Status

**Location**: Status dropdown in Project Card or Detail Sidebar

```typescript
// When user manually changes status
onProjectUpdate(project.id, { status: newStatus });
```

**Important**: When status is manually changed by user, it's considered "set explicitly" and should be preserved. However, the `is_manual` flag in database determines if FUTURE auto-updates should skip it.

### Common Manual Statuses

| Status Name | is_manual | Reason |
|-------------|-----------|--------|
| Done | `true` | Explicit completion decision |
| Canceled | `true` | Explicit cancellation |
| On Hold | `true` | Explicit pause decision |
| Review | `true` | Explicit review phase |
| Babysit | `true` | Client-specific phase |
| Lightroom | `true` | Tool-specific phase |
| Not Started | `false` | Can be auto-updated |
| In Progress | `false` | Can be auto-updated |

### Benefits

1. **User Control**: User decisions are respected
2. **Workflow Flexibility**: Support custom phases
3. **No Surprises**: Status won't change unexpectedly
4. **Clear Intent**: Manual statuses indicate explicit decisions

---

## UI Components

### 1. AssetActionManager

**Location**: `/components/AssetActionManager.tsx`

**Purpose**: Main component for managing actions within an Asset

**Props**:
```typescript
interface AssetActionManagerProps {
  actions: AssetAction[];
  onChange: (actions: AssetAction[]) => void;
  readOnly?: boolean;
  compact?: boolean;
  hideProgress?: boolean;
}
```

**Features**:
- Add new action (via preset or custom)
- Edit action name (inline)
- Toggle action completion
- Delete action
- Add workflow (bulk actions)
- Progress bar display
- Clear all confirmation

**Key Sections**:

#### A. Action List
```tsx
{actions.map((action, index) => (
  <div key={action.id} className="flex items-center gap-2 p-2 rounded hover:bg-muted/50">
    {/* Checkbox */}
    <Checkbox
      checked={action.completed}
      onCheckedChange={() => toggleAction(action.id)}
      disabled={readOnly}
    />
    
    {/* Action name (editable) */}
    {editingId === action.id ? (
      <Input
        value={editingName}
        onChange={(e) => setEditingName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') saveEdit(action.id);
          if (e.key === 'Escape') cancelEdit();
        }}
      />
    ) : (
      <span className={action.completed ? 'line-through text-muted-foreground' : ''}>
        {action.name}
      </span>
    )}
    
    {/* wasAutoChecked badge */}
    {action.wasAutoChecked && (
      <Badge variant="outline" className="text-xs">🎯</Badge>
    )}
    
    {/* Action buttons */}
    <Button onClick={() => startEditing(action)}>
      <Edit2 />
    </Button>
    <Button onClick={() => deleteAction(action.id)}>
      <X />
    </Button>
  </div>
))}
```

#### B. Add Action Controls
```tsx
<Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
  <PopoverTrigger asChild>
    <Button variant="outline" size="sm">
      <Plus /> Add Action
    </Button>
  </PopoverTrigger>
  
  <PopoverContent>
    <Command>
      <CommandInput 
        placeholder="Search or type new action..." 
        value={newActionName}
        onValueChange={setNewActionName}
      />
      <CommandList>
        <CommandEmpty>
          <Button onClick={() => addAction(newActionName)}>
            <Plus /> Create "{newActionName}"
          </Button>
        </CommandEmpty>
        <CommandGroup heading="Presets">
          {presets.map((preset) => (
            <CommandItem onSelect={() => addAction(preset)}>
              {preset}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  </PopoverContent>
</Popover>
```

#### C. Progress Display
```tsx
{!hideProgress && actions.length > 0 && (
  <div className="flex items-center gap-2 mt-2">
    <div className="flex-1 bg-muted rounded-full h-2">
      <div
        className="h-2 rounded-full transition-all duration-300"
        style={{
          width: `${progress}%`,
          backgroundColor: getProgressColorValue(progress)
        }}
      />
    </div>
    <span className="text-xs font-medium">
      {progress}%
    </span>
  </div>
)}
```

### 2. AssetProgressBar

**Location**: `/components/project-table/AssetProgressBar.tsx`

**Purpose**: Circular progress indicator for Asset actions

**Features**:
- SVG circular progress
- Percentage display in center
- Color-coded based on progress
- Action count text

**Implementation**:
```tsx
<div className="flex items-center gap-3">
  {/* Circular indicator */}
  <div className="relative w-10 h-10">
    <svg className="w-10 h-10 transform -rotate-90">
      {/* Background circle */}
      <circle
        cx="20" cy="20" r="16"
        stroke="currentColor"
        strokeWidth="3"
        fill="none"
        className="text-gray-200 dark:text-gray-700"
      />
      
      {/* Progress arc */}
      <circle
        cx="20" cy="20" r="16"
        stroke={progressColor}
        strokeWidth="3"
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={circumference - (progress / 100) * circumference}
        className="transition-all duration-500"
      />
    </svg>
    
    {/* Center percentage */}
    <div className="absolute inset-0 flex items-center justify-center">
      <span className="text-xs font-semibold" style={{ color: progressColor }}>
        {progress}%
      </span>
    </div>
  </div>
  
  {/* Action count */}
  <div className="flex flex-col">
    <span className="text-sm font-medium">
      {completedCount} / {totalCount}
    </span>
    <span className="text-xs text-muted-foreground">
      actions
    </span>
  </div>
</div>
```

### 3. Project Table Row (Desktop)

**Location**: `/components/project-table/renderProjectRow.tsx`

**Purpose**: Table row rendering with expandable assets and inline actions

**Features**:
- Collapsible asset rows
- Inline action checkboxes
- Progress indicators
- Group headers for manual trigger actions

**Key Implementation**:

#### A. Asset Row
```tsx
<tr className="bg-muted/30">
  <td colSpan={columnCount}>
    <div className="flex items-center justify-between p-2">
      {/* Asset info */}
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${assetDone ? 'bg-green-500' : 'bg-muted'}`} />
        <span>{asset.title}</span>
      </div>
      
      {/* Progress */}
      {hasActions && <AssetProgressBar ... />}
      
      {/* Expand button */}
      <Button onClick={() => toggleAsset(asset.id)}>
        <ChevronDown className={expanded ? '' : '-rotate-90'} />
      </Button>
    </div>
  </td>
</tr>
```

#### B. Action Rows (Expanded)
```tsx
{expanded && asset.actions && (
  <>
    {/* Manual Trigger Actions */}
    {manualTriggerActions.length > 0 && (
      <>
        <tr className="bg-muted/10">
          <td colSpan={columnCount}>
            <div className="px-4 py-1 text-xs uppercase">
              Manual Trigger Actions 🖐️
            </div>
          </td>
        </tr>
        
        {manualTriggerActions.map(action => (
          <tr key={action.id}>
            <td colSpan={columnCount}>
              <label className="flex items-center gap-2 px-6 py-2">
                <Checkbox
                  checked={action.completed}
                  onCheckedChange={() => handleToggle(action.id)}
                />
                <span>{action.name}</span>
                <Badge>→ {statusName}</Badge>
              </label>
            </td>
          </tr>
        ))}
      </>
    )}
    
    {/* Regular Actions */}
    {regularActions.length > 0 && (
      <>
        {manualTriggerActions.length > 0 && (
          <tr className="bg-muted/10">
            <td colSpan={columnCount}>
              <div className="px-4 py-1 text-xs uppercase">
                Regular Actions
              </div>
            </td>
          </tr>
        )}
        
        {regularActions.map(action => (
          <tr key={action.id}>
            <td colSpan={columnCount}>
              <label className="flex items-center gap-2 px-6 py-2">
                <Checkbox
                  checked={action.completed}
                  onCheckedChange={() => handleToggle(action.id)}
                />
                <span>{action.name}</span>
                {action.wasAutoChecked && <Badge>🎯</Badge>}
              </label>
            </td>
          </tr>
        ))}
      </>
    )}
  </>
)}
```

### 4. Mobile Card Expandable View

**Location**: `/components/ProjectCard.tsx`

**Purpose**: Mobile-optimized collapsible assets with actions

**Features**:
- Two-level collapsible (Assets → Actions)
- Auto-grouping by trigger type
- Touch-optimized checkboxes
- Progress bar at bottom

**Implementation**: (See Grouping System section for full code)

---

## Special Conditions & Edge Cases

### 1. Empty Actions Array

**Condition**: Asset has no actions (`actions: []` or `actions: undefined`)

**Behavior**:
- Progress calculation returns `null`
- No progress bar displayed
- No action list shown
- Asset completion based on `is_completed` flag only

**Code**:
```typescript
if (!asset.actions || asset.actions.length === 0) {
  // No actions - use is_completed flag
  return asset.is_completed ? 100 : 0;
}
```

### 2. Single-Action Projects

**Condition**: Project has exactly 1 total action across all assets

**Problem**: Progress can only be 0% or 100% (no middle ground)

**Solution**: Preserve "In Progress" status at 0%

**Code**:
```typescript
const totalActionCount = (project.actionable_items || []).reduce((sum, asset) => {
  return sum + (asset.actions?.length || 0);
}, 0);

if (projectProgress === 0 && project.status !== 'Not Started') {
  if (project.status === 'In Progress' && totalActionCount === 1) {
    console.log(`Preserving "In Progress" for single-action project at 0%`);
    newStatus = null; // Do NOT revert
  } else {
    newStatus = 'Not Started';
  }
}
```

**Example**:
```
Asset: "Hero Banner"
  └─ Action: "Done" ☐
  
Status: "In Progress"
Progress: 0%

Normal behavior: Would revert to "Not Started"
Special behavior: Preserve "In Progress" ✅
```

### 3. All Actions Completed but Status Not "Done"

**Condition**: Progress = 100% but status is not "Done"

**Behavior**: Auto-update to "Done" (unless manual status)

**Code**:
```typescript
if (projectProgress === 100 && project.status !== 'Done') {
  if (!isManualStatus(project.status)) {
    newStatus = 'Done';
  }
}
```

### 4. Status Changed to "Done" with Incomplete Actions

**Condition**: User manually sets status to "Done" while actions are incomplete

**Behavior**: Auto-complete ALL actions in ALL assets

**Code**:
```typescript
if (status === 'Done' && project.actionable_items && project.actionable_items.length > 0) {
  const updatedAssets = project.actionable_items.map(asset => ({
    ...asset,
    status: 'Done',
    is_completed: true,
    actions: asset.actions?.map(action => ({
      ...action,
      completed: true,
      wasAutoChecked: true
    }))
  }));
  
  onProjectUpdate(project.id, { 
    status, 
    actionable_items: updatedAssets 
  });
}
```

### 5. Unchecking Action in "Done" Project

**Condition**: Project status is "Done" (manual), user unchecks action

**Behavior**:
- Action unchecked ✅
- Progress updated ✅
- Status remains "Done" ✅ (manual preservation)

**Code**:
```typescript
// In useEffect auto-status
if (isManualStatus('Done')) {
  return; // Skip auto-update
}
```

### 6. Auto-Check Above with Mixed Completion

**Condition**: Some actions already completed, user checks action below them

**Example**:
```
Initial:
☑ Action 1
☑ Action 2
☐ Action 3
☐ Action 4
☐ Action 5

User checks Action 4:
☑ Action 1        (already completed, no change)
☑ Action 2        (already completed, no change)
☑ Action 3    🎯  (auto-checked, wasAutoChecked: true)
☑ Action 4        (manually checked)
☐ Action 5
```

**Code**:
```typescript
for (let idx = 0; idx < actions.length; idx++) {
  if (idx < actionIndex) {
    // Only set wasAutoChecked if currently uncompleted
    if (!actions[idx].completed) {
      updatedActions[idx] = { 
        ...actions[idx], 
        completed: true, 
        wasAutoChecked: true 
      };
    } else {
      updatedActions[idx] = actions[idx]; // Keep as is
    }
  }
}
```

### 7. Workflow Addition to Asset with Existing Actions

**Condition**: Asset already has actions, user adds workflow

**Behavior**:
- New actions appended to end
- Existing actions preserved
- No duplication check (user can have duplicate names)

**Code**:
```typescript
const addWorkflowActions = (workflowActions: string[]) => {
  const newActions: AssetAction[] = workflowActions.map((actionName, index) => ({
    id: `action_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
    name: actionName,
    completed: false
  }));
  
  onChange([...actions, ...newActions]);
};
```

### 8. Public View (Not Logged In)

**Condition**: User is not authenticated

**Behavior**:
- All checkboxes disabled
- Edit/delete buttons hidden
- Add action buttons hidden
- Progress displayed as read-only

**Code**:
```tsx
{isPublicView ? (
  <Checkbox checked={action.completed} disabled />
) : (
  <Checkbox 
    checked={action.completed}
    onCheckedChange={() => toggleAction(action.id)}
  />
)}
```

### 9. Action Name Case Sensitivity

**Condition**: Action name "done" vs Status name "Done"

**Behavior**: Case-insensitive matching for auto-trigger

**Code**:
```typescript
const actionLower = actionName.toLowerCase().trim();
const statusLower = status.name.toLowerCase().trim();

if (actionLower === statusLower) {
  // Match found
}
```

### 10. Delete Asset with Actions

**Condition**: User deletes asset that has actions

**Behavior**:
- Asset removed from array
- Actions deleted with asset
- Progress recalculated
- Status may auto-update (if not manual)

**Code**:
```typescript
const deleteAsset = (assetId: string) => {
  const updatedAssets = project.actionable_items.filter(a => a.id !== assetId);
  onProjectUpdate(project.id, { actionable_items: updatedAssets });
};
```

---

## Implementation Details

### Database Operations

#### 1. Create Project with Actions

```typescript
const createProject = async (projectData: Partial<Project>) => {
  const project: Project = {
    id: `project_${Date.now()}`,
    name: projectData.name,
    status: projectData.status || 'Not Started',
    actionable_items: [
      {
        id: `asset_001`,
        title: 'Main Deliverable',
        actions: [
          { id: 'action_001', name: 'Reference', completed: false },
          { id: 'action_002', name: 'Drafting', completed: false },
          { id: 'action_003', name: 'Done', completed: false }
        ]
      }
    ],
    // ... other fields
  };
  
  await kv.set(`project:${project.id}`, project);
  return project;
};
```

#### 2. Update Actions

```typescript
const updateActions = async (projectId: string, assetId: string, actions: AssetAction[]) => {
  const project = await kv.get(`project:${projectId}`);
  
  const updatedAssets = project.actionable_items.map(asset => 
    asset.id === assetId 
      ? { ...asset, actions } 
      : asset
  );
  
  await kv.set(`project:${projectId}`, {
    ...project,
    actionable_items: updatedAssets
  });
};
```

#### 3. Batch Update (Status + Actions)

```typescript
const updateProjectWithActions = async (
  projectId: string, 
  status: string, 
  assets: ActionableItem[]
) => {
  const project = await kv.get(`project:${projectId}`);
  
  await kv.set(`project:${projectId}`, {
    ...project,
    status,
    actionable_items: assets
  });
};
```

### Performance Considerations

#### 1. Progress Calculation Caching

**Problem**: Recalculating on every render is expensive

**Solution**: Use `useMemo` or calculate in useEffect

```typescript
const projectProgress = useMemo(() => {
  return calculateProjectProgress(project.actionable_items);
}, [project.actionable_items]);
```

#### 2. Debounced Updates

**Problem**: Rapid checkbox clicks cause multiple DB writes

**Solution**: Debounce action updates (optional)

```typescript
import { useDebouncedUpdate } from '../hooks/useDebouncedUpdate';

const debouncedUpdate = useDebouncedUpdate(
  (actions: AssetAction[]) => {
    onProjectUpdate(project.id, { actionable_items: updatedAssets });
  },
  300 // 300ms delay
);
```

#### 3. Optimistic Updates

**Current**: UI waits for DB response
**Better**: Update UI immediately, handle errors

```typescript
const toggleAction = async (id: string) => {
  // Optimistic update
  const optimisticActions = actions.map(a => 
    a.id === id ? { ...a, completed: !a.completed } : a
  );
  setLocalActions(optimisticActions);
  
  try {
    await updateActionsInDB(optimisticActions);
  } catch (error) {
    // Revert on error
    setLocalActions(actions);
    toast.error('Failed to update action');
  }
};
```

### Testing Scenarios

#### Test 1: Basic Action Toggle
```
1. Create asset with 3 actions
2. Check action 2
3. Verify: action 2 completed
4. Verify: Progress updated
5. Verify: No other actions affected
```

#### Test 2: Auto-Check Above
```
1. Enable auto-check in settings
2. Create asset with 5 actions
3. Check action 4
4. Verify: Actions 1-3 auto-checked with 🎯 badge
5. Verify: Action 4 checked without badge
6. Verify: Action 5 unchecked
```

#### Test 3: Auto-Trigger Status
```
1. Create status "Done" with auto_trigger: true
2. Create asset with action "Done"
3. Check "Done" action
4. Verify: Project status updated to "Done"
5. Verify: Toast shows both messages
6. Verify: Card header color changes
```

#### Test 4: Manual Status Preservation
```
1. Create project with status "On Hold" (manual)
2. Complete all actions (100% progress)
3. Verify: Status remains "On Hold"
4. Verify: No auto-update to "Done"
```

#### Test 5: Status to "Done" Auto-Complete
```
1. Create project with 3 assets, 10 total actions
2. Complete 5 actions manually
3. Change status to "Done"
4. Verify: All 10 actions completed
5. Verify: All have wasAutoChecked: true
```

---

## Visual Examples

### Example 1: Photography Project

**Screenshot Reference**: (From user's provided image)

```
Asset: Hero Banner
  ├─ ☐ Reference
  ├─ ☐ Reference
  ├─ ☐ Drafting
  ├─ ☐ Layouting
  ├─ ☐ Finishing
  ├─ ☐ Exporting
  ├─ ☐ Compressing
  ├─ ☐ Uploading
  ├─ ☐ Lightroom
  └─ ☐ Done

Status: Not Started
Progress: 0%
```

**After checking "Finishing" with auto-check enabled**:

```
Asset: Hero Banner
  ├─ ☑ Reference         🎯
  ├─ ☑ Reference         🎯
  ├─ ☑ Drafting          🎯
  ├─ ☑ Layouting         🎯
  ├─ ☑ Finishing
  ├─ ☐ Exporting
  ├─ ☐ Compressing
  ├─ ☐ Uploading
  ├─ ☐ Lightroom
  └─ ☐ Done

Status: In Progress (auto-updated from 0% → 50%)
Progress: 50% (5/10)
```

**After checking "Done" (manual trigger action)**:

```
Asset: Hero Banner
  ├─ ☑ Reference         🎯
  ├─ ☑ Reference         🎯
  ├─ ☑ Drafting          🎯
  ├─ ☑ Layouting         🎯
  ├─ ☑ Finishing
  ├─ ☑ Exporting         🎯
  ├─ ☑ Compressing       🎯
  ├─ ☑ Uploading         🎯
  ├─ ☑ Lightroom         🎯
  └─ ☑ Done

Status: Done (auto-triggered by "Done" action)
Progress: 100%
Toast: "Action completed • Status updated to "Done""
```

### Example 2: Design Project with Grouping

**Mobile Card View (Expanded)**:

```
┌──────────────────────────────────────────┐
│ 🎨 Brand Identity Design                 │
│ Status: In Progress                      │
├──────────────────────────────────────────┤
│ ∨ ASSETS                      2/3 done  │
│ ┌────────────────────────────────────┐  │
│ │ ∨ ● Design Assets            4/8   │  │
│ │ ┌──────────────────────────────┐   │  │
│ │ │ MANUAL TRIGGER ACTIONS 🖐️   │   │  │
│ │ │ ☐ Submit     [→ Done]        │   │  │
│ │ │ ☐ On Hold    [→ On Hold]     │   │  │
│ │ │                              │   │  │
│ │ │ REGULAR ACTIONS              │   │  │
│ │ │ ☑ Research                   │   │  │
│ │ │ ☑ Sketch              🎯     │   │  │
│ │ │ ☑ Mockup              🎯     │   │  │
│ │ │ ☑ Refine              🎯     │   │  │
│ │ │ ☐ Export                     │   │  │
│ │ │ ☐ Present                    │   │  │
│ │ └──────────────────────────────┘   │  │
│ └────────────────────────────────────┘  │
│ ▓▓▓▓▓▓░░░░░░ 50%                       │
└──────────────────────────────────────────┘
```

**Desktop Table View**:

```
┌───────────────────────────────────────────────────────────────────────┐
│ PROJECT NAME          │ STATUS        │ ASSETS    │ DELIVERABLES      │
├───────────────────────────────────────────────────────────────────────┤
│ Brand Identity Design │ In Progress   │ [v] 2/3   │ Q1 2024           │
│   ● Design Assets (50%)                                               │
│       MANUAL TRIGGER ACTIONS 🖐️                                       │
│       ☐ Submit to Client  [→ Done]                                    │
│       ☐ On Hold          [→ On Hold]                                  │
│       REGULAR ACTIONS                                                 │
│       ☑ Research                                                      │
│       ☑ Sketch                                                  🎯    │
│       ☑ Mockup                                                  🎯    │
│       ☑ Refine                                                  🎯    │
│       ☐ Export                                                        │
│       ☐ Present                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

---

## Summary

### Core Concepts

1. **Actions** = Granular tasks within Assets
2. **Auto-Check Above** = Sequential workflow automation
3. **Auto-Trigger** = Status updates from action names
4. **Manual Preservation** = User control over status
5. **Progress Tracking** = Visual completion indicators
6. **wasAutoChecked Flag** = Transparency in automation

### Data Flow

```
User Interaction
  ↓
toggleAction() / handleActionToggle()
  ↓
Update action.completed state
  ↓
Check auto-check above (if enabled)
  ↓
Check auto-trigger status (if name matches)
  ↓
Update database (actions + status if needed)
  ↓
Recalculate progress
  ↓
Check auto-status update (if not manual)
  ↓
UI re-renders with new state
  ↓
Toast notification
```

### Best Practices

1. **Always use wasAutoChecked flag** untuk transparency
2. **Preserve manual statuses** - never override user decisions
3. **Group actions** by trigger type untuk clarity
4. **Show target badges** untuk manual trigger actions
5. **Debounce rapid updates** untuk performance
6. **Handle edge cases** seperti single-action projects
7. **Clear naming conventions** for auto-trigger matches
8. **Progress colors** for visual feedback
9. **Smooth animations** for better UX
10. **Public view protection** - disable all modifications

### Key Files Reference

| File | Purpose |
|------|---------|
| `/types/project.ts` | Type definitions |
| `/utils/taskProgress.ts` | Progress calculations |
| `/components/StatusContext.tsx` | Status logic & auto-trigger |
| `/components/AssetActionManager.tsx` | Action management UI |
| `/components/ProjectCard.tsx` | Mobile card with actions |
| `/components/project-table/renderProjectRow.tsx` | Desktop table rows |
| `/components/ActionSettingsContext.tsx` | User settings |

---

## Conclusion

Action System adalah **core feature** yang powerful untuk granular task management dengan intelligent automation. Kombinasi dari auto-check above, auto-trigger status, manual preservation, dan visual grouping menciptakan workflow yang efficient dan user-friendly.

Key strengths:
- ✅ Granular control with checkable actions
- ✅ Intelligent automation via auto-check and auto-trigger
- ✅ User control via manual status preservation
- ✅ Clear visibility via grouping and badges
- ✅ Real-time feedback via progress bars
- ✅ Flexible configuration via settings

System ini memungkinkan user untuk track progress dengan detail sambil tetap menjaga efficiency melalui automation features.

**Status**: Fully documented and production-ready ✅

---

*Last updated: [Current Date]*
*Version: 1.0*
*Author: AI Assistant*
