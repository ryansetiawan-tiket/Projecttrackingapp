# GDrive Nested Folders Feature - Planning Document

**Date:** January 2025  
**Feature:** Add nested folder capability for GDrive assets  
**Status:** 🟡 PLANNING PHASE

---

## 📋 Feature Request

User wants to add nested folder capability where:
- Each folder can contain sub-folders
- Each folder (parent or child) has its own:
  - GDrive link
  - Preview images (multiple)
  - Asset name

---

## ✅ Current State Analysis

### Existing GDrive Asset Structure

**Type Definition** (`/types/project.ts`):
```typescript
export interface GDriveAsset {
  id: string;
  asset_name: string;
  gdrive_link: string;
  asset_type: 'file' | 'folder';
  preview_url?: string; // Single preview (backward compatibility)
  preview_urls?: GDrivePreview[] | string[]; // Multiple previews
  asset_id?: string; // Associated actionable item
  created_at: string;
}

export interface GDrivePreview {
  id: string;
  url: string;
  name?: string; // Optional preview name (max 100 chars)
}
```

### Current Capabilities

✅ **Already Implemented:**
- Multiple preview images per asset (up to N images)
- Support for both 'file' and 'folder' types
- Preview carousel with lightbox
- Preview names/labels
- Association with actionable items
- Supabase Storage integration

❌ **Missing:**
- Nested folder structure (hierarchy)
- Parent-child relationships
- Tree/folder navigation UI
- Folder expansion/collapse

---

## 🎯 Proposed Solution

### Option 1: Tree Structure with Parent Reference (RECOMMENDED)

**Advantages:**
- ✅ Simple data structure
- ✅ Easy to implement
- ✅ Easy to query (get children by parent_id)
- ✅ Flexible depth (unlimited nesting)
- ✅ Backward compatible (null parent = root level)

**Type Definition:**
```typescript
export interface GDriveAsset {
  id: string;
  asset_name: string;
  gdrive_link: string;
  asset_type: 'file' | 'folder';
  preview_url?: string;
  preview_urls?: GDrivePreview[] | string[];
  asset_id?: string;
  parent_id?: string | null; // 🆕 Reference to parent folder (null = root level)
  created_at: string;
  updated_at?: string;
}
```

**Example Data:**
```typescript
// Root level folder
{
  id: 'folder-1',
  asset_name: 'Final Designs',
  gdrive_link: 'https://drive.google.com/drive/folders/xxx',
  asset_type: 'folder',
  preview_urls: [...],
  parent_id: null, // Root level
  asset_id: 'asset-abc'
}

// Sub-folder
{
  id: 'folder-2',
  asset_name: 'Mobile Screens',
  gdrive_link: 'https://drive.google.com/drive/folders/yyy',
  asset_type: 'folder',
  preview_urls: [...],
  parent_id: 'folder-1', // Child of "Final Designs"
  asset_id: 'asset-abc'
}

// Sub-sub-folder
{
  id: 'folder-3',
  asset_name: 'Login Flow',
  gdrive_link: 'https://drive.google.com/drive/folders/zzz',
  asset_type: 'folder',
  preview_urls: [...],
  parent_id: 'folder-2', // Child of "Mobile Screens"
  asset_id: 'asset-abc'
}

// File inside sub-folder
{
  id: 'file-1',
  asset_name: 'Login Screen.png',
  gdrive_link: 'https://drive.google.com/file/d/aaa',
  asset_type: 'file',
  preview_url: '...',
  parent_id: 'folder-3', // Inside "Login Flow"
  asset_id: 'asset-abc'
}
```

