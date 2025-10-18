# GDrive Nested Folders - UI Mockup & Design Specs

**Date:** January 2025  
**Component:** GDrive Asset Management UI  
**Status:** 🎨 DESIGN PHASE

---

## 🎨 Visual Design Mockups

### 1. GDriveAssetManager - Tree View (Edit Mode)

#### Collapsed State

```
┌──────────────────────────────────────────────────────────────────────┐
│ Google Drive Assets                                    [Grid] [List]  │
├──────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ▶ 📁 Final Designs (8 items)              [Edit] [Delete] [+ Child] │
│     └─ [Preview Grid: 3 thumbnails] +5                               │
│                                                                        │
│  ▶ 📁 Research Materials (3 items)         [Edit] [Delete] [+ Child] │
│     └─ [Preview Grid: 3 thumbnails]                                  │
│                                                                        │
│  📄 Style Guide.pdf                         [Edit] [Delete]          │
│     └─ [Single thumbnail]                                             │
│                                                                        │
│  [+ Add New Asset]                                                    │
│                                                                        │
└──────────────────────────────────────────────────────────────────────┘
```

#### Expanded State (2 Levels Deep)

```
┌──────────────────────────────────────────────────────────────────────┐
│ Google Drive Assets                                    [Grid] [List]  │
├──────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ▼ 📁 Final Designs (8 items)              [Edit] [Delete] [+ Child] │
│     └─ [Preview Grid: 3 thumbnails] +5                               │
│                                                                        │
│     ▶ 📁 Mobile Screens (5 items)      [Edit] [Delete] [+ Child]     │
│        └─ [Preview Grid: 3 thumbnails] +2                            │
│                                                                        │
│     ▶ 📁 Desktop Mockups (2 items)     [Edit] [Delete] [+ Child]     │
│        └─ [Preview Grid: 2 thumbnails]                               │
│                                                                        │
│     📄 README.txt                       [Edit] [Delete]               │
│                                                                        │
│  ▶ 📁 Research Materials (3 items)         [Edit] [Delete] [+ Child] │
│     └─ [Preview Grid: 3 thumbnails]                                  │
│                                                                        │
│  📄 Style Guide.pdf                         [Edit] [Delete]          │
│     └─ [Single thumbnail]                                             │
│                                                                        │
│  [+ Add New Asset]                                                    │
│                                                                        │
└──────────────────────────────────────────────────────────────────────┘
```

#### Fully Expanded (3 Levels Deep)

```
┌──────────────────────────────────────────────────────────────────────┐
│ Google Drive Assets                                    [Grid] [List]  │
├──────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ▼ 📁 Final Designs                        [Edit] [Delete] [+ Child] │
│                                                                        │
│     ▼ 📁 Mobile Screens                [Edit] [Delete] [+ Child]     │
│                                                                        │
│        ▼ 📁 Login Flow              [Edit] [Delete] [+ Child]        │
│           📄 Login Screen.png       [Edit] [Delete]                  │
│           📄 Password Screen.png    [Edit] [Delete]                  │
│           📄 Forgot Password.png    [Edit] [Delete]                  │
│                                                                        │
│        ▶ 📁 Onboarding Flow         [Edit] [Delete] [+ Child]        │
│                                                                        │
│        📄 Home Screen.png           [Edit] [Delete]                  │
│                                                                        │
│     ▶ 📁 Desktop Mockups               [Edit] [Delete] [+ Child]     │
│                                                                        │
│  [+ Add New Asset]                                                    │
│                                                                        │
└──────────────────────────────────────────────────────────────────────┘
```

---

### 2. Add Asset Dialog - Parent Folder Selection

#### Root Level (No Parent)

```
┌────────────────────────────────────────────────┐
│  Add Google Drive Asset                        │
├────────────────────────────────────────────────┤
│                                                 │
│  Asset Name *                                   │
│  [Mobile Screens                             ] │
│                                                 │
│  Asset Type                                     │
│  ◉ Folder  ○ File                              │
│                                                 │
│  Parent Folder (Optional)                       │
│  [── None (Root Level) ──                    ▼] │
│                                                 │
│  Google Drive Link                              │
│  [https://drive.google.com/...               ] │
│                                                 │
│  Preview Images (Optional)                      │
│  [Choose Files]  No files selected             │
│                                                 │
│  Associate with Asset (Optional)                │
│  [── Select Asset ──                         ▼] │
│                                                 │
│  [Cancel]                      [Add Asset]      │
│                                                 │
└────────────────────────────────────────────────┘
```

