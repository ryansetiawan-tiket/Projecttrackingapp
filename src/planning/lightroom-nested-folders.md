# Lightroom Nested Folders - Implementation Plan

**Status:** 📝 Planning  
**Created:** 2025-10-17  
**Priority:** Medium  

---

## 🎯 Overview

Implementasi sistem nested folders untuk Lightroom assets yang fokus pada **pure organizing** tanpa external links. Berbeda dengan GDrive foldering yang memiliki folder links ke Google Drive, Lightroom folders murni untuk categorization dan organization internal.

### **Use Cases:**
- 📸 Group by photo shoot/session
- 📍 Organize by location/event  
- 🎨 Separate by processing stage (raw, edited, final)
- 📅 Category by date range or project phase
- 🏷️ Thematic grouping (portraits, landscapes, products, etc.)

---

## 🔄 Comparison: GDrive vs Lightroom Foldering

| Aspect | GDrive Folders | Lightroom Folders |
|--------|----------------|-------------------|
| **Folder Link** | ✅ Required (Google Drive URL) | ❌ Not available |
| **Nested Folders** | ✅ Multi-level support | ✅ Multi-level support |
| **Breadcrumb** | ✅ "Google Drive > Folder A > Folder B" | ✅ "Lightroom > Folder A > Folder B" |
| **Drag & Drop** | ✅ Move assets between folders | ✅ Move assets between folders |
| **Search** | ✅ Search within folder | ✅ Search within folder |
| **Primary Purpose** | Link to external storage + organize | Pure internal organization |
| **Complexity** | Higher (link management) | Lower (no external deps) |

---

## 🗄️ Database Schema

### **Existing Pattern (GDrive):**
```typescript
// kv_store key pattern for GDrive folders
gdrive_folders:{projectId}:{folderId} = {
  id: string;
  name: string;
  folder_link?: string;  // ← GDrive specific
  parent_folder_id: string | null;
  created_at: string;
}

// GDrive assets reference folders
gdrive_assets:{projectId}:{assetId} = {
  ...
  folder_id?: string;
}
```

### **New Pattern (Lightroom):**
```typescript
// kv_store key pattern for Lightroom folders
lightroom_folders:{projectId}:{folderId} = {
  id: string;
  name: string;
  // NO folder_link field
  parent_folder_id: string | null;
  created_at: string;
  color?: string;  // Optional: folder color for visual grouping
}

// Lightroom assets reference folders  
lightroom_assets:{projectId}:{assetId} = {
  ...
  folder_id?: string;  // Reference to lightroom folder
}
```

**Key Differences:**
- ✅ Simpler schema (no `folder_link`)
- ✅ Optional `color` field for visual categorization
- ✅ Same parent-child relationship pattern

---

## 🔌 Backend API Endpoints

### **Pattern to Follow from GDrive:**

Reference endpoints dari `/supabase/functions/server/index.tsx`:

```typescript
// GDrive folder CRUD
app.post('/make-server-691c6bba/gdrive-folders/:projectId', ...)
app.put('/make-server-691c6bba/gdrive-folders/:projectId/:folderId', ...)
app.delete('/make-server-691c6bba/gdrive-folders/:projectId/:folderId', ...)

// GDrive assets folder assignment
app.put('/make-server-691c6bba/gdrive-assets/:projectId/:assetId', ...)
```

### **New Endpoints untuk Lightroom:**

```typescript
// 1. CREATE Lightroom Folder
POST /make-server-691c6bba/lightroom-folders/:projectId
Body: {
  name: string;
  parent_folder_id: string | null;
  color?: string;
}
Returns: { id: string; name: string; parent_folder_id: string | null; ... }

// 2. UPDATE Lightroom Folder
PUT /make-server-691c6bba/lightroom-folders/:projectId/:folderId
Body: {
  name?: string;
  color?: string;
}
Returns: { success: true }

// 3. DELETE Lightroom Folder
DELETE /make-server-691c6bba/lightroom-folders/:projectId/:folderId
Query: ?deleteAssets=true/false
Returns: { success: true }

// 4. MOVE Lightroom Asset to Folder
PUT /make-server-691c6bba/lightroom-assets/:projectId/:assetId
Body: {
  folder_id: string | null;  // null = move to root
}
Returns: { success: true }

// 5. GET Folder Tree (optional, for performance)
GET /make-server-691c6bba/lightroom-folders/:projectId
Returns: FolderNode[] // Nested folder structure
```

**Implementation Notes:**
- Reuse validation logic dari GDrive endpoints
- Handle circular folder references prevention
- Validate parent_folder_id exists before creating subfolder
- Delete behavior: ask user to move assets or delete with folder

---

## 🎨 Frontend Components

### **1. LightroomPage.tsx** (Primary modification)

**Current State:**
- Simple flat list of assets
- Basic search functionality
- No folder navigation

**Required Changes:**

