# Add Google Drive Assets Dialog - Comprehensive Planning

**Created:** 2025-10-16  
**Feature:** Bulk upload GDrive assets with folder structure detection & metadata editing  
**Complexity:** High (Folder recursion, FileSystem API, batch upload, nested UI)

---

## 📋 Feature Overview

### Purpose
Enable users to quickly add Google Drive assets to existing projects from the GDrive Overview tab, with support for:
- **Folder drag:** Automatically detect nested folder structure and preserve hierarchy
- **File drag:** Bulk upload files with individual metadata editing
- **Mixed workflow:** Support both scenarios in one unified dialog

### User Flow
```
GDrive Overview Tab
  ↓
[+ Add GDrive Asset] Button (pojok kanan, sejajar controls)
  ↓
Dialog Opens
  ↓
1️⃣ Select Project (Mandatory)
  ↓
2️⃣ Drag & Drop Area
  ↓
┌─────────────────────────┐
│ Scenario A: FOLDER drag │ → Detect structure → Tree editor → Submit
└─────────────────────────┘
┌─────────────────────────┐
│ Scenario B: FILES drag  │ → File cards → Metadata editor → Submit
└─────────────────────────┘
  ↓
Upload to Supabase Storage + Save to DB
  ↓
Success → Close → Refresh overview
```

---

## 🎯 Requirements Breakdown

### 1. Project Selection
- **UI:** Dropdown (ComboBox style)
- **Validation:** Required, show error if empty on submit
- **Behavior:** Form appears after selection
- **Data:** Sorted alphabetically (existing projects only)

### 2. Scenario A: Folder Drag (Recursive Structure Detection)

#### Input Example:
```
📁 Marketing Campaign/
├── 📁 Social Media/
│   ├── 📁 Instagram/
│   │   ├── 🖼️ post1.jpg
│   │   └── 🖼️ post2.png
│   └── 📁 Facebook/
│       └── 🖼️ cover.jpg
└── 📁 Email Assets/
    ├── 🖼️ header.png
    └── 🖼️ footer.png
```

#### Expected Output (DB Structure):
```javascript
[
  { 
    id: '1', 
    asset_name: 'Marketing Campaign', 
    asset_type: 'folder', 
    parent_id: null,
    gdrive_link: 'https://...' // MANDATORY
    asset_id: 'asset-123' // Optional
  },
  { 
    id: '2', 
    asset_name: 'Social Media', 
    asset_type: 'folder', 
    parent_id: '1',
    gdrive_link: 'https://...' // MANDATORY
    asset_id: 'asset-456' // Optional
  },
  { 
    id: '3', 
    asset_name: 'Instagram', 
    asset_type: 'folder', 
    parent_id: '2',
    gdrive_link: 'https://...' // MANDATORY
  },
  { 
    id: '4', 
    asset_name: 'post1.jpg', 
    asset_type: 'file', 
    parent_id: '3',
    preview_url: 'supabase://...',
    gdrive_link: '' // OPTIONAL - inherit from parent if empty
    asset_id: 'asset-789' // Optional
  },
  // ... more items
]
```

#### Tree View UI (Editable):
```
┌────────────────────────────────────────────────────────────────────┐
│ 📁 Marketing Campaign                                       [🎯][×]│
│   🔗 https://drive.google.com/... ✅ (required)                    │
│   ✅ Assigned to: "Q4 Campaign"                                    │
│   ├─ 📁 Social Media                                        [🎯][×]│
│   │    🔗 (empty - inherit)                                        │
│   │    ├─ 📁 Instagram                                      [🎯][×]│
│   │    │    🔗 https://drive.google.com/... ✅                     │
│   │    │    ├─ 🖼️ post1.jpg                                 [🎯][×]│
│   │    │    │    🔗 (inherit from Instagram)                       │
│   │    │    └─ 🖼️ post2.png                                 [🎯][×]│
│   │    │         🔗 https://... (custom)                           │
│   │    └─ 📁 Facebook                                       [🎯][×]│
│   │         🔗 (inherit)                                            │
│   │         └─ 🖼️ cover.jpg                                 [🎯][×]│
│   └─ 📁 Email Assets                                        [🎯][×]│
│        └─ ...                                                       │
│                                                                     │
│ [Assign All Files in Folder to Asset]  [Expand All] [Collapse All]│
└────────────────────────────────────────────────────────────────────┘
```