**Helper Functions:**
```typescript
// Get root level assets
function getRootAssets(assets: GDriveAsset[]): GDriveAsset[] {
  return assets.filter(asset => !asset.parent_id);
}

// Get children of a folder
function getChildren(assets: GDriveAsset[], parentId: string): GDriveAsset[] {
  return assets.filter(asset => asset.parent_id === parentId);
}

// Get full path to asset
function getAssetPath(assets: GDriveAsset[], assetId: string): string[] {
  const asset = assets.find(a => a.id === assetId);
  if (!asset) return [];
  
  if (!asset.parent_id) return [asset.asset_name];
  
  const parentPath = getAssetPath(assets, asset.parent_id);
  return [...parentPath, asset.asset_name];
}

// Check if folder has children
function hasChildren(assets: GDriveAsset[], folderId: string): boolean {
  return assets.some(asset => asset.parent_id === folderId);
}

// Get all descendants (recursive)
function getAllDescendants(assets: GDriveAsset[], parentId: string): GDriveAsset[] {
  const children = getChildren(assets, parentId);
  const descendants = [...children];
  
  children.forEach(child => {
    if (child.asset_type === 'folder') {
      descendants.push(...getAllDescendants(assets, child.id));
    }
  });
  
  return descendants;
}
```

---

### Option 2: Nested Children Array

**Disadvantages:**
- ❌ Complex data structure
- ❌ Harder to update (need to traverse tree)
- ❌ Difficult to flatten
- ❌ JSON serialization depth issues
- ❌ Breaking change to existing structure

```typescript
// NOT RECOMMENDED
export interface GDriveAsset {
  id: string;
  asset_name: string;
  gdrive_link: string;
  asset_type: 'file' | 'folder';
  preview_urls?: GDrivePreview[];
  children?: GDriveAsset[]; // Nested structure
  asset_id?: string;
}
```

---

## 🎨 UI/UX Design

### 1. GDriveAssetManager (Edit/Create Mode)

**Tree View with Indentation:**

```
📁 Final Designs                    [Edit] [Delete] [+ Add Child]
  📁 Mobile Screens                 [Edit] [Delete] [+ Add Child]
    📁 Login Flow                   [Edit] [Delete] [+ Add Child]
      📄 Login Screen.png           [Edit] [Delete]
      📄 Password Screen.png        [Edit] [Delete]
    📁 Onboarding Flow              [Edit] [Delete] [+ Add Child]
  📁 Desktop Mockups                [Edit] [Delete] [+ Add Child]
📄 Style Guide.pdf                  [Edit] [Delete]
+ Add New Asset
```

**Visual Hierarchy:**
- Indentation: 24px per level
- Folder icon: 📁 (clickable to expand/collapse)
- File icon: 📄
- Collapsible folders with expand/collapse state
- Preview thumbnails shown inline (optional)

**Add Child Button:**
- Only visible for folders
- Opens form with `parent_id` pre-filled
- Breadcrumb shows: "Adding to: Final Designs > Mobile Screens"

**Delete Folder Behavior:**
- Warning if folder has children
- Options:
  1. Delete folder and all children (cascade delete)
  2. Move children to parent level
  3. Cancel

### 2. GDrivePage (View Mode)

**Breadcrumb Navigation:**

```
📁 All Assets > 📁 Final Designs > 📁 Mobile Screens > 📁 Login Flow

[Back to Parent]
```

**Folder Card Display:**

```
┌─────────────────────────────┐
│  [Preview Image Grid]       │
│  📁 Mobile Screens          │
│  5 items · 3 folders        │
│  [View Contents] [GDrive]   │
└─────────────────────────────┘
```

**Navigation Modes:**

**Mode A: In-Place Navigation (RECOMMENDED)**
- Click folder → Show children only
- Breadcrumb navigation at top
- "Back" button to go up one level
- "All Assets" button to return to root

**Mode B: Lightbox Drill-Down**
- Click folder → Open lightbox with children
- Navigate between folders in lightbox
- More complex, but keeps context

### 3. GDriveOverview (Dashboard View)

**Flat View with Paths:**

```
Project A
├─ Final Designs / Mobile Screens / Login Flow / Login Screen.png
├─ Final Designs / Desktop Mockups / Homepage.png
└─ Style Guide.pdf

Project B
├─ Research / User Interviews / Notes.pdf
└─ Wireframes / Low-Fi / Sketch 1.png
```

