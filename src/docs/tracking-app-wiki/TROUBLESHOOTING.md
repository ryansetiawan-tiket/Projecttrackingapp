# Troubleshooting Guide

## 🔧 Panduan Mengatasi Masalah

Dokumen ini berisi masalah-masalah yang pernah terjadi beserta solusinya.

## Daftar Isi

1. [General Issues](#general-issues)
2. [Authentication Issues](#authentication-issues)
3. [Database & Sync Issues](#database--sync-issues)
4. [UI/UX Issues](#uiux-issues)
5. [Performance Issues](#performance-issues)
6. [Mobile Issues](#mobile-issues)
7. [Feature-Specific Issues](#feature-specific-issues)

---

## General Issues

### Issue: App tidak load / blank screen

**Symptoms**:
- White/blank screen
- Console errors
- Infinite loading

**Possible Causes**:
1. JavaScript errors
2. Network issues
3. Supabase connection failure
4. Browser compatibility

**Solutions**:

```bash
# 1. Clear browser cache & cookies
# Chrome: Settings → Privacy → Clear browsing data

# 2. Check console for errors
# F12 → Console tab → Look for red errors

# 3. Verify Supabase connection
# Check .env file:
VITE_SUPABASE_URL=your_url_here
VITE_SUPABASE_ANON_KEY=your_key_here

# 4. Rebuild and restart
npm run build
npm run dev
```

**Prevention**:
- Use error boundaries
- Add fallback UI
- Implement retry logic

---

## Authentication Issues

### Issue: Cannot login / Session expires immediately

**Symptoms**:
- Login successful but redirects back to login
- Session expires after page refresh
- "User not authenticated" errors

**Solutions**:

```typescript
// 1. Check Supabase Auth settings
// Dashboard → Authentication → Settings
// Verify:
// - Site URL is correct
// - Redirect URLs are whitelisted
// - Email templates are active

// 2. Check AuthContext implementation
// Verify getSession() is called on mount:
useEffect(() => {
  supabase.auth.getSession().then(({ data: { session } }) => {
    setSession(session);
    setUser(session?.user ?? null);
  });
}, []);

// 3. Listen for auth state changes
useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    }
  );

  return () => subscription.unsubscribe();
}, []);
```

**Prevention**:
- Implement proper session management
- Add auth state listeners
- Handle token refresh

---

## Database & Sync Issues

### Issue: Data tidak sync / Real-time tidak bekerja

**Symptoms**:
- Changes tidak muncul di user lain
- Realtime subscriptions gagal
- Stale data displayed

**Solutions**:

```typescript
// 1. Verify Realtime is enabled di Supabase Dashboard
// Database → Replication → Enable for tables

// 2. Check subscription setup
useEffect(() => {
  const channel = supabase
    .channel('projects-changes')
    .on(
      'postgres_changes',
      { 
        event: '*', 
        schema: 'public', 
        table: 'projects' 
      },
      (payload) => {
        console.log('Change received!', payload);
        // Handle update
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);

// 3. Ensure proper RLS policies
-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read
CREATE POLICY "Enable read for authenticated users"
ON projects FOR SELECT
TO authenticated
USING (true);
```

**Prevention**:
- Test realtime in development
- Add connection status indicator
- Implement manual refresh option

---

### Issue: Migration errors / Data corruption

**Symptoms**:
- Settings hilang setelah refresh
- Data tidak konsisten
- Migration script fails

**Context**:
Pernah terjadi saat migrate dari localStorage ke database

**Solutions**:

```typescript
// Migration script pattern
const migrateSettings = async () => {
  try {
    // 1. Check if already migrated
    const { data: existingSettings } = await supabase
      .from('settings')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (existingSettings) {
      console.log('Already migrated');
      return;
    }
    
    // 2. Get from localStorage
    const localData = localStorage.getItem('settings');
    if (!localData) return;
    
    const parsed = JSON.parse(localData);
    
    // 3. Transform & validate
    const transformed = transformSettings(parsed);
    
    // 4. Insert to database
    const { error } = await supabase
      .from('settings')
      .insert([transformed]);
    
    if (error) throw error;
    
    // 5. Clear localStorage
    localStorage.removeItem('settings');
    
    toast.success('Settings migrated successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    toast.error('Migration failed. Please try again.');
  }
};
```

**Prevention**:
- Backup before migration
- Test migration thoroughly
- Implement rollback mechanism
- Add migration status tracking

---

## UI/UX Issues

### Issue: Layout broken / Styling issues

**Symptoms**:
- Elements overlapping
- Incorrect spacing
- Responsive breakpoints not working

**Common Causes & Solutions**:

#### 1. Overflow Issues (Fixed: Plus buttons di table)

**Problem**: Plus buttons di kolom Collaborators, Links, Deliverables mempengaruhi alignment icon buttons

**Solution**: Use absolute positioning

```tsx
// ❌ Wrong: Plus button dalam flex layout
<div className="flex gap-1 items-center">
  {items.map(item => <Item key={item.id} />)}
  {showPlus && <PlusButton />}  {/* Causes shift */}
</div>

// ✅ Correct: Absolute positioned
<div className="flex gap-1 items-center relative">
  {items.map(item => <Item key={item.id} />)}
  <PlusButton 
    className={`absolute -right-8 top-1/2 -translate-y-1/2 ${
      isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
    }`}
  />
</div>
```

#### 2. Text Overflow (Fixed: Long URLs in Add Project Link Dialog)

**Problem**: Long URLs overflow keluar dari container

**Solution**: Use word-break utilities

```tsx
// ❌ Wrong: No overflow handling
<a href={url} className="text-sm truncate">
  {url}
</a>

// ✅ Correct: Break long URLs
<a 
  href={url} 
  className="text-sm break-all min-w-0 flex-1"
  title={url}
>
  {url}
</a>
```

#### 3. Icon Proportion Issues

**Problem**: SVG icons di link labels tidak proporsional

**Solution**: Proper SVG container sizing

```tsx
// ✅ Correct SVG wrapper
<div 
  className="w-5 h-5 flex items-center justify-center [&_svg]:max-w-full [&_svg]:max-h-full [&_svg]:w-auto [&_svg]:h-auto"
  dangerouslySetInnerHTML={{ __html: svgCode }}
/>
```

---

### Issue: Charts tidak muncul / warna salah

**Symptoms**:
- Charts empty meski ada data
- Warna tidak sesuai settings
- Tooltip tidak muncul

**Solutions**:

#### 1. Quarter Distribution Chart - Multi-year colors

**Problem**: Semua quarters punya warna sama, sulit distinguish antara tahun

**Solution**: Generate unique colors per year

```typescript
// Generate colors untuk multiple years
const years = Array.from(new Set(quarterData.map(d => d.year)));
const yearColors = years.reduce((acc, year, index) => {
  acc[year] = `hsl(${(index * 360) / years.length}, 70%, 50%)`;
  return acc;
}, {} as Record<number, string>);

// Apply di chart
<Bar 
  dataKey="count" 
  fill={(entry) => yearColors[entry.year]}
/>
```

#### 2. Type/Status Charts - Use settings colors

**Problem**: Charts tidak menggunakan custom colors dari settings

**Solution**: Map colors dari context

```typescript
// Get colors from context
const { getTypeColor } = useColor();

// Transform data with colors
const chartData = projectsByType.map(item => ({
  ...item,
  fill: getTypeColor(item.type)
}));

// Use in chart
<Pie data={chartData} dataKey="count" />
```

---

## Performance Issues

### Issue: Slow loading / Lag saat banyak data

**Symptoms**:
- Page takes long to load
- UI freezes saat render
- Scroll lag

**Solutions**:

#### 1. Implement debouncing untuk auto-save

```typescript
// useDebouncedUpdate hook
export function useDebouncedUpdate<T>(
  updateFn: (data: T) => Promise<void>,
  delay: number = 1000
) {
  const timeoutRef = useRef<NodeJS.Timeout>();

  const debouncedUpdate = useCallback(
    (data: T) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        updateFn(data);
      }, delay);
    },
    [updateFn, delay]
  );

  return debouncedUpdate;
}
```

#### 2. Memoize expensive calculations

```typescript
// Stats calculations
const projectStats = useMemo(() => {
  return calculateProjectStats(projects);
}, [projects]);

// Chart data transformations
const chartData = useMemo(() => {
  return transformToChartData(projects);
}, [projects]);
```

#### 3. Lazy load heavy components

```typescript
// Dynamic imports
const StatsDialog = lazy(() => import('./components/StatsDialog'));
const GDrivePreviewGallery = lazy(() => import('./components/GDrivePreviewGalleryPage'));

// Usage with Suspense
<Suspense fallback={<LoadingSpinner />}>
  <StatsDialog />
</Suspense>
```

---

## Mobile Issues

### Issue: Mobile timeline tidak responsive

**Symptoms**:
- Timeline tidak fit di mobile screen
- Gestures tidak bekerja
- Layout broken

**Solutions**:

```typescript
// Use mobile-specific components
const isMobile = useMediaQuery('(max-width: 768px)');

return (
  <>
    {isMobile ? (
      <MobileTimelineWeek projects={projects} />
    ) : (
      <ProjectTimeline projects={projects} />
    )}
  </>
);
```

### Issue: Touch interactions tidak bekerja

**Solutions**:

```tsx
// Minimum touch target size
<button className="min-h-[44px] min-w-[44px]">
  Tap me
</button>

// Prevent default touch behaviors
<div 
  onTouchStart={(e) => e.preventDefault()}
  onTouchMove={handleTouchMove}
  onTouchEnd={handleTouchEnd}
>
  Swipeable content
</div>
```

---

## Feature-Specific Issues

### Issue: Illustration Type Badge Accumulation

**Symptoms**:
- Multiple type badges muncul di satu card
- Badge tidak clear saat ganti type
- Visual clutter

**Root Cause**:
Conditional rendering issue - badge lama tidak ter-remove saat type berubah

**Solution**:

```tsx
// ❌ Wrong: Multiple conditional renders
{type === 'Illustration' && <Badge>Illustration</Badge>}
{type === 'Design' && <Badge>Design</Badge>}
{type === 'Video' && <Badge>Video</Badge>}

// ✅ Correct: Single conditional dengan type sebagai content
{type && <Badge>{type}</Badge>}
```

**Files Fixed**:
- `ProjectCard.tsx`
- `MobileProjectList.tsx`
- `ProjectDetailSidebar.tsx`

---

### Issue: Auto-trigger actions tidak bekerja

**Symptoms**:
- Actions tidak auto-check saat status berubah
- Inconsistent behavior antara desktop & mobile
- Trigger settings tidak persist

**Investigation Steps**:

```typescript
// 1. Verify trigger settings
const { actionSettings } = useActionSettings();
console.log('Auto-trigger enabled:', actionSettings.autoTriggerEnabled);

// 2. Check status change detection
const handleStatusChange = (newStatus) => {
  console.log('Status changed:', oldStatus, '→', newStatus);
  
  if (shouldTriggerActions(oldStatus, newStatus)) {
    autoCheckActions(asset, newStatus);
  }
};

// 3. Verify actions being checked
const autoCheckActions = (asset, status) => {
  const triggeredActions = asset.actionable_items.filter(
    action => action.trigger_status === status
  );
  
  console.log('Triggered actions:', triggeredActions);
};
```

**Solutions Implemented**:
- ✅ Consistent trigger logic untuk desktop & mobile
- ✅ Settings sync dengan database
- ✅ Visual feedback saat actions auto-checked
- ✅ Prevent duplicate checks

**Files Modified**:
- `AssetActionManager.tsx`
- `GDriveOverview.tsx`
- `LightroomOverview.tsx`
- `ActionableItemManager.tsx`

---

### Issue: GDrive Nested Folders - Backward Compatibility

**Symptoms**:
- Existing flat assets tidak muncul
- Error saat load old projects
- Data migration required

**Problem**:
Struktur lama: flat array
Struktur baru: nested dengan `parent_id` & `folder_path`

**Solution**:

```typescript
// Backward compatibility handler
const normalizeAssets = (assets: GDriveAsset[]) => {
  return assets.map(asset => ({
    ...asset,
    // Add missing fields untuk backward compatibility
    parent_id: asset.parent_id || null,
    folder_path: asset.folder_path || '',
    type: asset.type || 'file'
  }));
};

// Filter root items (no parent)
const rootItems = normalizedAssets.filter(
  asset => !asset.parent_id || asset.parent_id === null
);
```

**Prevention**:
- Always add migration logic untuk schema changes
- Test dengan old data
- Document breaking changes

---

### Issue: GDrive Breadcrumbs - Incorrect Navigation

**Symptoms**:
- Breadcrumb shows wrong path
- Cannot navigate back to root
- Path separator issues

**Solution**:

```typescript
// Build breadcrumb path dari current folder
const buildBreadcrumbs = (currentFolder: GDriveAsset | null, allAssets: GDriveAsset[]) => {
  if (!currentFolder) return [];
  
  const path: GDriveAsset[] = [];
  let current = currentFolder;
  
  while (current) {
    path.unshift(current);
    current = allAssets.find(a => a.id === current.parent_id) || null;
  }
  
  return path;
};
```

---

### Issue: Save as Draft closes dialog

**Symptoms**:
- User clicks "Save as Draft"
- Dialog closes immediately
- Cannot continue editing

**User Request**:
"Save as Draft tetap di page" - user wants to stay in form after saving draft

**Solution**:

```typescript
// Add shouldClose parameter
const handleSubmit = async (data: ProjectFormData, shouldClose: boolean = true) => {
  try {
    await saveProject(data);
    toast.success('Project saved!');
    
    // Only close if explicitly requested
    if (shouldClose) {
      onClose();
    }
  } catch (error) {
    toast.error('Failed to save');
  }
};

// Button handlers
<Button onClick={() => handleSubmit(data, false)}>
  Save as Draft
</Button>
<Button onClick={() => handleSubmit(data, true)}>
  Save & Close
</Button>
```

---

### Issue: Assignee Dropdown - Hard to find collaborators

**Symptoms**:
- Long dropdown list (10+ members)
- Scroll required
- No search functionality

**Solution**:

```tsx
// Use Command component dengan search
import { Command, CommandInput, CommandList, CommandItem } from './ui/command';

<Command>
  <CommandInput placeholder="Search collaborator..." />
  <CommandList>
    {teamMembers.map(member => (
      <CommandItem
        key={member.id}
        value={member.name}
        onSelect={() => handleSelect(member)}
      >
        {member.name}
      </CommandItem>
    ))}
  </CommandList>
</Command>
```

---

### Issue: Duration Format - Only shows days

**Symptoms**:
- Long durations hard to read (e.g., "365 days")
- No month/year context
- Stats card shows large numbers

**User Request**:
Change format dari "x days" ke "x months x days"

**Solution**:

```typescript
// Helper function di statsCalculations.ts
export function formatDaysToMonthsDays(days: number): string {
  if (days === 0) return '0 days';
  
  const months = Math.floor(days / 30);
  const remainingDays = days % 30;
  
  if (months === 0) {
    return `${days} day${days !== 1 ? 's' : ''}`;
  }
  
  if (remainingDays === 0) {
    return `${months} month${months !== 1 ? 's' : ''}`;
  }
  
  return `${months} month${months !== 1 ? 's' : ''} ${remainingDays} day${remainingDays !== 1 ? 's' : ''}`;
}

// Usage di StatsCard
<div className="text-2xl font-bold">
  {formatDaysToMonthsDays(avgDuration)}
</div>
```

---

## Debug Workflow

### General Debug Process

```bash
# 1. Reproduce the issue
# - Note exact steps
# - Check if consistent
# - Test in different browsers

# 2. Check console
# - F12 → Console
# - Look for errors
# - Check network tab

# 3. Add logging
console.log('State:', state);
console.log('Props:', props);
console.log('API Response:', response);

# 4. Use React DevTools
# - Inspect component tree
# - Check props & state
# - Profile performance

# 5. Test in isolation
# - Create minimal reproduction
# - Test component standalone
# - Remove dependencies

# 6. Fix & verify
# - Apply solution
# - Test all scenarios
# - Check for regressions
```

### Debug Supabase Issues

```typescript
// Enable debug mode
const supabase = createClient(url, key, {
  auth: {
    debug: true  // Shows auth logs
  }
});

// Log all queries
const { data, error } = await supabase
  .from('projects')
  .select('*')
  .then(result => {
    console.log('Query result:', result);
    return result;
  });

// Check RLS policies
-- In Supabase SQL Editor
SELECT * FROM pg_policies WHERE tablename = 'projects';
```

---

## Common Error Messages

### "User not authenticated"
**Cause**: Session expired atau tidak ada
**Fix**: Re-login atau check AuthContext

### "Row Level Security policy violation"
**Cause**: RLS policy tidak mengizinkan operation
**Fix**: Update RLS policies di Supabase

### "Foreign key constraint violation"
**Cause**: Reference ke row yang tidak exist
**Fix**: Check relational data integrity

### "JSONB parse error"
**Cause**: Invalid JSON dalam JSONB field
**Fix**: Validate JSON sebelum save

### "Network request failed"
**Cause**: Supabase connection issue
**Fix**: Check internet, Supabase status, credentials

---

## Prevention Best Practices

### 1. Testing
- ✅ Test dengan berbagai data sizes
- ✅ Test di multiple browsers
- ✅ Test mobile responsiveness
- ✅ Test edge cases

### 2. Error Handling
- ✅ Wrap async operations dengan try-catch
- ✅ Show user-friendly error messages
- ✅ Log errors untuk debugging
- ✅ Implement retry logic

### 3. Code Quality
- ✅ Use TypeScript untuk type safety
- ✅ Add prop validation
- ✅ Write defensive code
- ✅ Add comments untuk complex logic

### 4. Monitoring
- ✅ Add error tracking (Sentry, LogRocket)
- ✅ Monitor performance metrics
- ✅ Track user behavior
- ✅ Set up alerts

---

**Next**: [Migration Guide →](./MIGRATION_GUIDE.md)