**Interactive Features:**
- ✏️ **Inline edit:** Click name to edit
- 🔗 **Link input:** Required for folders (red border if empty), optional for files
- 🎯 **Assign button:** Opens popover with actionable items dropdown
- ✅ **Badge:** Shows assigned asset name
- ❌ **Remove button:** Remove from upload queue (with confirmation)
- 🌲 **Tree expand/collapse:** Per folder, with "Expand All" / "Collapse All"
- 📸 **Thumbnail preview:** Show image preview for files

**Batch Operations:**
- "Assign all files in [Folder Name] to Asset" → Opens popover, applies to all files in folder recursively
- "Apply link to all children" → Propagate folder link to all sub-items (optional helper)

### 3. Scenario B: Files Drag (Individual Editing)

#### Input: 3 image files
```
image1.jpg, image2.png, hero-banner.jpg
```

#### UI: Card Grid
```
┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐
│ 🖼️                  │ │ 🖼️                  │ │ 🖼️                  │
│ [  Thumbnail  ]     │ │ [  Thumbnail  ]     │ │ [  Thumbnail  ]     │
│                     │ │                     │ │                     │
│ Name: image1.jpg    │ │ Name: image2.png    │ │ Name: hero-banner...│
│ ✏️ [Edit]          │ │ ✏️ [Edit]          │ │ ✏️ [Edit]          │
│                     │ │                     │ │                     │
│ Parent Folder:      │ │ Parent Folder:      │ │ Parent Folder:      │
│ [Select...      ▼] │ │ [Marketing     ▼]  │ │ [None          ▼]  │
│                     │ │                     │ │                     │
│ GDrive Link:        │ │ GDrive Link:        │ │ GDrive Link:        │
│ (optional)          │ │ https://...         │ │ (inherit)           │
│                     │ │                     │ │                     │
│ [🎯 Assign Asset]  │ │ [🎯 Hero Banner ×] │ │ [🎯 Assign Asset]  │
│                     │ │                     │ │                     │
│ [×] Remove          │ │ [×] Remove          │ │ [×] Remove          │
└─────────────────────┘ └─────────────────────┘ └─────────────────────┘
```

**Per-File Controls:**
- ✏️ **Edit name:** Inline text input
- 📁 **Parent folder dropdown:** List existing folders from selected project (can be empty = root level)
- 🔗 **GDrive Link input:** Optional, placeholder shows "Inherit from parent" if parent selected
- 🎯 **Assign Asset button:** Opens popover → Select from project's actionable items
- ❌ **Remove:** Remove from upload queue

---

## 🏗️ Component Architecture

### File Structure
```
/components/
├── AddGDriveAssetDialog.tsx         # Main dialog container
├── gdrive-bulk-upload/
│   ├── ProjectSelector.tsx          # Reusable project dropdown
│   ├── DragDropZone.tsx             # File/folder drop area with FileSystem API
│   ├── FolderStructureEditor.tsx    # Tree view editor for Scenario A
│   ├── FileCardsEditor.tsx          # Card grid editor for Scenario B
│   ├── FolderTreeItem.tsx           # Single folder row in tree
│   ├── FileTreeItem.tsx             # Single file row in tree
│   ├── FileCard.tsx                 # Single file card
│   ├── AssignAssetPopover.tsx       # Reusable asset assignment popover
│   └── types.ts                     # Type definitions
```