#### With Parent Selected

```
┌────────────────────────────────────────────────┐
│  Add Google Drive Asset                        │
├────────────────────────────────────────────────┤
│                                                 │
│  📍 Adding to: Final Designs                    │
│                                                 │
│  Asset Name *                                   │
│  [Mobile Screens                             ] │
│                                                 │
│  Asset Type                                     │
│  ◉ Folder  ○ File                              │
│                                                 │
│  Parent Folder (Optional)                       │
│  [📁 Final Designs                           ▼] │
│  │  ── None (Root Level)                       │
│  │  📁 Final Designs                           │
│  │  📁 Research Materials                      │
│                                                 │
│  Google Drive Link                              │
│  [https://drive.google.com/...               ] │
│                                                 │
│  Preview Images (Optional)                      │
│  [Choose Files]  3 files selected              │
│                                                 │
│  Associate with Asset (Optional)                │
│  [Design System Homepage                     ▼] │
│                                                 │
│  [Cancel]                      [Add Asset]      │
│                                                 │
└────────────────────────────────────────────────┘
```

#### Deep Nesting (3 Levels)

```
┌────────────────────────────────────────────────┐
│  Add Google Drive Asset                        │
├────────────────────────────────────────────────┤
│                                                 │
│  📍 Adding to: Final Designs > Mobile Screens  │
│     > Login Flow                                │
│                                                 │
│  Asset Name *                                   │
│  [Login Screen.png                           ] │
│                                                 │
│  Asset Type                                     │
│  ○ Folder  ◉ File                              │
│                                                 │
│  Parent Folder (Optional)                       │
│  [📁 Login Flow                              ▼] │
│  │  ── None (Root Level)                       │
│  │  📁 Final Designs                           │
│  │    📁 Mobile Screens                        │
│  │      📁 Login Flow                          │
│  │      📁 Onboarding Flow                     │
│  │    📁 Desktop Mockups                       │
│  │  📁 Research Materials                      │
│                                                 │
│  Google Drive Link                              │
│  [https://drive.google.com/file/...          ] │
│                                                 │
│  Preview Image (Optional)                       │
│  [Choose File]  login-screen-preview.png       │
│                                                 │
│  Associate with Asset (Optional)                │
│  [Design System Homepage                     ▼] │
│                                                 │
│  [Cancel]                      [Add Asset]      │
│                                                 │
└────────────────────────────────────────────────┘
```

---

### 3. Delete Folder Confirmation

#### Folder with Children

```
┌────────────────────────────────────────────────┐
│  ⚠️  Delete Folder?                            │
├────────────────────────────────────────────────┤
│                                                 │
│  You are about to delete:                       │
│                                                 │
│  📁 Mobile Screens                             │
│                                                 │
│  This folder contains:                          │
│  • 2 sub-folders                                │
│  • 5 files                                      │
│  • Total: 7 items                               │
│                                                 │
│  What would you like to do?                     │
│                                                 │
│  ◉ Delete folder and all contents              │
│     (Cannot be undone)                          │
│                                                 │
│  ○ Move contents to parent folder              │
│     (Keep files, remove folder structure)       │
│                                                 │
│  ○ Cancel and keep everything                   │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │ ⚠️  I understand this will delete all   │  │
│  │    nested items permanently              │  │
│  │    [ ] Check to confirm                  │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  [Cancel]                  [Delete All]         │
│                                                 │
└────────────────────────────────────────────────┘
```

#### Empty Folder (Simple Confirm)

```
┌────────────────────────────────────────────────┐
│  Delete Folder?                                 │
├────────────────────────────────────────────────┤
│                                                 │
│  Are you sure you want to delete:               │
│                                                 │
│  📁 Research Materials                         │
│                                                 │
│  This folder is empty.                          │
│                                                 │
│  [Cancel]                      [Delete]         │
│                                                 │
└───────────────────────────────────��────────────┘
```

