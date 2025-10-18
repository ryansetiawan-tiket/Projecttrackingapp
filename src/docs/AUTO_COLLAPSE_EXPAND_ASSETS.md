# Auto-Collapse/Expand Assets Feature

## Overview
Ketika user mencentang action terakhir pada suatu asset dalam project dengan multiple assets, sistem otomatis:
1. **Collapse** asset yang baru selesai
2. **Expand** asset berikutnya yang masih belum selesai
3. Skip asset yang sudah complete semua actions-nya

Ini meningkatkan **user awareness** bahwa ada lebih dari 1 asset dalam project tersebut.

---

## 🎯 Use Cases

### Case 1: Project dengan 3 Assets, Complete Asset #1
```
BEFORE:
[Asset #1 - EXPANDED] ✓✓✓ (3/3) ← User just completed last action
[Asset #2 - COLLAPSED] ☐☐ (0/2)
[Asset #3 - COLLAPSED] ☐☐☐ (0/3)

AFTER (300ms delay):
[Asset #1 - COLLAPSED] ✓✓✓ (3/3)
[Asset #2 - EXPANDED] ☐☐ (0/2) ← Auto-opened!
[Asset #3 - COLLAPSED] ☐☐☐ (0/3)
```

### Case 2: Project dengan 3 Assets, Complete Asset #2
```
BEFORE:
[Asset #1 - COLLAPSED] ✓✓✓ (3/3) ← Already complete
[Asset #2 - EXPANDED] ✓✓ (2/2) ← User just completed last action
[Asset #3 - COLLAPSED] ☐☐☐ (0/3)

AFTER (300ms delay):
[Asset #1 - COLLAPSED] ✓✓✓ (3/3)
[Asset #2 - COLLAPSED] ✓✓ (2/2)
[Asset #3 - EXPANDED] ☐☐☐ (0/3) ← Auto-opened! (skipped Asset #1 karena sudah complete)
```

### Case 3: Complete Asset Terakhir yang Incomplete
```
BEFORE:
[Asset #1 - COLLAPSED] ✓✓✓ (3/3) ← Already complete
[Asset #2 - COLLAPSED] ✓✓ (2/2) ← Already complete
[Asset #3 - EXPANDED] ✓✓✓ (3/3) ← User just completed last action

AFTER (300ms delay):
[Asset #1 - COLLAPSED] ✓✓✓ (3/3)
[Asset #2 - COLLAPSED] ✓✓ (2/2)
[Asset #3 - COLLAPSED] ✓✓✓ (3/3) ← Collapsed, nothing opens (all done!)

Console: "🎉 All assets completed! No more incomplete assets."
```

### Case 4: Project dengan 5+ Assets
```
BEFORE:
[Asset #1 - COLLAPSED] ✓✓ (2/2) ← Already complete
[Asset #2 - COLLAPSED] ✓✓✓ (3/3) ← Already complete
[Asset #3 - EXPANDED] ✓✓ (2/2) ← User just completed last action
[Asset #4 - COLLAPSED] ✓ (1/2) ← Has incomplete actions
[Asset #5 - COLLAPSED] ☐☐ (0/2)

AFTER (300ms delay):
[Asset #1 - COLLAPSED] ✓✓ (2/2)
[Asset #2 - COLLAPSED] ✓✓✓ (3/3)
[Asset #3 - COLLAPSED] ✓✓ (2/2)
[Asset #4 - EXPANDED] ✓ (1/2) ← Auto-opened! (next incomplete asset)
[Asset #5 - COLLAPSED] ☐☐ (0/2)
```

---

## 🔧 Technical Implementation

### 1. **AssetActionManager Component**
Added new callback prop:
```typescript
interface AssetActionManagerProps {
  // ... existing props
  onAllActionsCompleted?: () => void; // NEW: Callback when last action is completed
}
```

**Detection Logic:**
```typescript
const toggleAction = (id: string) => {
  // ... update actions logic
  
  // Check if this action completion made ALL actions completed
  const allCompleted = updatedActions.every(a => a.completed);
  const wasNotAllCompleted = actions.some(a => !a.completed);
  
  // If we just completed the last action (transition from "not all" to "all")
  if (allCompleted && wasNotAllCompleted && onAllActionsCompleted) {
    console.log('[AssetActionManager] 🎯 All actions completed! Triggering callback...');
    setTimeout(() => {
      onAllActionsCompleted();
    }, 100);
  }
  
  onChange(updatedActions);
};
```

### 2. **AssetProgressBar (Table/Mobile View)**
Manages accordion state for multiple assets:

```typescript
// Track which individual assets are expanded
const [expandedAssetIds, setExpandedAssetIds] = useState<Set<string>>(() => {
  // Auto-expand first asset or assets with few actions
  const initialExpanded = new Set<string>();
  if (actionableItems && actionableItems.length > 0) {
    actionableItems.forEach((asset, index) => {
      const actionCount = asset.actions?.length || 0;
      if (index === 0 || actionCount < 5) {
        initialExpanded.add(asset.id);
      }
    });
  }
  return initialExpanded;
});
```