**Or Compact View:**

```
Project A (8 assets in 3 folders)
Project B (12 assets in 5 folders)
```

---

## 🔧 Implementation Plan

### Phase 1: Data Structure & Backend (Foundation)

**Files to Modify:**
1. `/types/project.ts` - Add `parent_id` field
2. `/utils/gdriveUtils.ts` (NEW) - Helper functions for tree operations

**Tasks:**
- [ ] Update `GDriveAsset` interface with `parent_id?: string | null`
- [ ] Create helper functions:
  - `getRootAssets()`
  - `getChildren()`
  - `getAssetPath()`
  - `hasChildren()`
  - `getAllDescendants()`
  - `validateNoCircularReference()`
- [ ] Add migration note for existing data (all existing assets have `parent_id: null`)

**Estimated Time:** 2 hours

---

### Phase 2: GDriveAssetManager (CRUD with Hierarchy)

**Files to Modify:**
1. `/components/GDriveAssetManager.tsx`

**Tasks:**
- [ ] Add tree view rendering with indentation
- [ ] Add expand/collapse state management per folder
- [ ] Update "Add Asset" form:
  - Add "Parent Folder" dropdown (optional)
  - Show breadcrumb when adding child
  - Filter dropdown to show only folders
- [ ] Add "Add Child" button for folders
- [ ] Update delete logic:
  - Check if folder has children
  - Show warning modal with options
  - Implement cascade delete or move children
- [ ] Add drag-and-drop reordering (optional, advanced)
- [ ] Visual indicators:
  - Indentation lines
  - Expand/collapse icons
  - Preview thumbnails inline

**Estimated Time:** 6 hours

---

### Phase 3: GDrivePage (Navigation & Viewing)

**Files to Modify:**
1. `/components/GDrivePage.tsx`

**Tasks:**
- [ ] Add breadcrumb navigation component
- [ ] Add folder navigation state:
  - `currentFolderId: string | null` (null = root)
  - `folderStack: string[]` (navigation history)
- [ ] Filter assets by `currentFolderId`:
  - Root: Show assets where `parent_id === null`
  - Folder: Show assets where `parent_id === currentFolderId`
- [ ] Update folder card:
  - Click → Navigate into folder
  - Show child count ("5 items")
  - Show preview grid from first N children
- [ ] Add "Back to Parent" button
- [ ] Add "All Assets" button (reset to root)
- [ ] Update lightbox to respect hierarchy
- [ ] Keyboard navigation:
  - Backspace → Go to parent folder

**Estimated Time:** 5 hours

---

### Phase 4: GDriveOverview (Dashboard Display)

**Files to Modify:**
1. `/components/GDriveOverview.tsx`

**Tasks:**
- [ ] Add path display using `getAssetPath()` helper
- [ ] Options for display mode:
  - Flat list with full paths
  - Grouped by root folder
  - Compact count only
- [ ] Click asset → Navigate to GDrivePage at correct folder level

**Estimated Time:** 2 hours

---

### Phase 5: Testing & Polish

**Tasks:**
- [ ] Test deeply nested structures (5+ levels)
- [ ] Test delete folder with children
- [ ] Test move asset between folders
- [ ] Test circular reference prevention
- [ ] Test backward compatibility (existing flat assets)
- [ ] Test preview images at all levels
- [ ] Test association with actionable items
- [ ] Mobile responsive design
- [ ] Add loading states
- [ ] Add empty states ("No items in this folder")

**Estimated Time:** 3 hours

---

## 📊 Total Estimation

**Total Development Time:** ~18 hours

**Breakdown:**
- Phase 1 (Foundation): 2 hours
- Phase 2 (Manager CRUD): 6 hours
- Phase 3 (Page Navigation): 5 hours
- Phase 4 (Overview): 2 hours
- Phase 5 (Testing): 3 hours

---

## 🚀 Quick Start (Minimal MVP)

**For fastest implementation, prioritize:**

