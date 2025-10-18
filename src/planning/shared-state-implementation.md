# Shared State Implementation - Asset Overview Tabs

**Implemented:** 2025-01-12  
**Status:** ✅ Complete  
**Issue:** User sees different UI states between Lightroom and GDrive tabs

---

## 📊 **Problem Statement**

Previously, the three main UI control buttons in the Asset Overview filter bar had **separate state** for each tab:

```
❌ BEFORE - Separate States:

Lightroom Tab:
├─ lightroom-show-preview          (separate)
├─ lightroom-mobile-grid-cols      (separate)
└─ lightroom-group-by-vertical     (separate)

GDrive Tab:
├─ gdrive-show-preview             (separate)
├─ gdrive-mobile-grid-cols         (separate)
└─ gdrive-group-by-vertical        (separate)

Problem: User sees different states when switching tabs!
```

**User Experience Issue:**
- User hides preview in Lightroom tab
- Switches to GDrive tab
- Preview is still shown (different state)
- **Confusing and inconsistent!**

---

## ✅ **Solution Implemented**

Changed three UI control states to **shared** across both tabs:

```
✅ AFTER - Shared States:

Both Tabs (Lightroom & GDrive):
├─ asset-overview-show-preview          (SHARED)
├─ asset-overview-mobile-grid-cols      (SHARED)
└─ asset-overview-group-by-vertical     (SHARED)

Benefit: Consistent UI state across all tabs!
```

### **Shared Controls:**

#### 1. **Preview Toggle** 👁️
- **Key:** `asset-overview-show-preview`
- **Default:** `true`
- **Behavior:** Show/hide asset preview images
- **Impact:** When hidden, layout switches to compact list view

#### 2. **Mobile Grid Toggle** ⚡
- **Key:** `asset-overview-mobile-grid-cols`
- **Default:** `2` (2 columns)
- **Values:** `1` or `2`
- **Behavior:** Switch between 1 or 2 column layout on mobile
- **Visibility:** Only on mobile (`md:hidden`) AND when preview shown

#### 3. **Grouping Toggle** 📊
- **Key:** `asset-overview-group-by-vertical`
- **Default:** `false`
- **Behavior:** Group projects by vertical or show flat grid
- **Impact:** Changes layout from grid to grouped sections

---

## 🔧 **What Stays Separate**

### **Vertical Filter** 🔍
- **Key:** `${config.storagePrefix}-vertical-filter`
- **Lightroom:** `lightroom-vertical-filter`
- **GDrive:** `gdrive-vertical-filter`
- **Reason:** Different verticals may be available in each tab
- **Behavior:** Filter projects by vertical (separate per tab)

---

## 📝 **Implementation Details**

### **Before (Prefix-based)**
```tsx
// All keys were prefix-based
const [mobileGridCols, setMobileGridCols] = useState<1 | 2>(() => {
  const saved = localStorage.getItem(`${config.storagePrefix}-mobile-grid-cols`);
  return saved === '1' ? 1 : 2;
});

const toggleMobileGrid = () => {
  localStorage.setItem(`${config.storagePrefix}-mobile-grid-cols`, String(newCols));
};
```

### **After (Shared Keys)**
```tsx
// Shared keys for consistent UX
const [mobileGridCols, setMobileGridCols] = useState<1 | 2>(() => {
  const saved = localStorage.getItem('asset-overview-mobile-grid-cols');
  return saved === '1' ? 1 : 2;
});

const toggleMobileGrid = () => {
  localStorage.setItem('asset-overview-mobile-grid-cols', String(newCols));
};
```

---

## 🎯 **User Flow Examples**

### **Scenario 1: Hide Preview**
```
User Action:
1. Opens Lightroom tab
2. Clicks "Hide Preview" button
3. Preview hidden, shows list view
4. Switches to GDrive tab

Result:
✅ GDrive tab ALSO shows list view (shared state)
✅ Consistent experience
```

### **Scenario 2: Change Mobile Grid**
```
User Action:
1. Opens GDrive tab on mobile
2. Changes from 2 columns to 1 column
3. Switches to Lightroom tab

Result:
✅ Lightroom tab ALSO shows 1 column (shared state)
✅ User preference preserved
```

### **Scenario 3: Enable Grouping**
```
User Action:
1. Opens Lightroom tab
2. Enables "Group by Vertical"
3. Projects grouped by vertical
4. Switches to GDrive tab

Result:
✅ GDrive tab ALSO grouped by vertical (shared state)
✅ Consistent organization
```

### **Scenario 4: Vertical Filter (Still Separate)**
```
User Action:
1. Opens Lightroom tab
2. Filters to "Social Media" vertical
3. Switches to GDrive tab

Result:
✅ GDrive tab shows "All Verticals" (separate state)
✅ Makes sense - different content per tab
```

---

## 🗄️ **LocalStorage Keys Summary**

### **Shared Keys (All Tabs)**
```
asset-overview-show-preview          → true/false
asset-overview-mobile-grid-cols      → 1/2
asset-overview-group-by-vertical     → true/false
```

### **Separate Keys (Per Tab)**
```
lightroom-vertical-filter            → all/vertical-name
gdrive-vertical-filter               → all/vertical-name
```

---

## 📱 **Mobile Behavior**

### **Mobile Grid Toggle Visibility**
The mobile grid toggle button only shows when:
1. ✅ Screen is mobile size (`md:hidden`)
2. ✅ Preview is shown (`showPreview = true`)

**Why?**
- When preview hidden → full width list
- No need for grid toggle when in list mode
- Cleaner UI

### **Example:**
```
Preview Shown (Mobile):
[Filter ▼] [👁️ Preview] [⚡ 1/2 Col] [📊 Group]
                          ↑ Shows

Preview Hidden (Mobile):
[Filter ▼] [🚫 Hidden] [📊 Group]
          (no grid toggle - not needed)
```

