# Project Row Shared Component Planning

**Created:** 2025-01-12  
**Status:** Planning Phase  
**Priority:** High (Code Quality & Maintainability)  
**Base Component:** Group by Status table row

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current State Analysis](#current-state-analysis)
3. [Component Anatomy](#component-anatomy)
4. [Similarities & Differences](#similarities--differences)
5. [Proposed Solution](#proposed-solution)
6. [Implementation Strategy](#implementation-strategy)
7. [Component API Design](#component-api-design)
8. [Migration Plan](#migration-plan)
9. [Testing Strategy](#testing-strategy)
10. [Success Metrics](#success-metrics)

---

## 📊 Executive Summary

### Problem Statement
Currently, project rows in the table view are rendered in two different grouping modes:
1. **Group by Status** - Projects grouped by status, then by vertical within each status
2. **Group by Vertical** - Projects grouped by vertical directly

Both modes render nearly identical table rows with ~95% shared code, leading to:
- **Code duplication:** Same row structure repeated in multiple places
- **Maintenance burden:** Changes must be applied in multiple locations
- **Inconsistency risk:** Row behavior may diverge over time
- **Testing complexity:** Same tests needed for both modes

### Proposed Solution
Create a **shared `ProjectTableRow` component** that can be used in both grouping modes, with configuration-based differences for vertical handling and header rendering.

### Benefits
- ✅ **DRY Principle:** Single source of truth for row rendering
- ✅ **Consistency:** Identical behavior across grouping modes
- ✅ **Maintainability:** Changes in one place
- ✅ **Type Safety:** Shared TypeScript interfaces
- ✅ **Scalability:** Easy to add new grouping modes

---

## 🔍 Current State Analysis

### Current File Structure
```
/components/
└── ProjectTable.tsx
    ├── Group by Status rendering (line 782-1300+)
    │   ├── Status group headers
    │   ├── Vertical sub-headers within status
    │   └── Project rows
    └── Group by Vertical rendering (line 1300+)
        ├── Vertical group headers
        └── Project rows
```

### Code Duplication Metrics
```
Total ProjectTable.tsx: ~1,800 lines

Group by Status:
├── Row rendering: ~400 lines (line 921-1320)
├── Unique: Status grouping logic
└── Shared: 95% of row structure

Group by Vertical:
├── Row rendering: ~380 lines (estimated)
├── Unique: Vertical grouping logic
└── Shared: 95% of row structure

Duplicated Code: ~380 lines (row rendering)
Potential Savings: ~350 lines after refactor
```

### Screenshot Analysis

From the provided screenshot, the project row contains:

```
┌─────────────────────────────────────────────────────────────────────┐
│ 📦 Project Name Column (280px)                                      │
│    ├── Draft badge (conditional)                                    │
│    ├── Project name (truncated)                                     │
│    ├── Description (optional, truncated)                            │
│    └── Asset Progress Section                                       │
│        ├── Asset indicator (2 assets)                               │
│        ├── Progress bar (17% with color gradient)                   │
│        └── Time indicator (3 days left - urgency color)             │
├─────────────────────────────────────────────────────────────────────┤
│ 🏷️ Type Column (140px)                                              │
│    └── Type badges (Hero Banner, Bottom Banner)                     │
├─────────────────────────────────────────────────────────────────────┤
│ 📊 Status Column (140px)                                            │
│    └── Status badge (In Progress - yellow)                          │
├─────────────────────────────────────────────────────────────────────┤
│ 👥 Collaborators Column (160px)                                     │
│    └── Avatar group (Nindya, Yossie)                                │
├─────────────────────────────────────────────────────────────────────┤
│ 📅 Start Date Column (120px)                                        │
│    └── Oct 8, 2025                                                  │
├─────────────────────────────────────────────────────────────────────┤
│ 🗓️ Due Date Column (140px)                                          │
│    └── Oct 16, 2025                                                 │
├─────────────────────────────────────────────────────────────────────┤
│ 🔗 Links Column (100px)                                             │
│    └── Link icons (Figma, Sheets, etc)                              │
├─────────────────────────────────────────────────────────────────────┤
│ 📦 Deliverables Column (140px)                                      │
│    ├── Lightroom icon (if has assets)                               │
│    └── GDrive icon (if has assets)                                  │
├─────────────────────────────────────────────────────────────────────┤
│ ⋮ Actions Column (50px - only if not public view)                  │
│    └── Three-dot menu                                                │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🏗️ Component Anatomy

### Base Component: Group by Status Row

**Location:** `/components/ProjectTable.tsx` line 921-1320

**Key Features:**
1. **Project Name Section** (Primary Column)
   - Draft badge indicator
   - Project name with truncation
   - Description (optional, truncated)
   - Asset progress visualization
     - Asset count indicator
     - Progress bar (animated, color-coded)
     - Urgency indicator (days left with color)
     - Expandable asset list
   
2. **Type Column**
   - Multiple type badges
   - Color-coded from TypeColorPicker
   - Horizontal scrollable if many
   
3. **Status Column**
   - Status badge
   - Color from StatusContext
   - Click to change (if not public view)
   
4. **Collaborators Column**
   - Avatar stack (max 3 visible)
   - Add collaborator button (if not public view)
   - Hover to see all names
   
5. **Date Columns**
   - Start date with quarter badge
   - Due date with quarter badge
   - Calendar picker (if not public view)
   - "Set to Today" quick action
   
6. **Links Column**
   - Multiple link icons
   - External link indicators
   - Click to open
   
7. **Deliverables Column**
   - Lightroom icon (if has lightroom_assets)
   - GDrive icon (if has gdrive_assets)
   - Click to navigate
   
8. **Actions Column**
   - Three-dot menu
   - Edit, Delete options
   - Only visible if not public view

### Row Behaviors

#### Interactive Elements
```tsx
// Asset Progress Expansion
- Click asset indicator → Expand/collapse asset list
- Show individual asset progress
- Asset status change (if not public view)
- Asset actions (check/uncheck)

// Status Change
- Click status badge → Popover with status options
- Auto-calculate from assets (with manual override)
- Visual feedback

// Collaborator Management
- Click +UserPlus → Add collaborator
- Show avatar stack with overflow
- Tooltip on hover

// Date Editing
- Click date → Calendar popover
- "Today" button for quick set
- Quarter badge auto-updates

// Navigation
- Click Lightroom icon → Navigate to lightroom page
- Click GDrive icon → Navigate to gdrive page
- Click row → Open detail sidebar
```

#### Visual Feedback
```tsx
// Row Background
- Overdue: Red tint (bg-red-50)
- Due today: Orange tint (bg-orange-50)
- Draft: Amber tint (bg-amber-50)
- Normal: Default

// Progress Colors
- 0-33%: Red
- 34-66%: Yellow
- 67-99%: Blue
- 100%: Green

// Urgency Colors
- Overdue: Red
- Due today: Orange
- 1-3 days: Orange
- 4-7 days: Yellow
- 8-14 days: Blue
- 15+ days: Gray
- Done: Green
```

---

## 🔄 Similarities & Differences

### Shared Features (95%)

**Identical in Both Modes:**
- ✅ All column structures
- ✅ All interactive elements
- ✅ All visual feedback
- ✅ Asset progress rendering
- ✅ Type badges
- ✅ Status badge
- ✅ Collaborator avatars
- ✅ Date pickers
- ✅ Link icons
- ✅ Deliverable icons
- ✅ Action menu
- ✅ Row click behavior
- ✅ Hover states
- ✅ Public view restrictions
- ✅ Draft badge
- ✅ Description truncation

### Differences (5%)

| Aspect | Group by Status | Group by Vertical |
|--------|----------------|-------------------|
| **Context** | Row is inside Status group → Vertical subgroup | Row is inside Vertical group directly |
| **Indentation** | `pl-8` (indented under vertical header) | `pl-6` (normal padding) |
| **Vertical Badge** | Not shown (already grouped by vertical) | May show as inline badge if needed |
| **Header Structure** | Status → Vertical → Rows | Vertical → Rows |
| **Collapsing** | Vertical subsections collapse within status | Only vertical sections collapse |

---

## 💡 Proposed Solution

### Architecture: Shared Component with Props

Create a reusable `ProjectTableRow` component that accepts configuration props to handle the differences between grouping modes.

```tsx
<ProjectTableRow
  project={project}
  collaborators={collaborators}
  config={{
    indentLevel: 'vertical-subgroup', // or 'top-level'
    showVerticalBadge: false, // or true
    rowPadding: 'pl-8', // or 'pl-6'
  }}
  handlers={{
    onClick: onProjectClick,
    onEdit: onEditProject,
    onDelete: onProjectDelete,
    onUpdate: onProjectUpdate,
    onNavigateToLightroom,
    onNavigateToGDrive,
  }}
  state={{
    expandedAssets,
    activePopovers,
    collapsedVerticals,
  }}
  isPublicView={isPublicView}
/>
```

### File Structure
```
/components/
├── ProjectTable.tsx (main table with grouping logic)
├── project-table/
│   ├── ProjectTableRow.tsx        (NEW - shared row component)
│   ├── ProjectTableHeader.tsx     (NEW - shared header)
│   ├── AssetProgressBar.tsx       (NEW - extracted)
│   ├── CollaboratorAvatars.tsx    (NEW - extracted)
│   ├── DateCell.tsx               (NEW - extracted)
│   ├── LinksCell.tsx              (NEW - extracted)
│   ├── DeliverablesCell.tsx       (NEW - extracted)
│   └── types.ts                   (NEW - shared types)
```

---

## 🛠️ Implementation Strategy

### Phase 1: Extract Core Row Component (2-3 hours)

#### Step 1.1: Create Type Definitions
```tsx
// /components/project-table/types.ts

export interface ProjectTableRowConfig {
  // Layout configuration
  indentLevel: 'vertical-subgroup' | 'top-level';
  showVerticalBadge: boolean;
  rowPadding: string;
  
  // Optional overrides
  showDescription?: boolean;
  showAssetProgress?: boolean;
  compactMode?: boolean;
}

export interface ProjectTableRowHandlers {
  onClick: (project: Project) => void;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
  onUpdate: (id: string, data: Partial<Project>) => void;
  onNavigateToLightroom: (projectId: string) => void;
  onNavigateToGDrive: (projectId: string) => void;
}

export interface ProjectTableRowState {
  expandedAssets: Set<string>;
  activeAssetPopover: string | null;
  activeDatePopover: string | null;
  activeStatusPopover: string | null;
}

export interface ProjectTableRowProps {
  project: Project;
  collaborators: Collaborator[];
  config: ProjectTableRowConfig;
  handlers: ProjectTableRowHandlers;
  state: ProjectTableRowState;
  onStateChange: (newState: Partial<ProjectTableRowState>) => void;
  isPublicView: boolean;
  verticalColors: Record<string, string>;
}
```

#### Step 1.2: Create ProjectTableRow Component
```tsx
// /components/project-table/ProjectTableRow.tsx

export function ProjectTableRow({
  project,
  collaborators,
  config,
  handlers,
  state,
  onStateChange,
  isPublicView,
  verticalColors,
}: ProjectTableRowProps) {
  // Extract all row rendering logic from ProjectTable.tsx
  // Use config to handle indentation and badges
  
  const rowPadding = config.rowPadding;
  const shouldShowVerticalBadge = config.showVerticalBadge;
  
  return (
    <TableRow
      key={project.id}
      className={`cursor-pointer ${getRowBackgroundColor(project)}`}
      onClick={() => handlers.onClick(project)}
    >
      {/* Project Name Cell */}
      <TableCell className={`${rowPadding} w-[280px]`}>
        {/* All project name rendering logic */}
      </TableCell>
      
      {/* Type Cell */}
      <TableCell className="w-[140px]">
        {/* Type badges */}
      </TableCell>
      
      {/* ... other cells ... */}
    </TableRow>
  );
}
```

#### Step 1.3: Extract Subcomponents

**AssetProgressBar.tsx**
```tsx
export function AssetProgressBar({
  project,
  onToggleExpansion,
  isExpanded,
  isPublicView,
}: AssetProgressBarProps) {
  // Extract asset progress rendering
  // Progress bar
  // Asset list expansion
  // Asset status changes
}
```

**CollaboratorAvatars.tsx**
```tsx
export function CollaboratorAvatars({
  project,
  collaborators,
  onAddCollaborator,
  isPublicView,
}: CollaboratorAvatarsProps) {
  // Extract collaborator rendering
  // Avatar stack
  // Add button
}
```

**DateCell.tsx**
```tsx
export function DateCell({
  date,
  field,
  projectId,
  onUpdate,
  isPopoverActive,
  onPopoverChange,
  isPublicView,
}: DateCellProps) {
  // Extract date rendering
  // Quarter badge
  // Calendar picker
  // "Today" button
}
```

### Phase 2: Refactor Group by Status (1 hour)

```tsx
// In ProjectTable.tsx - Group by Status section

{projectsInVertical.map((project) => (
  <ProjectTableRow
    key={project.id}
    project={project}
    collaborators={collaborators}
    config={{
      indentLevel: 'vertical-subgroup',
      showVerticalBadge: false,
      rowPadding: 'pl-8',
    }}
    handlers={{
      onClick: onProjectClick,
      onEdit: onEditProject,
      onDelete: (p) => onProjectDelete(p.id),
      onUpdate: onProjectUpdate,
      onNavigateToLightroom,
      onNavigateToGDrive,
    }}
    state={{
      expandedAssets,
      activeAssetPopover,
      activeDatePopover,
      activeStatusPopover,
    }}
    onStateChange={(newState) => {
      // Update state from child
      if (newState.expandedAssets) setExpandedAssets(newState.expandedAssets);
      if (newState.activeAssetPopover !== undefined) setActiveAssetPopover(newState.activeAssetPopover);
      // ... etc
    }}
    isPublicView={isPublicView}
    verticalColors={verticalColors}
  />
))}
```

### Phase 3: Refactor Group by Vertical (1 hour)

```tsx
// In ProjectTable.tsx - Group by Vertical section

{projectsInVertical.map((project) => (
  <ProjectTableRow
    key={project.id}
    project={project}
    collaborators={collaborators}
    config={{
      indentLevel: 'top-level',
      showVerticalBadge: false, // Already grouped by vertical
      rowPadding: 'pl-6',
    }}
    handlers={{
      onClick: onProjectClick,
      onEdit: onEditProject,
      onDelete: (p) => onProjectDelete(p.id),
      onUpdate: onProjectUpdate,
      onNavigateToLightroom,
      onNavigateToGDrive,
    }}
    state={rowState}
    onStateChange={updateRowState}
    isPublicView={isPublicView}
    verticalColors={verticalColors}
  />
))}
```

### Phase 4: Testing & Verification (1 hour)

---

## 📝 Component API Design

### ProjectTableRow Props

```tsx
interface ProjectTableRowProps {
  // Data
  project: Project;
  collaborators: Collaborator[];
  verticalColors: Record<string, string>;
  
  // Configuration
  config: {
    indentLevel: 'vertical-subgroup' | 'top-level';
    showVerticalBadge: boolean;
    rowPadding: string;
    showDescription?: boolean;
    showAssetProgress?: boolean;
    compactMode?: boolean;
  };
  
  // Event Handlers
  handlers: {
    onClick: (project: Project) => void;
    onEdit: (project: Project) => void;
    onDelete: (project: Project) => void;
    onUpdate: (id: string, data: Partial<Project>) => void;
    onNavigateToLightroom: (projectId: string) => void;
    onNavigateToGDrive: (projectId: string) => void;
  };
  
  // State Management
  state: {
    expandedAssets: Set<string>;
    activeAssetPopover: string | null;
    activeDatePopover: string | null;
    activeStatusPopover: string | null;
  };
  onStateChange: (newState: Partial<ProjectTableRowState>) => void;
  
  // Context
  isPublicView: boolean;
}
```

### Usage Examples

**Group by Status (Indented)**
```tsx
<ProjectTableRow
  project={project}
  collaborators={collaborators}
  verticalColors={verticalColors}
  config={{
    indentLevel: 'vertical-subgroup',
    showVerticalBadge: false,
    rowPadding: 'pl-8',
  }}
  handlers={handlers}
  state={state}
  onStateChange={onStateChange}
  isPublicView={isPublicView}
/>
```

**Group by Vertical (Normal)**
```tsx
<ProjectTableRow
  project={project}
  collaborators={collaborators}
  verticalColors={verticalColors}
  config={{
    indentLevel: 'top-level',
    showVerticalBadge: false,
    rowPadding: 'pl-6',
  }}
  handlers={handlers}
  state={state}
  onStateChange={onStateChange}
  isPublicView={isPublicView}
/>
```

**Standalone (With Vertical Badge)**
```tsx
<ProjectTableRow
  project={project}
  collaborators={collaborators}
  verticalColors={verticalColors}
  config={{
    indentLevel: 'top-level',
    showVerticalBadge: true, // Show vertical badge inline
    rowPadding: 'pl-6',
  }}
  handlers={handlers}
  state={state}
  onStateChange={onStateChange}
  isPublicView={isPublicView}
/>
```

---

## 🔄 Migration Plan

### Step-by-Step Migration

#### Before Migration
```
ProjectTable.tsx: 1,800 lines
├── Group by Status rendering: 520 lines
│   └── Row rendering: 400 lines (duplicated)
└── Group by Vertical rendering: 500 lines
    └── Row rendering: 380 lines (duplicated)
```

#### After Migration
```
/components/
├── ProjectTable.tsx: 1,100 lines
│   ├── Group by Status: 180 lines (calls ProjectTableRow)
│   └── Group by Vertical: 160 lines (calls ProjectTableRow)
└── project-table/
    ├── ProjectTableRow.tsx: 450 lines (shared)
    ├── AssetProgressBar.tsx: 120 lines
    ├── CollaboratorAvatars.tsx: 60 lines
    ├── DateCell.tsx: 80 lines
    ├── LinksCell.tsx: 40 lines
    ├── DeliverablesCell.tsx: 40 lines
    └── types.ts: 100 lines
```

### Code Reduction
```
BEFORE: 1,800 lines in ProjectTable.tsx
AFTER:  1,100 lines in ProjectTable.tsx
        + 890 lines in project-table/ (reusable)
        
REDUCTION: 700 lines removed from main file
           890 lines in organized subcomponents
           NET: Cleaner architecture, better organization
```

---

## 🧪 Testing Strategy

### Unit Tests

#### ProjectTableRow
- [ ] Renders correctly with vertical-subgroup config
- [ ] Renders correctly with top-level config
- [ ] Shows/hides vertical badge based on config
- [ ] Applies correct padding based on config
- [ ] Handles draft badge correctly
- [ ] Truncates long project names
- [ ] Shows/hides description
- [ ] Asset progress expands/collapses
- [ ] Status change works (if not public view)
- [ ] Collaborator add works (if not public view)
- [ ] Date picker works (if not public view)
- [ ] Links navigate correctly
- [ ] Deliverables navigate correctly
- [ ] Actions menu works (if not public view)
- [ ] Row click triggers onClick
- [ ] All popovers work correctly

#### AssetProgressBar
- [ ] Shows correct progress percentage
- [ ] Shows correct progress color
- [ ] Shows correct urgency indicator
- [ ] Expands/collapses asset list
- [ ] Single asset rendering
- [ ] Multiple assets rendering
- [ ] Asset status change (if not public view)
- [ ] Asset actions check/uncheck

#### CollaboratorAvatars
- [ ] Shows up to 3 avatars
- [ ] Shows overflow count
- [ ] Add collaborator works (if not public view)
- [ ] Tooltips show on hover

#### DateCell
- [ ] Shows date with quarter badge
- [ ] Calendar picker opens (if not public view)
- [ ] "Today" button works (if not public view)
- [ ] Quarter badge updates on date change
- [ ] Handles null/undefined dates

### Integration Tests

#### Group by Status Mode
- [ ] Renders all status groups
- [ ] Renders vertical subgroups within status
- [ ] Row indentation correct (pl-8)
- [ ] Vertical badge not shown
- [ ] All rows interactive
- [ ] Collapsing works correctly
- [ ] Create project button works

#### Group by Vertical Mode
- [ ] Renders all vertical groups
- [ ] Row padding correct (pl-6)
- [ ] Vertical badge not shown (already grouped)
- [ ] All rows interactive
- [ ] Collapsing works correctly
- [ ] Create project button works

### Visual Regression Tests
- [ ] Row appearance identical in both modes
- [ ] Hover states consistent
- [ ] Color coding consistent
- [ ] Typography consistent
- [ ] Spacing consistent

---

## 📈 Success Metrics

### Code Quality
- ✅ Reduced ProjectTable.tsx by 40% (1,800 → 1,100 lines)
- ✅ Zero code duplication for row rendering
- ✅ Clean separation of concerns
- ✅ Reusable subcomponents
- ✅ Type-safe interfaces

### Functionality
- ✅ 100% feature parity with current implementation
- ✅ All interactions work in both modes
- ✅ Public view restrictions enforced
- ✅ Mobile responsiveness maintained

### Maintainability
- ✅ Single source of truth for row rendering
- ✅ Easy to add new columns
- ✅ Easy to modify row behavior
- ✅ Clear component boundaries

### Developer Experience
- ✅ Clear component API
- ✅ Self-documenting props
- ✅ Easy to understand structure
- ✅ Minimal boilerplate

---

## 📚 Benefits of This Approach

### 1. DRY Principle
- Single row implementation
- No code duplication
- Consistent behavior

### 2. Flexibility
- Easy to support new grouping modes
- Configurable row layout
- Extensible column system

### 3. Maintainability
- Fix bugs once
- Add features once
- Test once

### 4. Type Safety
- Shared TypeScript interfaces
- Compile-time checking
- IntelliSense support

### 5. Performance
- Same performance as current
- Potential for memoization
- No additional re-renders

---

## ⚠️ Risks & Mitigations

### Risk 1: Breaking Changes
**Risk:** Refactor may introduce bugs  
**Mitigation:**  
- Comprehensive testing before/after
- Feature flag for gradual rollout
- Easy rollback plan

### Risk 2: State Management Complexity
**Risk:** Passing state up/down may be complex  
**Mitigation:**  
- Clear state interface
- Use callbacks for state updates
- Consider Context API if needed

### Risk 3: Performance Regression
**Risk:** Additional component layers may slow down  
**Mitigation:**  
- Profile before/after
- Use React.memo where appropriate
- Monitor render counts

---

## 🎯 Next Steps

### Pre-Implementation
1. ✅ Review planning document
2. ✅ Approve architecture
3. ✅ Schedule implementation (4-5 hours)

### Implementation Order
1. Create type definitions (30 min)
2. Extract subcomponents (2 hours)
3. Create ProjectTableRow (1 hour)
4. Refactor Group by Status (1 hour)
5. Refactor Group by Vertical (1 hour)
6. Testing & verification (1 hour)
7. Documentation (30 min)

### Post-Implementation
1. Test both grouping modes thoroughly
2. Verify mobile responsiveness
3. Check public view restrictions
4. Performance profiling
5. Update documentation

---

## 📝 Notes

### Design Decisions

**Why ProjectTableRow instead of just extracting cells?**
- Row is the logical unit of interaction
- Easier to manage row-level state
- Better encapsulation

**Why configuration props instead of separate components?**
- Avoids code duplication
- Easier to maintain
- More flexible for future needs

**Why extract so many subcomponents?**
- Each cell has complex logic
- Better testability
- Easier to maintain
- Potential reuse elsewhere

### Future Enhancements

**Potential Improvements:**
1. Virtual scrolling for large tables
2. Column reordering
3. Column visibility toggle
4. Bulk actions
5. Row selection
6. Export to CSV
7. Custom column templates

---

**Status:** ✅ **PLANNING COMPLETE - READY FOR APPROVAL**

**Estimated Effort:** 4-5 hours total  
**Complexity:** Medium  
**Impact:** High (better maintainability, cleaner code)

---

**Next Action:** Get approval and proceed with implementation ⏭️
