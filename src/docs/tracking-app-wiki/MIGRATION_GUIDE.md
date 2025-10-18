# Migration Guide

## 📦 Database Migration History

Dokumen ini berisi history lengkap semua migration yang pernah dilakukan.

## Daftar Isi

1. [Overview](#overview)
2. [Major Migrations](#major-migrations)
3. [Settings Migration (localStorage → Database)](#settings-migration-localstorage--database)
4. [Terminology Changes](#terminology-changes)
5. [Schema Changes](#schema-changes)
6. [Data Structure Changes](#data-structure-changes)

---

## Overview

### Migration Philosophy
- **Backward Compatibility**: Always support old data structures
- **Zero Downtime**: Migrations should not break existing functionality
- **Rollback Support**: Ability to revert if needed
- **Data Integrity**: Validate data before and after migration

### Migration Process
```
1. Planning
   └─> Identify what needs to migrate
   └─> Design new structure
   └─> Plan backward compatibility

2. Implementation
   └─> Write migration script
   └─> Add backward compatibility handlers
   └─> Test with sample data

3. Deployment
   └─> Backup existing data
   └─> Run migration
   └─> Verify success

4. Cleanup (Optional)
   └─> Remove old structure (after transition period)
   └─> Update documentation
```

---

## Major Migrations

### Timeline of Major Migrations

| Date | Migration | Type | Status |
|------|-----------|------|--------|
| 2024-Q4 | localStorage → Database | Settings | ✅ Complete |
| 2024-Q4 | "Editor" → "Admin" | Terminology | ✅ Complete |
| 2024-Q4 | Hardcoded → Dynamic Status | System | ✅ Complete |
| 2024-Q4 | Flat → Nested GDrive Folders | Structure | ✅ Complete |
| 2025-Q1 | Action Status to Dynamic | System | ✅ Complete |

---

## Settings Migration (localStorage → Database)

### Background

**Problem**: 
- Settings stored in localStorage (client-side only)
- Not synced across devices
- Lost on browser clear
- No backup
- No team sharing

**Solution**:
Migrate all settings to Supabase database

### Affected Settings

#### 1. **Admin Profile Settings**
```typescript
// Before (localStorage)
{
  editorName: "John Doe"  // Stored locally
}

// After (Database: settings table)
{
  user_id: "uuid",
  setting_key: "admin_profile",
  setting_value: {
    fullName: "John Doe",  // Note: editorName → fullName
    email: "john@example.com",
    preferences: {}
  }
}
```

#### 2. **Type Settings**
```typescript
// Before (localStorage)
{
  types: ["Design", "Video", "Illustration"]
}

// After (Database: settings table)
{
  user_id: "uuid",
  setting_key: "types",
  setting_value: {
    types: [
      {
        id: "uuid",
        name: "Design",
        color: "hsl(210, 70%, 50%)",
        order: 0
      }
    ]
  }
}
```

#### 3. **Vertical Settings**
```typescript
// Similar structure as Types
// Migrated to database dengan color & order support
```

#### 4. **Status Settings**
```typescript
// Before (Hardcoded)
const STATUSES = ["To Do", "In Progress", "Review", "Done"];

// After (Database: statuses table)
CREATE TABLE statuses (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  order_index INTEGER,
  user_id UUID REFERENCES auth.users(id)
);
```

#### 5. **Team Settings**
```typescript
// Before (localStorage)
{
  teams: [
    { name: "John", email: "john@example.com", role: "Designer" }
  ]
}

// After (Database: teams table)
CREATE TABLE teams (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL,
  color TEXT,
  user_id UUID REFERENCES auth.users(id)
);
```

#### 6. **Workflow Settings**
```typescript
// Before (localStorage)
{
  workflows: [...]
}

// After (Database: settings table)
{
  setting_key: "workflows",
  setting_value: { workflows: [...] }
}
```

#### 7. **Action Presets**
```typescript
// Before (localStorage)
{
  actionPresets: [...]
}

// After (Database: settings table)
{
  setting_key: "action_presets",
  setting_value: { presets: [...] }
}
```

#### 8. **Link Labels**
```typescript
// Before (localStorage)
{
  linkLabels: [
    { label: "Figma", icon_type: "svg", icon_value: "..." }
  ]
}

// After (Database: settings table)
{
  setting_key: "link_labels",
  setting_value: {
    labels: [
      {
        id: "uuid",
        label: "Figma",
        icon_type: "svg",
        icon_value: "...",
        placeholder: "Paste Figma link..."
      }
    ]
  }
}
```

### Migration Script

```typescript
// Comprehensive migration function
export async function migrateAllSettings(user: User) {
  const migrations = [
    migrateAdminProfile,
    migrateTypes,
    migrateVerticals,
    migrateStatuses,
    migrateTeams,
    migrateWorkflows,
    migrateActionPresets,
    migrateLinkLabels
  ];

  const results = {
    success: [] as string[],
    failed: [] as string[],
    skipped: [] as string[]
  };

  for (const migrate of migrations) {
    try {
      const result = await migrate(user);
      
      if (result.status === 'success') {
        results.success.push(result.name);
      } else if (result.status === 'skipped') {
        results.skipped.push(result.name);
      }
    } catch (error) {
      console.error(`Migration failed for ${migrate.name}:`, error);
      results.failed.push(migrate.name);
    }
  }

  return results;
}

// Example: Admin Profile Migration
async function migrateAdminProfile(user: User) {
  // 1. Check if already migrated
  const { data: existing } = await supabase
    .from('settings')
    .select('*')
    .eq('user_id', user.id)
    .eq('setting_key', 'admin_profile')
    .single();

  if (existing) {
    return { status: 'skipped', name: 'Admin Profile' };
  }

  // 2. Get from localStorage
  const localData = localStorage.getItem('editorName');
  if (!localData) {
    return { status: 'skipped', name: 'Admin Profile' };
  }

  // 3. Transform data
  const profileData = {
    user_id: user.id,
    setting_key: 'admin_profile',
    setting_value: {
      fullName: localData,  // editorName → fullName
      email: user.email
    }
  };

  // 4. Insert to database
  const { error } = await supabase
    .from('settings')
    .insert([profileData]);

  if (error) throw error;

  // 5. Clear localStorage
  localStorage.removeItem('editorName');

  return { status: 'success', name: 'Admin Profile' };
}
```

### Migration Triggers

Migration dapat di-trigger:
1. **Manual**: Button di Settings page
2. **Automatic**: On first login setelah update
3. **On-demand**: Saat detect localStorage data exists

### Rollback Plan

```typescript
// Rollback function (jika diperlukan)
export async function rollbackMigration(user: User, settingKey: string) {
  // 1. Get data from database
  const { data } = await supabase
    .from('settings')
    .select('*')
    .eq('user_id', user.id)
    .eq('setting_key', settingKey)
    .single();

  if (!data) return;

  // 2. Restore to localStorage
  const localKey = getLocalStorageKey(settingKey);
  localStorage.setItem(localKey, JSON.stringify(data.setting_value));

  // 3. Optionally delete from database
  // await supabase.from('settings').delete().eq('id', data.id);
  
  console.log(`Rolled back ${settingKey} to localStorage`);
}
```

---

## Terminology Changes

### "Editor" → "Admin"

**Reason**: "Editor" tidak cukup descriptive untuk highest privilege role

**Changes Made**:

#### 1. Code Changes
```typescript
// Before
interface EditorProfile {
  editorName: string;
}

// After
interface AdminProfile {
  fullName: string;  // Also renamed field
  email: string;
}
```

#### 2. UI Text Changes
- ❌ "Editor Name" → ✅ "Admin Name"
- ❌ "Editor Profile" → ✅ "Admin Profile"
- ❌ "Editor Settings" → ✅ "Admin Settings"

#### 3. Database Changes
```sql
-- Settings key renamed
-- Before: 'editor_profile'
-- After: 'admin_profile'

-- No data migration needed karena new key
```

#### 4. Component Renames
- `EditorProfileManager.tsx` → `AdminProfileManager.tsx`
- Related hooks updated

### "Task" → "Asset"

**Reason**: Terminologi khusus aplikasi untuk consistency

**Changes**:
- All "task" references → "asset"
- "task actions" → "actionable items"
- UI labels updated
- Documentation updated

---

## Schema Changes

### 1. Projects Table Evolution

#### Phase 1: Initial Schema
```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY,
  project_name TEXT,
  type TEXT,
  vertical TEXT,
  start_date DATE,
  deadline DATE,
  status TEXT,
  user_id UUID
);
```

#### Phase 2: Add Collaborators & Links
```sql
ALTER TABLE projects
  ADD COLUMN collaborators JSONB DEFAULT '[]',
  ADD COLUMN links JSONB DEFAULT '{}';
```

#### Phase 3: Add Assets
```sql
ALTER TABLE projects
  ADD COLUMN gdrive_assets JSONB DEFAULT '[]',
  ADD COLUMN lightroom_assets JSONB DEFAULT '[]';
```

#### Phase 4: Add Actionable Items
```sql
ALTER TABLE projects
  ADD COLUMN actionable_items JSONB DEFAULT '[]';
```

#### Phase 5: Add Notes & Archive
```sql
ALTER TABLE projects
  ADD COLUMN notes TEXT,
  ADD COLUMN archived BOOLEAN DEFAULT false;
```

#### Phase 6: Add Urgency
```sql
ALTER TABLE projects
  ADD COLUMN urgency TEXT;
```

### 2. New Tables Created

#### Settings Table
```sql
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) UNIQUE NOT NULL,
  setting_key TEXT NOT NULL,
  setting_value JSONB,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(user_id, setting_key)
);

-- Index for faster queries
CREATE INDEX idx_settings_user_key 
  ON settings(user_id, setting_key);
```

#### Teams Table
```sql
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL,
  color TEXT,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Index for user queries
CREATE INDEX idx_teams_user 
  ON teams(user_id);
```

#### Statuses Table
```sql
CREATE TABLE statuses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  order_index INTEGER,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Index for ordered queries
CREATE INDEX idx_statuses_user_order 
  ON statuses(user_id, order_index);
```

### 3. RLS Policies

```sql
-- Enable RLS on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Projects policies
CREATE POLICY "Users can view their own projects"
  ON projects FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects"
  ON projects FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Similar policies for teams, statuses, settings
```

---

## Data Structure Changes

### 1. GDrive Assets: Flat → Nested

#### Before (Flat Structure)
```json
{
  "gdrive_assets": [
    {
      "id": "1",
      "name": "Design v1",
      "url": "...",
      "status": "done"
    },
    {
      "id": "2",
      "name": "Design v2",
      "url": "...",
      "status": "in-progress"
    }
  ]
}
```

#### After (Nested Structure)
```json
{
  "gdrive_assets": [
    {
      "id": "folder-1",
      "name": "Designs",
      "type": "folder",
      "parent_id": null,
      "folder_path": "",
      "children": []
    },
    {
      "id": "1",
      "name": "Design v1",
      "type": "file",
      "parent_id": "folder-1",
      "folder_path": "Designs",
      "url": "...",
      "status": "done"
    },
    {
      "id": "2",
      "name": "Design v2",
      "type": "file",
      "parent_id": "folder-1",
      "folder_path": "Designs",
      "url": "...",
      "status": "in-progress"
    }
  ]
}
```

#### Migration Strategy

**Backward Compatibility Handler**:
```typescript
export function normalizeGDriveAssets(assets: any[]): GDriveAsset[] {
  if (!assets || !Array.isArray(assets)) return [];
  
  return assets.map(asset => ({
    ...asset,
    // Add missing fields untuk old data
    type: asset.type || 'file',
    parent_id: asset.parent_id || null,
    folder_path: asset.folder_path || '',
    // Preserve existing fields
    id: asset.id,
    name: asset.name,
    url: asset.url,
    status: asset.status,
    actionable_items: asset.actionable_items || []
  }));
}
```

**No Data Migration Required**: 
- Old flat assets still work (parent_id = null)
- New nested assets use parent_id
- Seamless coexistence

### 2. Actionable Items: Simple → Complex

#### Before
```json
{
  "actionable_items": [
    {
      "id": "1",
      "description": "Review design",
      "isCompleted": false
    }
  ]
}
```

#### After
```json
{
  "actionable_items": [
    {
      "id": "1",
      "description": "Review design",
      "isCompleted": false,
      "assignee": {
        "id": "team-uuid",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "order": 0,
      "trigger_status": null
    }
  ]
}
```

#### Migration Strategy

**Backward Compatibility**:
```typescript
export function normalizeActionableItems(items: any[]): ActionableItem[] {
  if (!items || !Array.isArray(items)) return [];
  
  return items.map((item, index) => ({
    id: item.id || `action-${Date.now()}-${index}`,
    description: item.description || '',
    isCompleted: item.isCompleted || false,
    assignee: item.assignee || null,  // New field
    order: item.order !== undefined ? item.order : index,  // New field
    trigger_status: item.trigger_status || null  // New field
  }));
}
```

### 3. Links: Unlabeled → Labeled

#### Before
```json
{
  "links": {
    "figma": "https://figma.com/...",
    "gsheet": "https://sheets.google.com/..."
  }
}
```

#### After
```json
{
  "links": {
    "labeled": [
      {
        "id": "link-1",
        "label": "Figma",
        "url": "https://figma.com/..."
      },
      {
        "id": "link-2",
        "label": "Google Sheet",
        "url": "https://sheets.google.com/..."
      }
    ]
  }
}
```

#### Migration Strategy

**Auto-migration on read**:
```typescript
export function normalizeLinks(links: any): NormalizedLinks {
  if (!links) return { labeled: [] };
  
  // If already new format
  if (links.labeled && Array.isArray(links.labeled)) {
    return links;
  }
  
  // Migrate old format
  const labeled: ProjectLink[] = [];
  
  Object.entries(links).forEach(([key, value]) => {
    if (typeof value === 'string') {
      labeled.push({
        id: `link-${Date.now()}-${Math.random()}`,
        label: capitalizeFirstLetter(key),
        url: value as string
      });
    }
  });
  
  return { labeled };
}
```

### 4. Status: Hardcoded → Dynamic

#### Before
```typescript
// Hardcoded in code
const STATUSES = [
  "To Do",
  "In Progress", 
  "Review",
  "Done",
  "On Hold"
];
```

#### After
```typescript
// Database table
CREATE TABLE statuses (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  order_index INTEGER,
  user_id UUID REFERENCES auth.users(id)
);

// Fetch from database
const { data: statuses } = await supabase
  .from('statuses')
  .select('*')
  .eq('user_id', user.id)
  .order('order_index');
```

#### Migration Strategy

**Auto-create default statuses on first login**:
```typescript
export async function initializeDefaultStatuses(userId: string) {
  // Check if user has statuses
  const { data: existing } = await supabase
    .from('statuses')
    .select('id')
    .eq('user_id', userId)
    .limit(1);
  
  if (existing && existing.length > 0) {
    return; // Already initialized
  }
  
  // Create default statuses
  const defaultStatuses = [
    { name: 'To Do', color: 'hsl(0, 0%, 60%)', order_index: 0 },
    { name: 'In Progress', color: 'hsl(210, 70%, 50%)', order_index: 1 },
    { name: 'Review', color: 'hsl(45, 90%, 55%)', order_index: 2 },
    { name: 'Done', color: 'hsl(120, 60%, 50%)', order_index: 3 },
    { name: 'On Hold', color: 'hsl(30, 80%, 50%)', order_index: 4 }
  ];
  
  const statusesWithUserId = defaultStatuses.map(s => ({
    ...s,
    user_id: userId
  }));
  
  await supabase.from('statuses').insert(statusesWithUserId);
}
```

---

## Testing Migrations

### Test Checklist

#### Before Migration
- [ ] Backup production database
- [ ] Test migration script in staging
- [ ] Verify data integrity
- [ ] Test rollback procedure
- [ ] Document expected changes

#### During Migration
- [ ] Monitor error logs
- [ ] Track migration progress
- [ ] Verify no data loss
- [ ] Check for locked tables
- [ ] Monitor performance

#### After Migration
- [ ] Verify all data migrated correctly
- [ ] Test application functionality
- [ ] Check for broken features
- [ ] Verify backward compatibility
- [ ] Update documentation

### Sample Test Cases

```typescript
// Test: Settings migration
describe('Settings Migration', () => {
  it('should migrate admin profile from localStorage to database', async () => {
    // Setup
    localStorage.setItem('editorName', 'John Doe');
    
    // Execute
    await migrateAdminProfile(user);
    
    // Verify
    const { data } = await supabase
      .from('settings')
      .select('*')
      .eq('setting_key', 'admin_profile')
      .single();
    
    expect(data.setting_value.fullName).toBe('John Doe');
    expect(localStorage.getItem('editorName')).toBeNull();
  });
  
  it('should skip if already migrated', async () => {
    // Setup - already migrated
    await supabase.from('settings').insert([{
      user_id: user.id,
      setting_key: 'admin_profile',
      setting_value: { fullName: 'John Doe' }
    }]);
    
    // Execute
    const result = await migrateAdminProfile(user);
    
    // Verify
    expect(result.status).toBe('skipped');
  });
});

// Test: Backward compatibility
describe('Backward Compatibility', () => {
  it('should handle old flat GDrive assets', () => {
    const oldAssets = [
      { id: '1', name: 'File 1', url: '...' }
    ];
    
    const normalized = normalizeGDriveAssets(oldAssets);
    
    expect(normalized[0].type).toBe('file');
    expect(normalized[0].parent_id).toBeNull();
    expect(normalized[0].folder_path).toBe('');
  });
  
  it('should handle new nested GDrive assets', () => {
    const newAssets = [
      { 
        id: '1', 
        name: 'File 1', 
        url: '...',
        type: 'file',
        parent_id: 'folder-1',
        folder_path: 'Designs'
      }
    ];
    
    const normalized = normalizeGDriveAssets(newAssets);
    
    expect(normalized[0].parent_id).toBe('folder-1');
    expect(normalized[0].folder_path).toBe('Designs');
  });
});
```

---

## Future Migrations

### Planned Migrations

1. **Role Permissions**
   - Migrate from simple role names to permission-based system
   - Add granular permissions (create, read, update, delete per resource)

2. **Asset Types**
   - Add more asset types (Dropbox, OneDrive, etc.)
   - Unified asset interface

3. **Advanced Workflows**
   - Multi-stage workflows
   - Conditional transitions
   - Approval flows

4. **Audit Logs**
   - Track all changes
   - User activity history
   - Compliance reports

---

## Best Practices

### 1. Always Provide Backward Compatibility
```typescript
// ✅ Good: Handle both old and new formats
function getData(data: any) {
  return data.new_field || data.old_field || defaultValue;
}

// ❌ Bad: Assume new format only
function getData(data: any) {
  return data.new_field;  // Breaks for old data
}
```

### 2. Validate Before Migration
```typescript
async function migrateData() {
  // Validate source data
  if (!isValidData(sourceData)) {
    throw new Error('Invalid source data');
  }
  
  // Transform
  const transformed = transform(sourceData);
  
  // Validate transformed data
  if (!isValidData(transformed)) {
    throw new Error('Invalid transformed data');
  }
  
  // Migrate
  await saveToDatabase(transformed);
}
```

### 3. Use Transactions
```typescript
// Use transactions untuk atomic operations
const { error } = await supabase.rpc('migrate_data', {
  // Parameters
});

// Or handle rollback manually
try {
  await step1();
  await step2();
  await step3();
} catch (error) {
  await rollbackStep3();
  await rollbackStep2();
  await rollbackStep1();
  throw error;
}
```

### 4. Document Everything
- Migration reason
- Changes made
- Backward compatibility notes
- Rollback procedure
- Testing results

---

**Next**: [Development Guide →](./DEVELOPMENT_GUIDE.md)