### Data Flow
```
AddGDriveAssetDialog
  │
  ├─> [State] selectedProjectId
  ├─> [State] uploadItems: UploadItem[]
  ├─> [State] uploadMode: 'folder' | 'files'
  │
  ├─> ProjectSelector
  │     └─> onChange → setSelectedProjectId
  │
  ├─> DragDropZone
  │     ├─> onFolderDrop → parseFolder() → setUploadItems(tree)
  │     └─> onFilesDrop → parseFiles() → setUploadItems(cards)
  │
  ├─> {uploadMode === 'folder' && 
  │     <FolderStructureEditor 
  │       items={uploadItems}
  │       onChange={setUploadItems}
  │     />}
  │
  ├─> {uploadMode === 'files' && 
  │     <FileCardsEditor 
  │       items={uploadItems}
  │       onChange={setUploadItems}
  │     />}
  │
  └─> handleSubmit()
        ├─> Validate (project, folder links, file names)
        ├─> Upload files to Supabase Storage
        ├─> Create GDriveAsset entries in DB
        └─> onSuccess → toast + close + refresh
```

---

## 📐 Type Definitions

```typescript
// /components/gdrive-bulk-upload/types.ts

export type UploadMode = 'folder' | 'files';

export interface UploadItem {
  // Temporary ID for UI tracking
  tempId: string;
  
  // Basic info
  name: string;
  type: 'folder' | 'file';
  
  // File data (only for type='file')
  file?: File;
  previewUrl?: string; // ObjectURL for local preview
  
  // Hierarchy (null = root level)
  parentTempId: string | null;
  
  // Metadata (editable)
  gdrive_link: string;
  asset_id?: string; // Associated actionable item
  
  // Tree UI state
  expanded?: boolean; // For folders
  
  // Validation
  errors?: {
    name?: string;
    gdrive_link?: string;
  };
}

export interface FolderTreeItemProps {
  item: UploadItem;
  items: UploadItem[]; // All items (for finding children)
  depth: number; // Indentation level
  actionableItems: ActionableItem[];
  onUpdate: (tempId: string, updates: Partial<UploadItem>) => void;
  onRemove: (tempId: string) => void;
  onToggleExpand: (tempId: string) => void;
  onBatchAssign: (folderTempId: string, assetId: string) => void;
}

export interface FileCardProps {
  item: UploadItem;
  existingFolders: UploadItem[]; // For parent dropdown
  actionableItems: ActionableItem[];
  onUpdate: (tempId: string, updates: Partial<UploadItem>) => void;
  onRemove: (tempId: string) => void;
}

export interface AssignAssetPopoverProps {
  actionableItems: ActionableItem[];
  selectedAssetId?: string;
  onSelect: (assetId: string | undefined) => void;
  trigger: React.ReactNode;
}
```

---

## 🔧 Technical Implementation Details

### 1. FileSystem API (Folder Detection)