---

## 🎨 **Design Rationale**

### **Why Share These 3 Controls?**

#### 1. **Preview Toggle**
- **UI Preference:** Visual vs. compact preference
- **User Expectation:** Same viewing preference across tabs
- **Benefit:** Consistent visual density

#### 2. **Mobile Grid**
- **UI Preference:** Layout density on small screens
- **User Expectation:** Same grid preference for all asset grids
- **Benefit:** Predictable mobile experience

#### 3. **Grouping**
- **UI Preference:** Organizational preference
- **User Expectation:** Same organization style across tabs
- **Benefit:** Consistent mental model

### **Why Keep Vertical Filter Separate?**

#### **Vertical Filter**
- **Content Specific:** Different projects in each tab
- **User Expectation:** Independent filtering per content type
- **Benefit:** Flexible workflow per asset type

---

## ✅ **Benefits**

### **1. Consistency** 🎯
- Same UI state across all asset tabs
- Predictable behavior
- Reduced cognitive load

### **2. User Expectations** 👤
- "I hid the preview, so it should be hidden everywhere"
- "I prefer 1 column on mobile for all grids"
- Matches natural user mental model

### **3. Simpler State Management** 🔧
- Fewer localStorage keys
- Less confusion
- Easier to debug

### **4. Better UX** ✨
- No surprises when switching tabs
- Preferences preserved globally
- Feels more polished

---

## 🧪 **Testing Checklist**

### **Shared State Tests**

#### Preview Toggle
- [ ] Hide preview in Lightroom → Check GDrive also hidden
- [ ] Show preview in GDrive → Check Lightroom also shown
- [ ] Refresh page → State persists across tabs

#### Mobile Grid Toggle
- [ ] Change to 1 col in Lightroom → Check GDrive also 1 col
- [ ] Change to 2 cols in GDrive → Check Lightroom also 2 cols
- [ ] Refresh page → Grid preference persists

#### Grouping Toggle
- [ ] Enable grouping in Lightroom → Check GDrive also grouped
- [ ] Disable grouping in GDrive → Check Lightroom also ungrouped
- [ ] Refresh page → Grouping preference persists

### **Separate State Tests**

#### Vertical Filter
- [ ] Filter "Social Media" in Lightroom → GDrive still shows "All"
- [ ] Filter "Illustration" in GDrive → Lightroom keeps its filter
- [ ] Independent filtering works correctly

### **Edge Cases**
- [ ] Switch tabs rapidly → No state conflicts
- [ ] Clear localStorage → Defaults work correctly
- [ ] Multiple browser tabs → State syncs properly

---

## 🔄 **Migration from Old Keys**

Users with existing localStorage will have old keys:
```
lightroom-show-preview
lightroom-mobile-grid-cols
lightroom-group-by-vertical
gdrive-show-preview
gdrive-mobile-grid-cols
gdrive-group-by-vertical
```

**Migration Strategy:**
- ✅ **Automatic:** New keys use defaults
- ✅ **Gradual:** User sets preference once, applies to both tabs
- ✅ **No Breaking:** Old keys ignored, no errors
- ✅ **Clean:** Old keys will eventually be overwritten

**User Impact:**
- First visit after update: May see default states
- After first interaction: New shared keys take effect
- No data loss or errors

---

## 📊 **Code Changes Summary**

### **Files Modified**
- ✅ `/components/AssetOverview.tsx`

### **Changes Made**

#### State Initialization
```tsx
// CHANGED: From prefix-based to shared
- localStorage.getItem(`${config.storagePrefix}-show-preview`)
+ localStorage.getItem('asset-overview-show-preview')

- localStorage.getItem(`${config.storagePrefix}-mobile-grid-cols`)
+ localStorage.getItem('asset-overview-mobile-grid-cols')

- localStorage.getItem(`${config.storagePrefix}-group-by-vertical`)
+ localStorage.getItem('asset-overview-group-by-vertical')

// UNCHANGED: Vertical filter stays separate
localStorage.getItem(`${config.storagePrefix}-vertical-filter`)
```

#### State Setters
```tsx
// CHANGED: From prefix-based to shared
- localStorage.setItem(`${config.storagePrefix}-show-preview`, ...)
+ localStorage.setItem('asset-overview-show-preview', ...)

- localStorage.setItem(`${config.storagePrefix}-mobile-grid-cols`, ...)
+ localStorage.setItem('asset-overview-mobile-grid-cols', ...)

- localStorage.setItem(`${config.storagePrefix}-group-by-vertical`, ...)
+ localStorage.setItem('asset-overview-group-by-vertical', ...)

// UNCHANGED: Vertical filter stays separate
localStorage.setItem(`${config.storagePrefix}-vertical-filter`, ...)
```

### **Lines Changed**
- State initialization: ~25 lines
- State setters: ~15 lines
- Total: ~40 lines modified

---

## 🎉 **Conclusion**

The three main UI controls are now **shared across all asset overview tabs**:
- ✅ **Preview Toggle** - Consistent visual preference
- ✅ **Mobile Grid** - Consistent mobile layout
- ✅ **Grouping** - Consistent organization

While **Vertical Filter** remains **separate per tab** for flexibility.

**Status:** ✅ **IMPLEMENTED & READY FOR TESTING**

---

## 📚 **Related Documentation**
- `/planning/asset-overview-refactor.md` - Original refactor plan
- `/planning/implementation-complete.md` - Refactor completion
- `/components/asset-overview/types.ts` - Type definitions

---

**Implementation Date:** 2025-01-12  
**Developer Impact:** Minimal - Just localStorage key changes  
**User Impact:** Significant - Better UX consistency!
