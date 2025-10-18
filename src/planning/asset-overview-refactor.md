# Asset Overview Shared Component Refactor Plan

**Created:** 2025-01-12  
**Status:** Planning Phase  
**Estimated Effort:** 2-3 hours  
**Priority:** Medium (Code Quality & Maintainability)

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current State Analysis](#current-state-analysis)
3. [Proposed Solution](#proposed-solution)
4. [Component Architecture](#component-architecture)
5. [Type Definitions](#type-definitions)
6. [Implementation Plan](#implementation-plan)
7. [Migration Strategy](#migration-strategy)
8. [Testing Checklist](#testing-checklist)
9. [Risk Assessment](#risk-assessment)
10. [Rollback Plan](#rollback-plan)

---

## 📊 Executive Summary

### Problem Statement
We currently have two nearly identical overview components (`LightroomOverview.tsx` and `GDriveOverview.tsx`) with ~95% duplicated code (1,650 total lines). This creates:
- **Maintenance burden:** Bug fixes must be applied twice
- **Inconsistency risk:** Features may diverge over time
- **Code bloat:** Unnecessary duplication

### Proposed Solution
Create a generic `AssetOverview<T>` component that handles both asset types through a configuration pattern, reducing codebase by ~50% (830 lines total).

### Benefits
- ✅ **DRY Principle:** Single source of truth
- ✅ **Consistency:** Features auto-sync across tabs
- ✅ **Maintainability:** Fix once, works everywhere
- ✅ **Scalability:** Easy to add new asset types
- ✅ **Type Safety:** TypeScript generics ensure safety

### Trade-offs
- ⚠️ Initial refactor effort (~2-3 hours)
- ⚠️ Slightly more complex abstraction
- ⚠️ Learning curve for new contributors

---

## 🔍 Current State Analysis

### Similarities (95% of codebase)

#### Shared Features
```
┌─────────────────────────────────────────┐
│ ✅ Filter bar layout & controls        │
│ ✅ Vertical filter dropdown             │
│ ✅ Preview toggle (show/hide)           │
│ ✅ Mobile grid toggle (1/2 cols)        │
│ ✅ Grouping by vertical                 │
│ ✅ Card carousel structure              │
│ ✅ Lightbox modal                       │
│ ✅ Zoom controls                        │
│ ✅ Touch/swipe handlers                 │
│ ✅ Keyboard navigation                  │
│ ✅ Empty states                         │
│ ✅ localStorage persistence             │
│ ✅ Responsive grid logic                │
│ ✅ Navigation & click handlers          │
│ ✅ Copy to clipboard functions          │
└─────────────────────────────────────────┘
```

#### Code Metrics
```
LightroomOverview.tsx: ~820 lines
GDriveOverview.tsx:    ~830 lines
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total:                 1,650 lines
Duplicated:            ~1,570 lines (95%)
Unique:                ~80 lines (5%)
```

### Differences (5% of logic)

| Aspect | LightroomOverview | GDriveOverview |
|--------|-------------------|----------------|
| **Asset Type** | `LightroomAsset` | `GDriveAsset` |
| **Asset Key** | `lightroom_assets` | `gdrive_assets` |
| **Preview URL** | `asset.lightroom_url \|\| asset.gdrive_url` | `asset.preview_url \|\| DEFAULT_FOLDER_PREVIEW` |
| **Asset Count** | `"X assets"` | `"X files & Y folders"` |
| **Empty Icon** | `ImageIcon` | `FileIcon` |
| **Asset Click** | Always open lightbox | Smart behavior for folders |
| **Type Badges** | None | Folder/File icons |
| **Special Logic** | None | Folder default preview |

### File Locations
```
/components/LightroomOverview.tsx  (820 lines)
/components/GDriveOverview.tsx     (830 lines)
```

---

## 💡 Proposed Solution

### Architecture Strategy

Create a **generic shared component** with a **configuration pattern**:

```tsx
// Generic component
<AssetOverview<T>
  projects={projects}
  config={lightroomConfig | gdriveConfig}
  onNavigateToProject={...}
  onProjectDetail={...}
  isPublicView={false}
/>
```

### New File Structure
```
/components/
├── AssetOverview.tsx              (NEW - 700 lines shared logic)
├── LightroomOverview.tsx          (REFACTORED - 50 lines config wrapper)
├── GDriveOverview.tsx             (REFACTORED - 80 lines config wrapper)
└── asset-overview/                (NEW - Optional subfolder)
    ├── types.ts                   (Type definitions)
    ├── AssetCard.tsx              (Card subcomponent)
    └── AssetLightbox.tsx          (Lightbox subcomponent)
```

### Code Size Comparison
```
BEFORE:
├── LightroomOverview.tsx (820 lines)
└── GDriveOverview.tsx    (830 lines)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total:                    1,650 lines

AFTER:
├── AssetOverview.tsx         (700 lines) ← Shared
├── LightroomOverview.tsx     (50 lines)  ← Config only
└── GDriveOverview.tsx        (80 lines)  ← Config only
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total:                        830 lines (50% reduction!)
```

---

## 🏗️ Component Architecture

### AssetOverview Component Structure

```tsx
/**
 * Generic Asset Overview Component
 * Handles display, filtering, and navigation for asset collections
 */
export function AssetOverview<T extends BaseAsset>({
  projects,
  onNavigateToProject,
  onProjectDetail,
  config,
  isPublicView = false,
}: AssetOverviewProps<T>) {
  // Shared state management
  // Shared filtering logic
  // Shared UI rendering
  // Use config for asset-specific differences
}
```

### Configuration Interface

```tsx
interface AssetOverviewConfig<T> {
  // Data Access
  assetKey: 'lightroom_assets' | 'gdrive_assets';
  storagePrefix: string; // For localStorage keys
  
  // Asset-Specific Logic
  getPreviewUrl: (asset: T) => string | null;
  getAssetCount: (assets: T[]) => string;
  
  // UI Components
  EmptyIcon: React.ComponentType<{ className?: string }>;
  
  // Behavior Handlers
  onAssetClick: (
    project: Project,
    index: number,
    openLightbox: (project: Project, index: number) => void
  ) => void;
  
  // Optional Customizations
  renderAssetBadge?: (asset: T) => React.ReactNode;
  hasTypeBadges?: boolean;
  defaultPreviewUrl?: string;
}
```

### Subcomponents (Optional Extraction)

#### 1. AssetCard Component
```tsx
interface AssetCardProps<T> {
  project: Project;
  assets: T[];
  showPreview: boolean;
  mobileGridCols: 1 | 2;
  onNavigateToProject: (id: string) => void;
  onProjectDetail: (project: Project) => void;
  onThumbnailClick: (index: number) => void;
  config: AssetOverviewConfig<T>;
}

function AssetCard<T>({ ... }: AssetCardProps<T>) {
  // Card rendering logic
  // Carousel integration
  // Preview handling
}
```

#### 2. AssetLightbox Component
```tsx
interface AssetLightboxProps<T> {
  asset: T;
  assets: T[];
  currentIndex: number;
  projectName: string;
  onClose: () => void;
  onNavigate: (direction: 'prev' | 'next') => void;
  config: AssetOverviewConfig<T>;
}

function AssetLightbox<T>({ ... }: AssetLightboxProps<T>) {
  // Lightbox rendering
  // Zoom controls
  // Navigation
  // Touch handlers
}
```

---

## 📝 Type Definitions

### Base Types

```tsx
// /components/asset-overview/types.ts

import { Project, LightroomAsset, GDriveAsset } from '../types/project';

/**
 * Base asset type that both LightroomAsset and GDriveAsset extend
 */
export interface BaseAsset {
  id: string;
  asset_name: string;
  // Add other common fields
}

/**
 * Main configuration for asset-specific behavior
 */
export interface AssetOverviewConfig<T extends BaseAsset> {
  assetKey: 'lightroom_assets' | 'gdrive_assets';
  storagePrefix: string;
  getPreviewUrl: (asset: T) => string | null;
  getAssetCount: (assets: T[]) => string;
  EmptyIcon: React.ComponentType<{ className?: string }>;
  onAssetClick: (
    project: Project,
    index: number,
    openLightbox: (project: Project, index: number) => void
  ) => void;
  renderAssetBadge?: (asset: T) => React.ReactNode;
  hasTypeBadges?: boolean;
  defaultPreviewUrl?: string;
}

/**
 * Props for AssetOverview component
 */
export interface AssetOverviewProps<T extends BaseAsset> {
  projects: Project[];
  onNavigateToProject: (projectId: string) => void;
  onProjectDetail: (project: Project) => void;
  config: AssetOverviewConfig<T>;
  isPublicView?: boolean;
}

/**
 * State for lightbox
 */
export interface LightboxState<T> {
  projectId: string;
  assetIndex: number;
  assets: T[];
  projectName: string;
}
```

---

## 🛠️ Implementation Plan

### Phase 1: Preparation (15 mins)

#### Step 1.1: Create Planning Structure
```bash
✅ Create /planning folder
✅ Create asset-overview-refactor.md
```

#### Step 1.2: Backup Current Files
```bash
# Git commit before refactor
git add .
git commit -m "Pre-refactor: Backup LightroomOverview and GDriveOverview"
```

#### Step 1.3: Create Type Definitions
- [ ] Create `/components/asset-overview/types.ts`
- [ ] Define `BaseAsset` interface
- [ ] Define `AssetOverviewConfig<T>` interface
- [ ] Define `AssetOverviewProps<T>` interface
- [ ] Export all types

### Phase 2: Extract Shared Component (90 mins)

#### Step 2.1: Create AssetOverview.tsx
- [ ] Create `/components/AssetOverview.tsx`
- [ ] Copy full implementation from `LightroomOverview.tsx`
- [ ] Make component generic: `AssetOverview<T extends BaseAsset>`
- [ ] Add `config` prop to props interface

#### Step 2.2: Replace Hardcoded Logic with Config
- [ ] Replace `'lightroom_assets'` with `config.assetKey`
- [ ] Replace `'lightroom'` prefix with `config.storagePrefix`
- [ ] Replace `ImageIcon` with `config.EmptyIcon`
- [ ] Replace preview URL logic with `config.getPreviewUrl(asset)`
- [ ] Replace asset count logic with `config.getAssetCount(assets)`
- [ ] Replace asset click handler with `config.onAssetClick`

#### Step 2.3: Add Conditional Rendering
- [ ] Add `{config.hasTypeBadges && ...}` for GDrive badges
- [ ] Add `{config.renderAssetBadge?.(asset)}` for custom badges
- [ ] Ensure all optional config properties have fallbacks

#### Step 2.4: Test Generic Component
- [ ] Ensure TypeScript compiles without errors
- [ ] Verify all config properties are used correctly
- [ ] Check for any remaining hardcoded values

### Phase 3: Refactor Lightroom Wrapper (20 mins)

#### Step 3.1: Update LightroomOverview.tsx
```tsx
// /components/LightroomOverview.tsx

import { AssetOverview } from './AssetOverview';
import { AssetOverviewConfig } from './asset-overview/types';
import { Project, LightroomAsset } from '../types/project';
import { Image as ImageIcon } from 'lucide-react';

interface LightroomOverviewProps {
  projects: Project[];
  onNavigateToProject: (projectId: string) => void;
  onProjectDetail: (project: Project) => void;
  isPublicView?: boolean;
}

export function LightroomOverview({
  projects,
  onNavigateToProject,
  onProjectDetail,
  isPublicView = false,
}: LightroomOverviewProps) {
  const config: AssetOverviewConfig<LightroomAsset> = {
    assetKey: 'lightroom_assets',
    storagePrefix: 'lightroom',
    
    getPreviewUrl: (asset) => {
      return asset.lightroom_url || asset.gdrive_url || null;
    },
    
    getAssetCount: (assets) => {
      return `${assets.length} asset${assets.length === 1 ? '' : 's'}`;
    },
    
    EmptyIcon: ImageIcon,
    
    onAssetClick: (project, index, openLightbox) => {
      // Always open lightbox for Lightroom assets
      openLightbox(project, index);
    },
  };

  return (
    <AssetOverview
      projects={projects}
      onNavigateToProject={onNavigateToProject}
      onProjectDetail={onProjectDetail}
      config={config}
      isPublicView={isPublicView}
    />
  );
}
```

#### Step 3.2: Verify Implementation
- [ ] Remove all old code from `LightroomOverview.tsx`
- [ ] Keep only the thin wrapper
- [ ] Verify exports
- [ ] Test TypeScript compilation

### Phase 4: Refactor GDrive Wrapper (30 mins)

#### Step 4.1: Update GDriveOverview.tsx
```tsx
// /components/GDriveOverview.tsx

import { AssetOverview } from './AssetOverview';
import { AssetOverviewConfig } from './asset-overview/types';
import { Project, GDriveAsset } from '../types/project';
import { FileIcon, FolderIcon } from 'lucide-react';

const DEFAULT_FOLDER_PREVIEW = 
  'https://snymazdqexjovkdvepso.supabase.co/storage/v1/object/public/gdrive_previews/google_drive_folder_icon_for_windows_11_by_mr_celo_deoprbs.ico';

interface GDriveOverviewProps {
  projects: Project[];
  onNavigateToProject: (projectId: string) => void;
  onProjectDetail: (project: Project) => void;
  isPublicView?: boolean;
}

export function GDriveOverview({
  projects,
  onNavigateToProject,
  onProjectDetail,
  isPublicView = false,
}: GDriveOverviewProps) {
  const config: AssetOverviewConfig<GDriveAsset> = {
    assetKey: 'gdrive_assets',
    storagePrefix: 'gdrive',
    
    getPreviewUrl: (asset) => {
      // Custom preview or default folder icon
      if (asset.preview_url) return asset.preview_url;
      if (asset.asset_type === 'folder') return DEFAULT_FOLDER_PREVIEW;
      return null;
    },
    
    getAssetCount: (assets) => {
      const fileCount = assets.filter(a => a.asset_type === 'file').length;
      const folderCount = assets.filter(a => a.asset_type === 'folder').length;
      
      if (fileCount > 0 && folderCount > 0) {
        return `${fileCount} file${fileCount === 1 ? '' : 's'} & ${folderCount} folder${folderCount === 1 ? '' : 's'}`;
      } else if (folderCount > 0) {
        return `${folderCount} folder${folderCount === 1 ? '' : 's'}`;
      } else {
        return `${fileCount} file${fileCount === 1 ? '' : 's'}`;
      }
    },
    
    EmptyIcon: FileIcon,
    
    onAssetClick: (project, index, openLightbox) => {
      const asset = project.gdrive_assets?.[index];
      
      // Smart behavior: folders without preview open directly
      if (asset?.asset_type === 'folder' && !asset.preview_url) {
        window.open(asset.gdrive_link, '_blank', 'noopener,noreferrer');
        return;
      }
      
      // Files and folders with preview open lightbox
      openLightbox(project, index);
    },
    
    hasTypeBadges: true,
    
    renderAssetBadge: (asset) => {
      return asset.asset_type === 'folder' 
        ? <FolderIcon className="h-4 w-4" />
        : <FileIcon className="h-4 w-4" />;
    },
    
    defaultPreviewUrl: DEFAULT_FOLDER_PREVIEW,
  };

  return (
    <AssetOverview
      projects={projects}
      onNavigateToProject={onNavigateToProject}
      onProjectDetail={onProjectDetail}
      config={config}
      isPublicView={isPublicView}
    />
  );
}
```

#### Step 4.2: Verify Implementation
- [ ] Remove all old code from `GDriveOverview.tsx`
- [ ] Keep only the thin wrapper
- [ ] Verify all GDrive-specific logic is in config
- [ ] Test TypeScript compilation

### Phase 5: Testing & Verification (45 mins)

#### Step 5.1: Manual Testing
- [ ] Test Lightroom overview tab
- [ ] Test GDrive overview tab
- [ ] Test all filter options
- [ ] Test preview toggle
- [ ] Test mobile grid toggle
- [ ] Test grouping toggle
- [ ] Test card clicks
- [ ] Test lightbox functionality
- [ ] Test empty states

#### Step 5.2: Edge Cases
- [ ] Test with no projects
- [ ] Test with no assets
- [ ] Test with single asset
- [ ] Test with many assets (100+)
- [ ] Test folder click behavior (GDrive)
- [ ] Test type badges (GDrive only)

#### Step 5.3: Mobile Testing
- [ ] Test mobile layout (1/2 cols)
- [ ] Test touch/swipe gestures
- [ ] Test responsive breakpoints
- [ ] Test drawer interactions

#### Step 5.4: localStorage Persistence
- [ ] Test vertical filter persistence
- [ ] Test preview toggle persistence
- [ ] Test grouping toggle persistence
- [ ] Test mobile grid persistence
- [ ] Verify separate keys for each view

---

## 📋 Testing Checklist

### Functional Tests

#### Lightroom Overview Tab
- [ ] **Display**
  - [ ] Shows all projects with lightroom assets
  - [ ] Card layout correct (grid/list)
  - [ ] Preview images load
  - [ ] Asset count displays
  - [ ] Empty state shows when no assets
  
- [ ] **Filtering**
  - [ ] Vertical filter works
  - [ ] "All Verticals" option works
  - [ ] Filter persists on refresh
  
- [ ] **Preview Toggle**
  - [ ] Hide preview works
  - [ ] Show preview works
  - [ ] Layout switches to list when hidden
  - [ ] Grid toggle hidden when preview off
  - [ ] State persists on refresh
  
- [ ] **Mobile Grid Toggle**
  - [ ] Only shows on mobile
  - [ ] Only shows when preview on
  - [ ] Switches between 1/2 columns
  - [ ] State persists on refresh
  
- [ ] **Grouping**
  - [ ] Group by vertical works
  - [ ] Ungrouped grid works
  - [ ] State persists on refresh
  
- [ ] **Card Interactions**
  - [ ] Click project name navigates
  - [ ] Click thumbnail opens lightbox
  - [ ] Click detail button opens sidebar
  - [ ] Carousel navigation works
  
- [ ] **Lightbox**
  - [ ] Opens correctly
  - [ ] Shows correct asset
  - [ ] Navigation arrows work
  - [ ] Zoom in/out works
  - [ ] ESC closes lightbox
  - [ ] Copy name works
  - [ ] Copy link works
  - [ ] Mobile swipe works

#### GDrive Overview Tab
- [ ] **Display**
  - [ ] Shows all projects with gdrive assets
  - [ ] Card layout correct (grid/list)
  - [ ] Preview images load
  - [ ] Folder icons show for folders without preview
  - [ ] Asset count displays (files & folders)
  - [ ] Empty state shows when no assets
  
- [ ] **Filtering**
  - [ ] Vertical filter works
  - [ ] "All Verticals" option works
  - [ ] Filter persists on refresh
  
- [ ] **Preview Toggle**
  - [ ] Hide preview works
  - [ ] Show preview works
  - [ ] Layout switches to list when hidden
  - [ ] Grid toggle hidden when preview off
  - [ ] State persists on refresh
  
- [ ] **Mobile Grid Toggle**
  - [ ] Only shows on mobile
  - [ ] Only shows when preview on
  - [ ] Switches between 1/2 columns
  - [ ] State persists on refresh
  
- [ ] **Grouping**
  - [ ] Group by vertical works
  - [ ] Ungrouped grid works
  - [ ] State persists on refresh
  
- [ ] **Card Interactions**
  - [ ] Click project name navigates
  - [ ] Click thumbnail opens lightbox (files)
  - [ ] Click thumbnail opens GDrive (folders without preview)
  - [ ] Click detail button opens sidebar
  - [ ] Carousel navigation works
  - [ ] Type badges show (folder/file icons)
  
- [ ] **Lightbox**
  - [ ] Opens for files
  - [ ] Opens for folders with preview
  - [ ] Shows correct asset
  - [ ] Navigation arrows work
  - [ ] Zoom in/out works
  - [ ] ESC closes lightbox
  - [ ] Copy name works
  - [ ] Copy link works
  - [ ] Mobile swipe works
  
- [ ] **Folder Behavior**
  - [ ] Folders without preview open GDrive directly
  - [ ] Folders with preview open lightbox

### Cross-Browser Tests
- [ ] Chrome/Edge (Desktop & Mobile)
- [ ] Firefox (Desktop & Mobile)
- [ ] Safari (Desktop & Mobile)

### Performance Tests
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] Fast render with 50+ projects
- [ ] Smooth carousel navigation
- [ ] Responsive interactions

---

## ⚠️ Risk Assessment

### High Risk Items
1. **Type Safety Issues**
   - Risk: Generic types may cause TypeScript errors
   - Mitigation: Thorough type testing, strict mode enabled
   
2. **Lost Functionality**
   - Risk: GDrive-specific features may break
   - Mitigation: Comprehensive testing checklist, feature parity check

3. **localStorage Key Conflicts**
   - Risk: Shared component may use wrong keys
   - Mitigation: Config-based prefix ensures separation

### Medium Risk Items
1. **Performance Regression**
   - Risk: Additional abstraction may slow rendering
   - Mitigation: Profile before/after, optimize if needed

2. **Mobile Behavior Changes**
   - Risk: Touch/swipe may behave differently
   - Mitigation: Extensive mobile testing

### Low Risk Items
1. **Learning Curve**
   - Risk: Team may not understand generic pattern
   - Mitigation: Clear documentation, code comments

---

## 🔄 Rollback Plan

### If Critical Issues Found

#### Option 1: Quick Rollback (Immediate)
```bash
# Revert to previous commit
git revert HEAD
git push
```

#### Option 2: Gradual Rollback (Preferred)
1. Keep `AssetOverview.tsx` (for future use)
2. Restore full `LightroomOverview.tsx` from backup
3. Restore full `GDriveOverview.tsx` from backup
4. Fix issues in shared component
5. Re-attempt migration

### Rollback Triggers
- [ ] Critical bug in production
- [ ] TypeScript errors cannot be resolved
- [ ] Performance regression > 20%
- [ ] Feature parity cannot be achieved

---

## 📈 Success Metrics

### Code Quality
- [ ] ✅ Reduced codebase by 50% (1,650 → 830 lines)
- [ ] ✅ Zero TypeScript errors
- [ ] ✅ Zero console warnings
- [ ] ✅ All tests passing

### Functionality
- [ ] ✅ 100% feature parity with original
- [ ] ✅ All interactive elements work
- [ ] ✅ Mobile experience unchanged
- [ ] ✅ localStorage persistence works

### Maintainability
- [ ] ✅ Single source of truth established
- [ ] ✅ Clear configuration pattern
- [ ] ✅ Well-documented code
- [ ] ✅ Easy to add new asset types

---

## 📅 Timeline

### Estimated Schedule
```
Phase 1: Preparation           → 15 mins
Phase 2: Shared Component      → 90 mins
Phase 3: Lightroom Wrapper     → 20 mins
Phase 4: GDrive Wrapper        → 30 mins
Phase 5: Testing & Verification → 45 mins
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total:                         → 3 hours 20 mins
```

### Checkpoints
- **After Phase 2:** AssetOverview compiles without errors
- **After Phase 3:** Lightroom tab works identically
- **After Phase 4:** GDrive tab works identically
- **After Phase 5:** All tests passing, ready for production

---

## ✅ Final Approval

### Pre-Implementation Checklist
- [ ] Planning document reviewed and approved
- [ ] Team members notified of refactor
- [ ] Current code committed to git
- [ ] Testing environment ready
- [ ] Time allocated for implementation

### Post-Implementation Checklist
- [ ] All tests passing
- [ ] Code review completed
- [ ] Documentation updated
- [ ] Deployment successful
- [ ] Monitoring for issues

---

## 📚 References

### Related Files
- `/components/LightroomOverview.tsx` (Current implementation)
- `/components/GDriveOverview.tsx` (Current implementation)
- `/types/project.ts` (Type definitions)
- `/App.tsx` (Component usage)

### Design Patterns
- [React Generic Components](https://react-typescript-cheatsheet.netlify.app/docs/advanced/patterns_by_usecase/#generic-components)
- [Configuration Pattern](https://refactoring.guru/design-patterns/strategy)
- [DRY Principle](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself)

---

**Status:** ✅ Planning Complete - Ready for Implementation  
**Next Step:** Get approval, then proceed with Phase 1