```typescript
// DragDropZone.tsx

const handleDrop = async (event: React.DragEvent) => {
  event.preventDefault();
  
  const items = event.dataTransfer.items;
  
  // Detect if folder or files
  const hasFolder = Array.from(items).some(item => {
    const entry = item.webkitGetAsEntry?.();
    return entry?.isDirectory;
  });
  
  if (hasFolder) {
    // Scenario A: Folder structure
    const uploadItems = await parseFolderStructure(items);
    setUploadMode('folder');
    setUploadItems(uploadItems);
  } else {
    // Scenario B: Individual files
    const uploadItems = await parseFiles(items);
    setUploadMode('files');
    setUploadItems(uploadItems);
  }
};

async function parseFolderStructure(
  items: DataTransferItemList
): Promise<UploadItem[]> {
  const result: UploadItem[] = [];
  
  for (const item of Array.from(items)) {
    const entry = item.webkitGetAsEntry?.();
    if (!entry) continue;
    
    await traverseDirectory(entry, null, result);
  }
  
  return result;
}

async function traverseDirectory(
  entry: FileSystemEntry,
  parentTempId: string | null,
  result: UploadItem[],
  depth: number = 0
): Promise<void> {
  // Max depth check
  if (depth >= 10) {
    toast.error('Maximum folder depth (10 levels) exceeded');
    return;
  }
  
  const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  if (entry.isDirectory) {
    // Add folder
    result.push({
      tempId,
      name: entry.name,
      type: 'folder',
      parentTempId,
      gdrive_link: '',
      expanded: true,
      errors: { gdrive_link: 'Required' } // Initial validation
    });
    
    // Traverse children
    const dirReader = (entry as FileSystemDirectoryEntry).createReader();
    const entries = await readEntries(dirReader);
    
    for (const childEntry of entries) {
      await traverseDirectory(childEntry, tempId, result, depth + 1);
    }
    
  } else if (entry.isFile) {
    // Add file
    const fileEntry = entry as FileSystemFileEntry;
    const file = await getFile(fileEntry);
    
    // Validate: images only
    if (!file.type.startsWith('image/')) {
      toast.warning(`Skipped non-image file: ${file.name}`);
      return;
    }
    
    // Validate: max 5MB
    if (file.size > 5 * 1024 * 1024) {
      toast.warning(`Skipped file > 5MB: ${file.name}`);
      return;
    }
    
    result.push({
      tempId,
      name: file.name,
      type: 'file',
      file,
      previewUrl: URL.createObjectURL(file),
      parentTempId,
      gdrive_link: '', // Optional, will inherit
      errors: {}
    });
  }
}

// Helper to promisify FileSystemDirectoryReader
function readEntries(dirReader: FileSystemDirectoryReader): Promise<FileSystemEntry[]> {
  return new Promise((resolve, reject) => {
    const entries: FileSystemEntry[] = [];
    
    const readBatch = () => {
      dirReader.readEntries((batch) => {
        if (batch.length === 0) {
          resolve(entries);
        } else {
          entries.push(...batch);
          readBatch(); // Continue reading
        }
      }, reject);
    };
    
    readBatch();
  });
}

// Helper to get File from FileEntry
function getFile(fileEntry: FileSystemFileEntry): Promise<File> {
  return new Promise((resolve, reject) => {
    fileEntry.file(resolve, reject);
  });
}
```

**Browser Compatibility:**
- ✅ Chrome/Edge: Full support
- ⚠️ Firefox: Limited (no folder upload via FileSystem API)
- ⚠️ Safari: Limited (experimental)

**Fallback Strategy:**
```typescript
// Check browser support
const supportsFileSystemAPI = 'webkitGetAsEntry' in DataTransferItem.prototype;

if (!supportsFileSystemAPI) {
  return (
    <Alert variant="warning">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Limited Browser Support</AlertTitle>
      <AlertDescription>
        Folder upload requires Chrome or Edge browser. 
        You can still upload individual files.
      </AlertDescription>
    </Alert>
  );
}
```

### 2. Validation Logic

```typescript
// Validate before submit
function validateUploadItems(items: UploadItem[]): boolean {
  let isValid = true;
  const updatedItems = items.map(item => {
    const errors: UploadItem['errors'] = {};
    
    // Name required
    if (!item.name.trim()) {
      errors.name = 'Name is required';
      isValid = false;
    }
    
    // Folder link required
    if (item.type === 'folder' && !item.gdrive_link.trim()) {
      errors.gdrive_link = 'Google Drive link is required for folders';
      isValid = false;
    }
    
    return { ...item, errors };
  });
  
  setUploadItems(updatedItems);
  return isValid;
}
```

### 3. Batch Upload to Supabase Storage