```typescript
// Add state management
const [folders, setFolders] = useState<LightroomFolder[]>([]);
const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
const [folderPath, setFolderPath] = useState<LightroomFolder[]>([]);

// Add folder CRUD functions
const createFolder = async (name: string, parentFolderId: string | null) => {...}
const updateFolder = async (folderId: string, updates: Partial<LightroomFolder>) => {...}
const deleteFolder = async (folderId: string, deleteAssets: boolean) => {...}
const moveAssetToFolder = async (assetId: string, folderId: string | null) => {...}

// Navigation
const navigateToFolder = (folderId: string | null) => {...}
const navigateUp = () => {...}
```

**UI Layout:**
```
┌─────────────────────────────────────────────────────┐
│ [Breadcrumb] Lightroom > Shoots 2024 > Wedding     │
│ [Search] [+ New Folder] [View Options]              │
├────────��────────────────────────────────────────────┤
│ 📁 Folder A (12 assets)                             │
│ 📁 Folder B (5 assets)                              │
│ 🖼️ Asset 1                                          │
│ 🖼️ Asset 2                                          │
└─────────────────────────────────────────────────────┘
```

### **2. AddLightroomAssetDialog.tsx**

**Add folder picker:**
```typescript
// Add folder selection field
<Select value={selectedFolderId} onValueChange={setSelectedFolderId}>
  <SelectTrigger>
    <SelectValue placeholder="Select folder (optional)" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="root">📂 Root (no folder)</SelectItem>
    {renderFolderTree(folders)}
  </SelectContent>
</Select>
```

### **3. LightroomAssetManager.tsx**

**Add folder context menu:**
- Move to folder
- View folder info
- Show assets in folder

### **4. New Component: LightroomFolderManager.tsx**

**Purpose:** Manage folder tree, similar to GDrive folder cards

```typescript
interface LightroomFolderManagerProps {
  projectId: string;
  folders: LightroomFolder[];
  currentFolderId: string | null;
  onNavigate: (folderId: string | null) => void;
  onFolderCreate: (name: string, parentId: string | null) => void;
  onFolderUpdate: (id: string, updates: Partial<LightroomFolder>) => void;
  onFolderDelete: (id: string, deleteAssets: boolean) => void;
}
```

**Features:**
- Display folder cards with asset count
- Inline rename
- Color picker for folders
- Delete with confirmation dialog
- Drag & drop to move folders

---

## 📦 Types & Utilities

### **types/project.ts** - Add new types:

```typescript
export interface LightroomFolder {
  id: string;
  name: string;
  parent_folder_id: string | null;
  created_at: string;
  color?: string;
}

export interface LightroomAssetWithFolder extends LightroomAsset {
  folder_id?: string;
}
```

### **utils/lightroomUtils.ts** - New utility file:

```typescript
// Build folder tree from flat array
export function buildLightroomFolderTree(
  folders: LightroomFolder[]
): FolderNode[] {...}

// Get folder path for breadcrumb
export function getFolderPath(
  folderId: string | null,
  folders: LightroomFolder[]
): LightroomFolder[] {...}

// Count assets in folder (recursive)
export function countAssetsInFolder(
  folderId: string,
  assets: LightroomAsset[],
  folders: LightroomFolder[]
): number {...}

// Validate folder name
export function validateFolderName(name: string): {
  valid: boolean;
  error?: string;
} {...}

// Prevent circular folder references
export function isCircularReference(
  folderId: string,
  newParentId: string,
  folders: LightroomFolder[]
): boolean {...}
```

---

## 🔧 Implementation Phases

### **Phase 1: Backend Foundation** ⏱️ 1-2 hours

- [ ] Create Lightroom folder CRUD endpoints in `/supabase/functions/server/index.tsx`
- [ ] Add validation logic (prevent circular refs, validate parent exists)
- [ ] Implement delete folder logic (with cascade option)
- [ ] Add folder_id field to lightroom assets update endpoint
- [ ] Test all endpoints with manual API calls

**Files to modify:**
- `/supabase/functions/server/index.tsx`

### **Phase 2: Types & Utilities** ⏱️ 30 min - 1 hour

- [ ] Add `LightroomFolder` interface to `types/project.ts`
- [ ] Create `utils/lightroomUtils.ts` with folder tree functions
- [ ] Add folder management hooks to existing patterns

**Files to create/modify:**
- `/types/project.ts`
- `/utils/lightroomUtils.ts`

### **Phase 3: Folder Management UI** ⏱️ 2-3 hours

- [ ] Create `LightroomFolderManager.tsx` component
- [ ] Implement folder cards with:
  - Asset count display
  - Inline rename
  - Color picker
  - Delete confirmation
- [ ] Add drag & drop for folder reordering
- [ ] Add "Create Subfolder" action

**Files to create:**
- `/components/LightroomFolderManager.tsx`

### **Phase 4: LightroomPage Integration** ⏱️ 2-3 hours