---

### 4. GDrivePage - Folder Navigation

#### Root Level View

```
┌──────────────────────────────────────────────────────────────────────┐
│  📂 Google Drive Assets                                               │
│  ────────────────────────────────────────────────────────────────── │
│  Home                                                                 │
├──────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │
│  │ [Preview Grid]  │  │ [Preview Grid]  │  │ [Preview Grid]  │     │
│  │                 │  │                 │  │                 │     │
│  │ 📁 Final        │  │ 📁 Research     │  │ 📄 Style Guide  │     │
│  │    Designs      │  │    Materials    │  │                 │     │
│  │                 │  │                 │  │                 │     │
│  │ 8 items         │  │ 3 items         │  │                 │     │
│  │ 2 folders       │  │ 1 folder        │  │                 │     │
│  │                 │  │                 │  │                 │     │
│  │ [View] [Link]   │  │ [View] [Link]   │  │ [View] [Link]   │     │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘     │
│                                                                        │
│  Total: 3 items at root level                                        │
│                                                                        │
└──────────────────────────────────────────────────────────────────────┘
```

#### Inside Folder View

```
┌──────────────────────────────────────────────────────��───────────────┐
│  📂 Google Drive Assets                                               │
│  ────────────────────────────────────────────────────────────────── │
│  Home > Final Designs                            [← Back to Parent]   │
├──────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │
│  │ [Preview Grid]  │  │ [Preview Grid]  │  │ [No Preview]    │     │
│  │                 │  │                 │  │                 │     │
│  │ 📁 Mobile       │  │ 📁 Desktop      │  │ 📄 README.txt   │     │
│  │    Screens      │  │    Mockups      │  │                 │     │
│  │                 │  │                 │  │                 │     │
│  │ 5 items         │  │ 2 items         │  │                 │     │
│  │ 2 folders       │  │ 1 folder        │  │                 │     │
│  │                 │  │                 │  │                 │     │
│  │ [View] [Link]   │  │ [View] [Link]   │  │ [Open] [Link]   │     │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘     │
│                                                                        │
│  In "Final Designs": 3 items                                         │
│                                                                        │
└──────────────────────────────────────────────────────────────────────┘
```

#### Deep Nesting (3 Levels)

```
┌──────────────────────────────────────────────────────────────────────┐
│  📂 Google Drive Assets                                               │
│  ────────────────────────────────────────────────────────────────── │
│  Home > Final Designs > Mobile Screens > Login Flow                  │
│                                                  [← Back to Parent]   │
├──────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │
│  │ [Preview]       │  │ [Preview]       │  │ [Preview]       │     │
│  │                 │  │                 │  │                 │     │
│  │ 📄 Login        │  │ 📄 Password     │  │ 📄 Forgot       │     │
│  │    Screen.png   │  │    Screen.png   │  │    Password.png │     │
│  │                 │  │                 │  │                 │     │
│  │ [View] [Link]   │  │ [View] [Link]   │  │ [View] [Link]   │     │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘     │
│                                                                        │
│  In "Login Flow": 3 files                                            │
│                                                                        │
└──────────────────────────────────────────────────────────────────────┘
```

---

### 5. Breadcrumb Component Design

#### Interactive Breadcrumb

```
┌──────────────────────────────────────────────────────────────────────┐
│  📂  Home  >  Final Designs  >  Mobile Screens  >  Login Flow        │
│      ↑           ↑                  ↑                   ↑             │
│   (click)     (click)            (click)          (current)           │
└────────────────���─────────────────────────────────────────────────────┘
```

**Hover States:**
```
Home           → Underline + pointer cursor
Final Designs  → Underline + pointer cursor
Mobile Screens → Underline + pointer cursor
Login Flow     → No hover (current page, dim color)
```

**Responsive (Mobile):**
```
┌───────────────────────────────────────────┐
│  📂  ... > Mobile Screens > Login Flow    │
│           ↑                                │
│        (dropdown shows full path)          │
└───────────────────────────────────────────┘
```

---