```typescript
async function handleSubmit() {
  // Validate
  if (!selectedProjectId) {
    toast.error('Please select a project');
    return;
  }
  
  if (!validateUploadItems(uploadItems)) {
    toast.error('Please fix validation errors');
    return;
  }
  
  setUploading(true);
  
  try {
    const project = projects.find(p => p.id === selectedProjectId);
    if (!project) throw new Error('Project not found');
    
    // Filter files to upload
    const filesToUpload = uploadItems.filter(item => item.type === 'file');
    
    // Validate count
    if (filesToUpload.length > 100) {
      toast.error('Maximum 100 files per upload');
      return;
    }
    
    // Upload files to Supabase Storage
    const uploadedFiles = await uploadFilesToStorage(filesToUpload);
    
    // Map temp IDs to final structure
    const finalAssets: GDriveAsset[] = uploadItems.map((item, index) => {
      const uploadedFile = uploadedFiles.find(uf => uf.tempId === item.tempId);
      
      return {
        id: `gdrive-${Date.now()}-${index}`,
        asset_name: item.name,
        asset_type: item.type,
        gdrive_link: item.gdrive_link || getInheritedLink(item, uploadItems),
        parent_id: item.parentTempId ? mapTempIdToFinal(item.parentTempId, uploadItems) : null,
        asset_id: item.asset_id,
        preview_url: uploadedFile?.signedUrl, // From Supabase
        created_at: new Date().toISOString()
      };
    });
    
    // Update project
    const updatedAssets = [...(project.gdrive_assets || []), ...finalAssets];
    await onProjectUpdate(selectedProjectId, {
      gdrive_assets: updatedAssets
    });
    
    toast.success(`${finalAssets.length} assets added successfully`);
    handleClose();
    
  } catch (error) {
    console.error('Upload error:', error);
    toast.error('Failed to upload assets');
  } finally {
    setUploading(false);
  }
}

// Helper: Get inherited link from parent
function getInheritedLink(item: UploadItem, allItems: UploadItem[]): string {
  if (item.gdrive_link) return item.gdrive_link;
  if (!item.parentTempId) return '';
  
  const parent = allItems.find(i => i.tempId === item.parentTempId);
  if (!parent) return '';
  
  return getInheritedLink(parent, allItems); // Recursive
}

// Upload to Supabase Storage
async function uploadFilesToStorage(
  filesToUpload: UploadItem[]
): Promise<{ tempId: string; signedUrl: string }[]> {
  const results: { tempId: string; signedUrl: string }[] = [];
  
  for (const item of filesToUpload) {
    if (!item.file) continue;
    
    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substr(2, 9);
    const extension = item.file.name.split('.').pop();
    const filename = `${timestamp}-${randomStr}.${extension}`;
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('make-691c6bba-gdrive-assets')
      .upload(filename, item.file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) {
      console.error(`Upload failed for ${item.name}:`, error);
      toast.error(`Failed to upload ${item.name}`);
      continue;
    }
    
    // Get signed URL
    const { data: signedData } = await supabase.storage
      .from('make-691c6bba-gdrive-assets')
      .createSignedUrl(data.path, 60 * 60 * 24 * 365); // 1 year
    
    if (signedData?.signedUrl) {
      results.push({
        tempId: item.tempId,
        signedUrl: signedData.signedUrl
      });
    }
  }
  
  return results;
}
```

### 4. Tree View Rendering