### MVP Scope (6 hours):
1. ✅ Add `parent_id` field to type definition (30 min)
2. ✅ Add helper functions (1 hour)
3. ✅ Update GDriveAssetManager with basic tree view (2 hours)
4. ✅ Update GDrivePage with folder navigation (2 hours)
5. ✅ Basic testing (30 min)

**Later Enhancements:**
- Drag and drop reordering
- Advanced delete options
- Breadcrumb styling
- Preview grids in folder cards
- GDriveOverview path display

---

## 🔄 Backward Compatibility

**Existing Assets:**
- All existing `GDriveAsset` objects treated as root level
- `parent_id` defaults to `null` or `undefined`
- No migration required
- Existing features work unchanged

**Type Safety:**
```typescript
// Both valid
asset.parent_id === null      // Root level
asset.parent_id === undefined // Root level (backward compat)
asset.parent_id === 'folder-1' // Child asset
```

---

## ⚠️ Edge Cases & Considerations

### 1. Circular Reference Prevention
```typescript
function validateNoCircularReference(
  assets: GDriveAsset[], 
  assetId: string, 
  newParentId: string
): boolean {
  // Can't set parent to self
  if (assetId === newParentId) return false;
  
  // Can't set parent to own descendant
  const descendants = getAllDescendants(assets, assetId);
  if (descendants.some(d => d.id === newParentId)) return false;
  
  return true;
}
```

### 2. File vs Folder Rules
- Files cannot have children (enforce in UI)
- Only folders can have `[+ Add Child]` button
- When changing folder to file, check if has children first

### 3. Delete Cascade Options

**Option A: Prevent Delete**
- Require user to delete children first
- Safest, but tedious

**Option B: Cascade Delete**
- Delete folder and all descendants
- Show warning: "This will delete 12 items"
- Confirm with checkbox

**Option C: Move to Parent**
- Move children to deleted folder's parent level
- Preserve data but lose structure

**Recommended:** Option B (Cascade) with clear warning

### 4. Deep Nesting Limits
- UX consideration: Limit to 5 levels?
- Show warning if trying to nest too deep
- Performance: Tree traversal with large datasets

### 5. Search & Filter
- Should search include children?
- Filter by folder path?
- "Show all files (flatten)" toggle?

---

## 📚 References

**Existing Features to Maintain:**
- Multiple preview images per asset
- Preview carousel & lightbox
- Preview names/labels
- Association with actionable items
- File upload to Supabase Storage
- GDrive link integration

**UI Patterns:**
- Shadcn Collapsible for expand/collapse
- Lucide icons: `FolderIcon`, `FileIcon`, `ChevronRight`, `ChevronDown`
- Breadcrumb component (custom or shadcn)

---

## ❓ Open Questions for User

1. **Max Nesting Depth:**
   - Allow unlimited depth?
   - Or limit to N levels (e.g., 5)?

2. **Delete Behavior:**
   - Cascade delete all children?
   - Or require manual cleanup?

3. **UI Priority:**
   - Tree view in Manager (edit mode)?
   - Navigation in GDrivePage (view mode)?
   - Or both?

4. **MVP vs Full Feature:**
   - Start with basic 1-level nesting?
   - Or full unlimited depth from start?

5. **Association with Actionable Items:**
   - Can nested folders associate with different actionable items?
   - Or inherit from parent?

---

## ✅ Recommendation

**YES, this is POSSIBLE and FEASIBLE!**

**Best Approach:**
- Use **Option 1: Parent Reference** structure
- Implement in **phases** (MVP first, then enhance)
- Start with **Phase 1 + Phase 2** for basic functionality
- Total MVP time: ~8 hours

**Next Steps:**
1. Confirm requirements with user (answer open questions)
2. Start with Phase 1 (data structure & helpers)
3. Build incrementally with testing

**Risk Level:** 🟢 LOW
- Backward compatible
- Non-breaking change
- Existing features unaffected
- Incremental implementation possible

---

**Ready to proceed?** Let me know your preferences for the open questions, and we can start implementation! 🚀