### 6. GDriveOverview - Dashboard Display

#### Compact View

```
┌────────────────────────────────────────────────────────────────┐
│  Google Drive Assets Summary                                    │
├────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Design System Homepage                                         │
│  📁 8 assets in 3 folders                      [View Details]   │
│                                                                  │
│  Marketing Campaign Q1                                          │
│  📁 15 assets in 5 folders                     [View Details]   │
│                                                                  │
│  User Research Study                                            │
│  📄 3 files                                    [View Details]   │
│                                                                  │
└────────────────────────────────────────────────────────────────┘
```

#### Expanded View with Paths

```
┌────────────────────────────────────────────────────────────────┐
│  Google Drive Assets Summary                                    │
├────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Design System Homepage                                         │
│  ├─ Final Designs / Mobile Screens / Login Flow / Login.png    │
│  ├─ Final Designs / Mobile Screens / Login Flow / Password.png │
│  ├─ Final Designs / Desktop Mockups / Homepage.png             │
│  └─ Style Guide.pdf                                             │
│  [View All 8 assets]                                            │
│                                                                  │
│  Marketing Campaign Q1                                          │
│  ├─ Creative Assets / Social Media / Facebook Post.png         │
│  ├─ Creative Assets / Social Media / Instagram Story.png       │
│  └─ ... and 13 more                                             │
│  [View All 15 assets]                                           │
│                                                                  │
└────────────────────────────────────────────────────────────────┘
```

---

## 🎨 Design Tokens

### Indentation & Spacing

```typescript
const INDENT_PER_LEVEL = 24; // px
const ROW_HEIGHT = 60; // px
const ICON_SIZE = 20; // px
const PREVIEW_THUMBNAIL_SIZE = 48; // px
const FOLDER_ICON_COLOR = 'hsl(var(--primary))';
const FILE_ICON_COLOR = 'hsl(var(--muted-foreground))';
```

### Color Scheme (Dark Mode)

```css
/* Folder (collapsed) */
background: hsl(var(--card));
border: 1px solid hsl(var(--border));

/* Folder (expanded/active) */
background: hsl(var(--accent));
border: 1px solid hsl(var(--primary));

/* Folder (hover) */
background: hsl(var(--accent));

/* Indentation line */
border-left: 1px dashed hsl(var(--border));
opacity: 0.5;
```

### Icons

```typescript
import { 
  FolderIcon,        // Closed folder
  FolderOpenIcon,    // Open/expanded folder
  FileIcon,          // Generic file
  ChevronRight,      // Collapsed state (►)
  ChevronDown,       // Expanded state (▼)
  MoreHorizontal,    // Actions menu (⋯)
  ArrowLeft,         // Back button
  Home               // Home/Root button
} from 'lucide-react';
```

---

## 📱 Responsive Design

### Desktop (≥768px)

- Full tree view with indentation
- Expand/collapse folders inline
- Preview thumbnails visible
- Breadcrumb navigation full width

### Mobile (<768px)

- Accordion-style folders (one at a time)
- Breadcrumb with ellipsis: `... > Current Folder`
- Preview thumbnails in carousel
- Swipe gestures for navigation
- Bottom sheet for folder actions

---

## ♿ Accessibility

### Keyboard Navigation

```
Tab          → Navigate between folders/files
Space/Enter  → Open/collapse folder
Arrow Up     → Previous sibling
Arrow Down   → Next sibling
Arrow Right  → Expand folder (if collapsed)
Arrow Left   → Collapse folder (if expanded) or go to parent
Backspace    → Go to parent folder
Home         → Go to root level
```

### Screen Reader

```html
<div role="tree" aria-label="Google Drive Assets">
  <div role="treeitem" 
       aria-expanded="true" 
       aria-level="1"
       aria-label="Final Designs folder, 8 items, 2 folders">
    <button>Expand/Collapse</button>
    📁 Final Designs (8 items)
  </div>
  
  <div role="treeitem" 
       aria-expanded="false" 
       aria-level="2"
       aria-label="Mobile Screens subfolder, 5 items">
    <button>Expand/Collapse</button>
    📁 Mobile Screens (5 items)
  </div>
</div>
```

---