```typescript
// FolderStructureEditor.tsx

function FolderStructureEditor({ items, onChange, actionableItems }: Props) {
  // Build tree hierarchy
  const rootItems = items.filter(item => item.parentTempId === null);
  
  return (
    <div className="space-y-2 max-h-[500px] overflow-y-auto border rounded-lg p-4">
      {rootItems.map(item => (
        <TreeNode
          key={item.tempId}
          item={item}
          allItems={items}
          depth={0}
          actionableItems={actionableItems}
          onUpdate={handleUpdate}
          onRemove={handleRemove}
        />
      ))}
      
      <div className="flex gap-2 pt-4 border-t">
        <Button variant="outline" size="sm" onClick={expandAll}>
          Expand All
        </Button>
        <Button variant="outline" size="sm" onClick={collapseAll}>
          Collapse All
        </Button>
      </div>
    </div>
  );
}

// TreeNode recursive component
function TreeNode({ item, allItems, depth, ... }: TreeNodeProps) {
  const children = allItems.filter(i => i.parentTempId === item.tempId);
  const hasChildren = children.length > 0;
  
  return (
    <div>
      {/* Current item */}
      {item.type === 'folder' ? (
        <FolderTreeItem
          item={item}
          depth={depth}
          hasChildren={hasChildren}
          onToggle={() => onUpdate(item.tempId, { expanded: !item.expanded })}
          {...otherProps}
        />
      ) : (
        <FileTreeItem
          item={item}
          depth={depth}
          {...otherProps}
        />
      )}
      
      {/* Children (if expanded) */}
      {item.expanded && hasChildren && (
        <div className="ml-6 border-l-2 border-border pl-2">
          {children.map(child => (
            <TreeNode
              key={child.tempId}
              item={child}
              allItems={allItems}
              depth={depth + 1}
              {...otherProps}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## 🎨 UI Component Details

### AssignAssetPopover (Reusable)

```typescript
// AssignAssetPopover.tsx