- [ ] Add folder state management to `LightroomPage.tsx`
- [ ] Implement breadcrumb navigation (reuse GDrive breadcrumb pattern)
- [ ] Add "+ New Folder" button
- [ ] Filter assets by current folder
- [ ] Handle search within current folder context
- [ ] Update asset display to show folder indicator

**Files to modify:**
- `/components/LightroomPage.tsx`

### **Phase 5: Asset-Folder Integration** ⏱️ 1-2 hours

- [ ] Add folder picker to `AddLightroomAssetDialog.tsx`
- [ ] Add "Move to folder" to `LightroomAssetManager.tsx` context menu
- [ ] Implement drag & drop to move assets between folders
- [ ] Update asset cards to show folder badge/path

**Files to modify:**
- `/components/AddLightroomAssetDialog.tsx`
- `/components/LightroomAssetManager.tsx`

### **Phase 6: Polish & Testing** ⏱️ 1-2 hours

- [ ] Add loading states for folder operations
- [ ] Add error handling & toast notifications
- [ ] Test edge cases:
  - Deleting folder with subfolders
  - Moving folder to child (circular prevention)
  - Search across all folders
  - Empty folder states
- [ ] Mobile responsiveness check
- [ ] Performance testing with many folders/assets

---

## 🧪 Testing Checklist

### **Backend Tests:**
- [ ] Create folder in root
- [ ] Create nested folder (3 levels deep)
- [ ] Rename folder
- [ ] Delete empty folder
- [ ] Delete folder with assets (keep assets)
- [ ] Delete folder with assets (cascade delete)
- [ ] Move asset to folder
- [ ] Move asset back to root
- [ ] Prevent circular folder reference

### **Frontend Tests:**
- [ ] Folder tree renders correctly
- [ ] Breadcrumb navigation works
- [ ] Click folder to navigate
- [ ] Click breadcrumb to go back
- [ ] Create folder from "+ New Folder"
- [ ] Create subfolder from folder card
- [ ] Rename folder inline
- [ ] Change folder color
- [ ] Delete folder (with confirmation)
- [ ] Search filters by current folder
- [ ] Asset count updates when moving assets
- [ ] Drag & drop asset to folder
- [ ] Empty folder shows placeholder

### **Edge Cases:**
- [ ] Many folders (50+) performance
- [ ] Deep nesting (10+ levels)
- [ ] Folder with 100+ assets
- [ ] Special characters in folder name
- [ ] Very long folder name (truncation)
- [ ] Mobile folder navigation
- [ ] Concurrent folder updates (multi-user)

---

## 🎨 Design Considerations

### **Folder Colors:**
Optional visual grouping without affecting functionality:
- 🔴 Red - Urgent/Priority shoots
- 🟡 Yellow - In Progress
- 🟢 Green - Completed/Delivered
- 🔵 Blue - Archive
- ⚪ Gray - Default

### **Folder Icons:**
Keep simple folder icon `📁` or allow custom emoji picker (future enhancement)

### **Empty States:**
```
┌──────────────────────────────────┐
│   📂                             │
│   No folders yet                 │
│   Create one to organize assets  │
│   [+ Create Folder]              │
└──────────────────────────────────┘
```

---

## 🚀 Optional Future Enhancements

**Not in initial scope, but could add later:**

1. **Folder Templates** - Pre-defined folder structures (e.g., "Wedding Shoot" creates standard subfolders)
2. **Bulk Move** - Select multiple assets and move to folder
3. **Folder Sharing** - Share folder view with specific team members
4. **Smart Folders** - Auto-categorize based on metadata (date, file type, etc.)
5. **Folder Archive** - Hide old folders without deleting
6. **Folder Stats** - Total file size, creation date, last modified
7. **Folder Export** - Export all assets in folder as ZIP

---

## 📝 Notes

**Why No Folder Links?**
- Lightroom assets are imported content (photos, videos), not references to external storage
- Unlike GDrive which links to existing Google Drive folders, Lightroom folders are purely organizational
- This makes the implementation simpler and more focused

**Reusability:**
- 80% of logic can be adapted from GDrive foldering
- Breadcrumb component can be generalized
- Folder tree utilities can be shared
- Drag & drop patterns are identical

**Performance:**
- Cache folder tree in component state
- Lazy load assets when navigating folders
- Debounce search within folders
- Memoize folder count calculations

---

## ✅ Success Criteria

Implementation is complete when:
- ✅ Users can create nested folders
- ✅ Users can navigate folder hierarchy with breadcrumbs
- ✅ Users can move assets between folders
- ✅ Users can rename/delete folders
- ✅ Search respects current folder context
- ✅ Asset count per folder is accurate
- ✅ No circular folder references possible
- ✅ Mobile navigation works smoothly
- ✅ All edge cases handled gracefully

---

**Total Estimated Time:** 8-12 hours  
**Complexity:** Medium (reusing GDrive patterns reduces risk)  
**Impact:** High (significantly improves Lightroom asset organization)