## 🎯 Interaction States

### Folder Card States

```
Default      → border: muted, background: card
Hover        → border: primary, background: accent
Active       → border: primary, background: accent, bold text
Expanded     → chevron down, children visible
Collapsed    → chevron right, children hidden
Dragging     → opacity: 0.5, cursor: grabbing (future feature)
```

### Button States

```
[Edit]       → variant: ghost, size: sm
[Delete]     → variant: ghost, size: sm, color: destructive
[+ Child]    → variant: outline, size: sm, icon: Plus
[View]       → variant: default, size: sm
[Link]       → variant: outline, size: sm, icon: ExternalLink
```

---

## 🔧 Animation & Transitions

### Expand/Collapse

```css
/* Folder expansion */
.folder-children {
  transition: max-height 0.3s ease-in-out, opacity 0.2s ease-in-out;
  overflow: hidden;
}

.folder-children.collapsed {
  max-height: 0;
  opacity: 0;
}

.folder-children.expanded {
  max-height: 2000px; /* or calculate dynamically */
  opacity: 1;
}
```

### Chevron Rotation

```css
.chevron {
  transition: transform 0.2s ease-in-out;
}

.chevron.collapsed {
  transform: rotate(0deg); /* ► */
}

.chevron.expanded {
  transform: rotate(90deg); /* ▼ */
}
```

### Hover Effects

```css
.folder-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease-in-out;
}
```

---

## 📊 Component Hierarchy

```
GDriveAssetManager
├─ GDriveFolderTree (NEW)
│  ├─ GDriveFolderNode (NEW)
│  │  ├─ FolderHeader
│  │  │  ├─ ExpandCollapseButton
│  │  │  ├─ FolderIcon
│  │  │  ├─ FolderName
│  │  │  ├─ ItemCount
│  │  │  └─ ActionButtons
│  │  ├─ PreviewThumbnails
│  │  └─ FolderChildren (recursive)
│  │     └─ GDriveFolderNode (nested)
│  └─ AddAssetButton
├─ AddAssetDialog
│  ├─ ParentFolderSelect (NEW)
│  └─ BreadcrumbPath (NEW)
└─ DeleteFolderDialog (NEW)
   └─ CascadeOptions (NEW)

GDrivePage
├─ BreadcrumbNavigation (NEW)
├─ BackToParentButton (NEW)
├─ FolderGrid
│  └─ FolderCard
│     ├─ PreviewGrid
│     ├─ FolderInfo
│     │  ├─ ItemCount
│     │  └─ FolderCount
│     └─ ActionButtons
└─ Lightbox (existing, unchanged)

GDriveOverview
├─ ProjectSummaryCard
│  ├─ AssetPathList (NEW)
│  └─ ViewDetailsButton
└─ ExpandedPathView (NEW)
```

---

## ✅ Implementation Checklist

### Phase 1: Foundation
- [ ] Update `GDriveAsset` type with `parent_id`
- [ ] Create `/utils/gdriveUtils.ts` with helper functions
- [ ] Add tree traversal functions
- [ ] Add validation functions

### Phase 2: Tree View Components
- [ ] Create `GDriveFolderTree` component
- [ ] Create `GDriveFolderNode` component (recursive)
- [ ] Add expand/collapse state management
- [ ] Add indentation styling
- [ ] Add folder icons with rotation

### Phase 3: CRUD Operations
- [ ] Update Add Asset form with parent selector
- [ ] Add breadcrumb display in add form
- [ ] Update delete with cascade options
- [ ] Add "Add Child" button for folders
- [ ] Validate circular references

### Phase 4: Navigation
- [ ] Create `BreadcrumbNavigation` component
- [ ] Add folder navigation state
- [ ] Filter assets by current folder
- [ ] Add "Back to Parent" button
- [ ] Add keyboard navigation (Backspace)

### Phase 5: Polish
- [ ] Add animations (expand/collapse)
- [ ] Add hover states
- [ ] Add loading states
- [ ] Add empty states
- [ ] Mobile responsive design
- [ ] Accessibility (ARIA labels)
- [ ] Testing (all edge cases)

---

**Ready for implementation!** 🚀