export function AssignAssetPopover({
  actionableItems,
  selectedAssetId,
  onSelect,
  trigger
}: AssignAssetPopoverProps) {
  const [open, setOpen] = useState(false);
  const selectedAsset = actionableItems.find(a => a.id === selectedAssetId);
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {trigger}
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-2">
          <Label>Associate with Asset</Label>
          <Select value={selectedAssetId} onValueChange={onSelect}>
            <SelectTrigger>
              <SelectValue placeholder="Select asset (optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">None</SelectItem>
              {actionableItems.map(asset => (
                <SelectItem key={asset.id} value={asset.id}>
                  {asset.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedAssetId && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onSelect(undefined);
                setOpen(false);
              }}
            >
              Clear Assignment
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Usage in FolderTreeItem
<AssignAssetPopover
  actionableItems={actionableItems}
  selectedAssetId={item.asset_id}
  onSelect={(assetId) => onUpdate(item.tempId, { asset_id: assetId })}
  trigger={
    <Button variant="ghost" size="sm">
      <Target className="h-4 w-4" />
    </Button>
  }
/>

// Show badge if assigned
{item.asset_id && (
  <Badge variant="secondary" className="ml-2">
    {actionableItems.find(a => a.id === item.asset_id)?.title}
    <X 
      className="h-3 w-3 ml-1 cursor-pointer" 
      onClick={() => onUpdate(item.tempId, { asset_id: undefined })}
    />
  </Badge>
)}
```

---

## 📝 Implementation Phases

### Phase 1: Foundation (Day 1)
- ✅ Create folder structure
- ✅ Define TypeScript types
- ✅ Build `AddGDriveAssetDialog` shell
- ✅ Implement `ProjectSelector`
- ✅ Basic `DragDropZone` (detect folder vs files)

### Phase 2: Folder Detection (Day 2)
- ✅ Implement FileSystem API parser
- ✅ Recursive directory traversal
- ✅ File validation (type, size)
- ✅ Generate `UploadItem[]` tree structure
- ✅ Browser compatibility check + warning

### Phase 3: Tree Editor UI (Day 3)
- ✅ Build `FolderStructureEditor`
- ✅ Implement `TreeNode` recursive component
- ✅ Create `FolderTreeItem` (editable row)
- ✅ Create `FileTreeItem` (editable row with thumbnail)
- ✅ Expand/collapse functionality
- ✅ Real-time validation (red borders)

### Phase 4: Files Editor UI (Day 4)
- ✅ Build `FileCardsEditor`
- ✅ Create `FileCard` component
- ✅ Parent folder dropdown
- ✅ Link input with inheritance indicator
- ✅ Remove functionality

### Phase 5: Asset Assignment (Day 5)
- ✅ Build `AssignAssetPopover` component
- ✅ Integrate with folder items
- ✅ Integrate with file items
- ✅ Implement "Assign all files in folder" batch operation
- ✅ Show assignment badges

### Phase 6: Upload & Submit (Day 6)
- ✅ Validation before submit
- ✅ Upload files to Supabase Storage
- ✅ Progress indicators
- ✅ Map temp IDs to final structure
- ✅ Update project in DB
- ✅ Success handling + cleanup

### Phase 7: Polish & Testing (Day 7)
- ✅ Error handling (network failures, storage errors)
- ✅ Loading states
- ✅ Empty states
- ✅ Mobile responsive
- ✅ Keyboard navigation
- ✅ Accessibility (ARIA labels)
- ✅ Comprehensive testing

---

## 🧪 Testing Strategy

### Unit Tests
- ✅ `parseFolderStructure` with mock FileSystem entries
- ✅ `getInheritedLink` logic
- ✅ Validation functions
- ✅ Tree traversal logic

### Integration Tests
1. **Folder Upload Flow:**
   - Drag folder → Verify structure parsed
   - Edit folder names → Verify state updated
   - Add folder links → Verify validation passes
   - Assign assets → Verify IDs saved
   - Submit → Verify DB updated

2. **Files Upload Flow:**
   - Drag 3 files → Verify cards rendered
   - Edit file names → Verify state updated
   - Select parent folders → Verify hierarchy
   - Assign assets → Verify IDs saved
   - Submit → Verify storage + DB updated

3. **Edge Cases:**
   - Drag empty folder → Show warning
   - Drag non-image files → Skip + toast
   - Drag file > 5MB → Skip + toast
   - Drag > 100 files → Show error
   - Folder depth > 10 → Show error
   - Submit without project → Show error
   - Submit with missing folder links → Highlight errors

### Manual Testing Checklist
- [ ] Chrome: Drag folder with 3 levels → Success
- [ ] Chrome: Drag 50 images → Success
- [ ] Edge: Folder upload → Success
- [ ] Firefox: Folder upload → Show warning
- [ ] Safari: Folder upload → Show warning
- [ ] Mobile Chrome: File upload → Success
- [ ] Keyboard navigation: Tab through fields → All accessible
- [ ] Screen reader: ARIA labels → All announced

---

## 🚨 Known Limitations

1. **Browser Compatibility:**
   - Folder upload only works in Chrome/Edge
   - Firefox/Safari users must upload files individually
   - Mobile browsers: file upload only (no folder)

2. **Performance:**
   - Large folders (1000+ files) may freeze UI during parsing
   - Consider pagination or virtual scrolling for large trees

3. **File Types:**
   - Images only (for now)
   - Future: Support videos, PDFs, etc.

4. **Concurrent Uploads:**
   - Sequential upload (not parallel)
   - Future: Implement parallel upload with queue

---

## 📊 Success Metrics

- ✅ Dialog opens from GDrive overview
- ✅ Folder structure detected correctly (100% accuracy)
- ✅ File uploads complete (< 5s for 10 files)
- ✅ Tree UI renders smoothly (60fps)
- ✅ Validation prevents bad data (0 invalid submissions)
- ✅ Mobile responsive (usable on phone)

---

## 🔗 Related Files

- `/components/GDriveAssetManager.tsx` - Existing manager (project detail)
- `/components/FileDropZone.tsx` - Existing file drop zone (reference)
- `/components/GDriveOverview.tsx` - Target integration point
- `/types/project.ts` - GDriveAsset type definition
- `/utils/supabase/client.tsx` - Storage upload utilities

---

## 📅 Timeline

**Estimated:** 7 working days  
**Priority:** High  
**Dependencies:** None (independent feature)  
**Blocked by:** None

---

**Next Steps:**
1. Review & approve this plan
2. Begin Phase 1 implementation
3. Iterative development with daily check-ins
4. Final testing & polish
5. Deploy to production

---

**End of Planning Document**