**Auto-Collapse/Expand Logic:**
```typescript
<AssetActionManager
  onAllActionsCompleted={() => {
    if (actionableItems && actionableItems.length > 1) {
      // Close current asset
      setExpandedAssetIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(asset.id);
        return newSet;
      });
      
      // Find next INCOMPLETE asset
      const currentIndex = actionableItems.findIndex(a => a.id === asset.id);
      const nextIncompleteAsset = actionableItems.slice(currentIndex + 1).find(a => {
        if (!a.actions || a.actions.length === 0) return true;
        return a.actions.some(action => !action.completed);
      });
      
      if (nextIncompleteAsset) {
        setTimeout(() => {
          setExpandedAssetIds(prev => {
            const newSet = new Set(prev);
            newSet.add(nextIncompleteAsset.id);
            return newSet;
          });
        }, 300); // Delay for collapse animation
      }
    }
  }}
/>
```

### 3. **ProjectDetailSidebar (Desktop Sidebar)**
Similar implementation with array-based state:

```typescript
const [expandedAssetIds, setExpandedAssetIds] = useState<string[]>([]);

// Initialize expanded assets when project changes
useEffect(() => {
  if (project && project.actionable_items) {
    const defaultExpanded = project.actionable_items
      .filter((asset, index) => {
        const totalActions = asset.actions?.length || 0;
        return index === 0 || totalActions < 5;
      })
      .map(asset => asset.id);
    setExpandedAssetIds(defaultExpanded);
  }
}, [project?.id]);
```

---

## 🎨 UX Details

### Visual Behavior
- **Collapse Animation**: Smooth 300ms transition
- **Expand Animation**: Opens 300ms after collapse completes (total 600ms)
- **Smooth Flow**: User sees one section close, then the next one opens

### Console Logging
For debugging and awareness:
```
[AssetActionManager] 🎯 All actions completed! Triggering callback...
[AssetProgressBar Multi] 🎯 Asset "Design Mockups" completed! Auto-collapsing and expanding next incomplete asset...
[AssetProgressBar Multi] ➡️ Opening next incomplete asset: "Development"
```

Or when all complete:
```
[AssetProgressBar Multi] 🎉 All assets completed! No more incomplete assets.
```

### Edge Cases Handled
1. ✅ **Single Asset**: No auto behavior (tidak perlu karena cuma 1)
2. ✅ **All Assets Complete**: Tidak expand apa-apa
3. ✅ **Skip Completed Assets**: Hanya expand yang masih ada incomplete actions
4. ✅ **Empty Assets**: Dianggap incomplete (akan di-expand)
5. ✅ **ReadOnly Mode**: Callback tidak dipanggil (public view)

---

## 📍 Locations

Feature ini diimplementasikan di:

### Desktop View
1. **ProjectDetailSidebar** (`/components/ProjectDetailSidebar.tsx`)
   - Lines 38-62: `AssetCollapsibleItem` component definition
   - Lines 175-220: State management & initialization
   - Lines 626-659: Rendering with controlled state

### Mobile/Table View
2. **AssetProgressBar** (`/components/project-table/AssetProgressBar.tsx`)
   - Lines 64-76: State initialization
   - Lines 196-207: Toggle function
   - Lines 759-798: Multiple assets rendering with auto-collapse/expand

### Core Logic
3. **AssetActionManager** (`/components/AssetActionManager.tsx`)
   - Lines 17-24: Props interface
   - Lines 123-169: `toggleAction` function with detection logic

---

## 🧪 Testing Scenarios

### Manual Testing Checklist
- [ ] Project dengan 2 assets: Complete asset #1 → asset #2 opens
- [ ] Project dengan 3 assets: Complete asset #2 → asset #3 opens (skip #1 if complete)
- [ ] Project dengan 5+ assets: Find next incomplete correctly
- [ ] Complete last incomplete asset → Nothing opens, console shows "All assets completed!"
- [ ] Single asset project → No auto behavior
- [ ] Public view (read-only) → No auto behavior
- [ ] Mobile table view → Works identically to desktop
- [ ] Desktop sidebar → Works identically to mobile

### Expected Behavior
```
✅ Smooth animations (300ms + 300ms)
✅ Correct next asset detection
✅ Skip completed assets
✅ Handle edge cases
✅ Console logging for debugging
✅ Works on both desktop & mobile
```

---

## 🚀 Future Enhancements

### Potential Improvements
1. **Toast Notification**: Show "All assets completed! 🎉" toast when done
2. **Scroll to Next Asset**: Auto-scroll viewport to expanded asset
3. **Sound Effect**: Optional completion sound (with user preference)
4. **Confetti Animation**: Celebrate when all assets complete
5. **Stats Summary**: Show "Completed 3/3 assets in this project" message

### Configuration Options
Could add user settings:
```typescript
interface ActionSettings {
  autoCollapseAssets: boolean; // Enable/disable feature
  autoScrollToNext: boolean; // Auto-scroll to opened asset
  showCompletionToast: boolean; // Show toast on all complete
}
```

---

## 📚 Related Documentation
- [Action System Comprehensive Guide](./ACTION_SYSTEM_COMPREHENSIVE_GUIDE.md)
- [Auto Check Actions Above Implementation](../AUTO_CHECK_ACTIONS_ABOVE_IMPLEMENTATION.md)
- [Mobile Card Expandable Assets](../MOBILE_CARD_EXPANDABLE_ASSETS.md)
