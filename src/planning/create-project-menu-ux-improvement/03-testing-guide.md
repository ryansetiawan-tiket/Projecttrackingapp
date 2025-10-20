# 🧪 TESTING GUIDE - Two-Column Layout

## 📋 TESTING OVERVIEW

**Scope:** Responsive layout, functionality, user experience  
**Devices:** Desktop, Tablet, Mobile  
**Browsers:** Chrome, Firefox, Safari, Edge  
**Duration:** 30-60 minutes

---

## ✅ PRE-IMPLEMENTATION CHECKLIST

**Before starting tests:**
- [ ] Code implemented without errors
- [ ] TypeScript compilation successful
- [ ] No console errors on load
- [ ] App loads without crashes

---

## 🖥️ DESKTOP TESTING

### **TEST 1: Layout at 1920px (Full HD)**

**Steps:**
1. Set viewport to 1920x1080
2. Open ProjectForm (create or edit mode)
3. Observe layout

**Expected Results:**
- [ ] ✅ Two columns visible side-by-side
- [ ] ✅ Left column ~864px width (45%)
- [ ] ✅ Right column ~1056px width (55%)
- [ ] ✅ Gap between columns ~24px
- [ ] ✅ No horizontal scroll
- [ ] ✅ All sections render correctly

**Visual Check:**
```
┌─────────────────────────────────────────────┐
│ [LEFT ~864px]  [GAP]  [RIGHT ~1056px]      │
│                                             │
│ 8 sections      24px   4 sections           │
│ visible                visible              │
└─────────────────────────────────────────────┘
```

---

### **TEST 2: Layout at 1440px (Laptop)**

**Steps:**
1. Set viewport to 1440x900
2. Open ProjectForm
3. Observe layout

**Expected Results:**
- [ ] ✅ Two columns visible
- [ ] ✅ Left column ~648px width
- [ ] ✅ Right column ~792px width
- [ ] ✅ Gap ~24px
- [ ] ✅ Content readable
- [ ] ✅ No truncation

**Visual Check:**
```
┌───────────────────────────────────────┐
│ [LEFT 648px] [GAP] [RIGHT 792px]     │
│                                       │
│ Comfortable reading width             │
└───────────────────────────────────────┘
```

---

### **TEST 3: Layout at 1280px (Small Laptop)**

**Steps:**
1. Set viewport to 1280x720
2. Open ProjectForm
3. Observe layout

**Expected Results:**
- [ ] ✅ Two columns visible (tighter)
- [ ] ✅ Left column ~576px width
- [ ] ✅ Right column ~704px width
- [ ] ✅ No horizontal scroll
- [ ] ✅ All content fits
- [ ] ✅ Icons and text readable

**Visual Check:**
```
┌─────────────────────────────────┐
│ [LEFT 576px] [RIGHT 704px]     │
│                                 │
│ Tighter but functional          │
└─────────────────────────────────┘
```

---

### **TEST 4: Scroll Behavior (Desktop)**

**Steps:**
1. Open ProjectForm on desktop (any size ≥1024px)
2. Scroll down slowly
3. Count scroll events to see all sections

**Expected Results:**
- [ ] ✅ ~7-10 scroll events (vs 15-20 before)
- [ ] ✅ Can see 5-6 sections at once
- [ ] ✅ Status visible while editing name
- [ ] ✅ Timeline visible with status
- [ ] ✅ Assets visible on right while editing left

**Measurement:**
- **Before:** ~4000px total scroll
- **After:** ~2000px total scroll
- **Improvement:** ~50% reduction ✅

---

## 📱 BREAKPOINT TESTING

### **TEST 5: Breakpoint at 1024px (Threshold)**

**Steps:**
1. Set viewport to exactly 1024px width
2. Open ProjectForm
3. Observe layout

**Expected Results:**
- [ ] ✅ Two columns visible (at breakpoint)
- [ ] ✅ Left column ~460px
- [ ] ✅ Right column ~563px
- [ ] ✅ Content fits (no horizontal scroll)

**Visual Check:**
```
┌──────────────────────────────┐
│ [LEFT] [GAP] [RIGHT]         │
│  460px  24px   563px         │
│                              │
│ Minimal two-column layout    │
└──────────────────────────────┘
```

---

### **TEST 6: Breakpoint at 1023px (Just Below)**

**Steps:**
1. Set viewport to 1023px width
2. Open ProjectForm
3. Observe layout

**Expected Results:**
- [ ] ✅ Single column (stacked)
- [ ] ✅ 100% width
- [ ] ✅ Vertical layout
- [ ] ✅ Same as mobile view

**Visual Check:**
```
┌─────────────────┐
│                 │
│ SINGLE COLUMN   │
│ (100% width)    │
│                 │
│ Section 1       │
│ Section 2       │
│ ...             │
└─────────────────┘
```

---

## 📲 TABLET TESTING

### **TEST 7: Tablet Portrait (768px)**

**Steps:**
1. Set viewport to 768x1024
2. Open ProjectForm
3. Observe layout

**Expected Results:**
- [ ] ✅ Single column layout
- [ ] ✅ Full width usage
- [ ] ✅ All sections stacked vertically
- [ ] ✅ Touch-friendly spacing
- [ ] ✅ Same as current tablet experience

**Section Order (Top to Bottom):**
1. Vertical Selector
2. Project Name
3. Description
4. Internal Notes
5. Status
6. Timeline
7. Types
8. Collaborators
9. Actionable Items
10. Links
11. Lightroom
12. GDrive

---

### **TEST 8: Tablet Landscape (1024x768)**

**Steps:**
1. Set viewport to 1024x768
2. Open ProjectForm
3. Observe layout

**Expected Results:**
- [ ] ✅ Two columns (at breakpoint)
- [ ] ✅ Desktop layout applies
- [ ] ✅ Better horizontal space usage

---

## 📱 MOBILE TESTING

### **TEST 9: Mobile Large (414px - iPhone Pro Max)**

**Steps:**
1. Set viewport to 414x896
2. Open ProjectForm
3. Observe layout

**Expected Results:**
- [ ] ✅ Single column
- [ ] ✅ Full width
- [ ] ✅ Vertical stack
- [ ] ✅ Touch-friendly
- [ ] ✅ No horizontal scroll

---

### **TEST 10: Mobile Medium (375px - iPhone)**

**Steps:**
1. Set viewport to 375x667
2. Open ProjectForm
3. Observe layout

**Expected Results:**
- [ ] ✅ Single column
- [ ] ✅ All sections fit width
- [ ] ✅ No truncation
- [ ] ✅ Readable text

---

### **TEST 11: Mobile Small (320px)**

**Steps:**
1. Set viewport to 320x568
2. Open ProjectForm
3. Observe layout

**Expected Results:**
- [ ] ✅ Single column
- [ ] ✅ Content fits (no horizontal scroll)
- [ ] ✅ May require vertical scroll (acceptable)

---

## 🔧 FUNCTIONALITY TESTING

### **TEST 12: Form Inputs (Desktop Two-Column)**

**Steps:**
1. Open ProjectForm on desktop (≥1024px)
2. Fill out all fields:

**Left Column:**
- [ ] Select vertical → Works
- [ ] Type project name → Works
- [ ] Type description → Works
- [ ] Type notes → Works, character count updates
- [ ] Select status → Works
- [ ] Pick start date → Works
- [ ] Pick due date → Works
- [ ] Select type → Works, badge appears
- [ ] Remove type → Works
- [ ] Add collaborator → Works

**Right Column:**
- [ ] Add asset → Works
- [ ] Add action to asset → Works
- [ ] Check action → Works
- [ ] Add link → Works, icon grid visible
- [ ] Auto-detect link from URL → Works
- [ ] Add Lightroom asset → Works
- [ ] Add GDrive file → Works

---

### **TEST 13: Form Submission**

**Steps:**
1. Fill required fields (Name, Vertical, Types, Assets)
2. Click Save

**Expected Results:**
- [ ] ✅ Form validates
- [ ] ✅ Data submitted correctly
- [ ] ✅ No errors in console
- [ ] ✅ Project created/updated successfully

---

### **TEST 14: Edit Mode**

**Steps:**
1. Open existing project in edit mode
2. Observe layout
3. Modify fields
4. Save changes

**Expected Results:**
- [ ] ✅ Data loads in two-column layout
- [ ] ✅ All existing data visible
- [ ] ✅ Can edit left column fields
- [ ] ✅ Can edit right column fields
- [ ] ✅ Changes save correctly

---

## 🎨 VISUAL TESTING

### **TEST 15: Section Alignment**

**Steps:**
1. Open ProjectForm on desktop
2. Check alignment of sections

**Expected Results:**
- [ ] ✅ Left column sections align to grid
- [ ] ✅ Right column sections align to grid
- [ ] ✅ Gap consistent (24px)
- [ ] ✅ No overlapping content
- [ ] ✅ Cards have consistent padding

---

### **TEST 16: Spacing Consistency**

**Steps:**
1. Measure spacing between sections
2. Check padding inside cards

**Expected Results:**
- [ ] ✅ Vertical spacing: 24px (space-y-6)
- [ ] ✅ Card padding: 16px (p-4)
- [ ] ✅ Card content spacing: 16px (space-y-4)
- [ ] ✅ Column gap: 24px (gap-6)

---

### **TEST 17: Responsive Transition**

**Steps:**
1. Start at 1440px viewport
2. Slowly resize to 1023px
3. Observe layout change

**Expected Results:**
- [ ] ✅ At 1024px: Two columns
- [ ] ✅ At 1023px: Single column
- [ ] ✅ Smooth transition (no jank)
- [ ] ✅ No content loss
- [ ] ✅ No layout breaks

---

## 🌐 CROSS-BROWSER TESTING

### **TEST 18: Chrome**

**Steps:**
1. Open in Chrome (latest)
2. Test desktop layout
3. Test mobile layout

**Expected Results:**
- [ ] ✅ Two columns render correctly
- [ ] ✅ Grid layout works
- [ ] ✅ Responsive breakpoints work
- [ ] ✅ No visual glitches

---

### **TEST 19: Firefox**

**Steps:**
1. Open in Firefox (latest)
2. Test desktop layout
3. Test mobile layout

**Expected Results:**
- [ ] ✅ Same as Chrome
- [ ] ✅ CSS Grid supported
- [ ] ✅ No rendering issues

---

### **TEST 20: Safari**

**Steps:**
1. Open in Safari (macOS/iOS)
2. Test desktop layout (macOS)
3. Test mobile layout (iOS)

**Expected Results:**
- [ ] ✅ Same as Chrome
- [ ] ✅ Grid layout works
- [ ] ✅ Responsive breakpoints work
- [ ] ✅ Touch interactions work (iOS)

---

### **TEST 21: Edge**

**Steps:**
1. Open in Edge (latest)
2. Test desktop layout
3. Test mobile layout

**Expected Results:**
- [ ] ✅ Same as Chrome (Chromium-based)
- [ ] ✅ No compatibility issues

---

## 🔍 EDGE CASES

### **TEST 22: Very Long Project Name**

**Steps:**
1. Enter very long project name (100+ characters)
2. Observe layout

**Expected Results:**
- [ ] ✅ Text wraps or truncates
- [ ] ✅ No layout break
- [ ] ✅ Input height adjusts (if multiline)

---

### **TEST 23: Many Assets**

**Steps:**
1. Add 10+ assets
2. Observe right column

**Expected Results:**
- [ ] ✅ Right column scrollable
- [ ] ✅ Left column remains visible
- [ ] ✅ No horizontal scroll
- [ ] ✅ Performance acceptable

---

### **TEST 24: Many Types Selected**

**Steps:**
1. Add 10+ illustration types
2. Observe left column

**Expected Results:**
- [ ] ✅ Badges wrap to multiple lines
- [ ] ✅ Section expands vertically
- [ ] ✅ No layout break

---

### **TEST 25: Empty Form**

**Steps:**
1. Open new project form (empty)
2. Observe layout

**Expected Results:**
- [ ] ✅ Two columns visible
- [ ] ✅ All sections present
- [ ] ✅ Placeholders visible
- [ ] ✅ No empty space issues

---

## 📊 PERFORMANCE TESTING

### **TEST 26: Page Load Time**

**Steps:**
1. Open ProjectForm
2. Measure load time

**Expected Results:**
- [ ] ✅ Loads in <2 seconds
- [ ] ✅ No performance regression
- [ ] ✅ No layout shift (CLS)

---

### **TEST 27: Scroll Performance**

**Steps:**
1. Scroll rapidly up and down
2. Observe smoothness

**Expected Results:**
- [ ] ✅ Smooth 60fps scrolling
- [ ] ✅ No jank or stuttering
- [ ] ✅ Content renders quickly

---

## ♿ ACCESSIBILITY TESTING

### **TEST 28: Keyboard Navigation**

**Steps:**
1. Use only keyboard (Tab, Shift+Tab, Enter)
2. Navigate through all fields

**Expected Results:**
- [ ] ✅ Can tab through left column fields
- [ ] ✅ Can tab through right column fields
- [ ] ✅ Focus order logical
- [ ] ✅ All inputs accessible

---

### **TEST 29: Screen Reader**

**Steps:**
1. Enable screen reader (NVDA/JAWS/VoiceOver)
2. Navigate form

**Expected Results:**
- [ ] ✅ All labels announced
- [ ] ✅ Section headings clear
- [ ] ✅ Form structure understandable

---

### **TEST 30: Zoom Level**

**Steps:**
1. Zoom to 150%
2. Observe layout

**Expected Results:**
- [ ] ✅ Content readable
- [ ] ✅ May collapse to single column (acceptable)
- [ ] ✅ No horizontal scroll

---

## 📝 BUG TRACKING TEMPLATE

**If issues found, document as:**

```markdown
### BUG #X: [Title]

**Severity:** Critical / High / Medium / Low
**Browser:** Chrome / Firefox / Safari / Edge
**Viewport:** 1920px / 1440px / 1024px / 768px / 375px
**Type:** Layout / Functionality / Visual / Performance

**Steps to Reproduce:**
1. Step 1
2. Step 2
3. Step 3

**Expected:**
[What should happen]

**Actual:**
[What actually happens]

**Screenshot:**
[Attach if applicable]

**Fix:**
[Proposed solution]
```

---

## ✅ FINAL CHECKLIST

**Before marking as complete:**

**Layout:**
- [ ] Desktop two-column works (≥1024px)
- [ ] Mobile single-column works (<1024px)
- [ ] Breakpoint transition smooth
- [ ] No horizontal scroll at any size

**Functionality:**
- [ ] All inputs work (left column)
- [ ] All inputs work (right column)
- [ ] Form submission works
- [ ] Edit mode works
- [ ] Create mode works

**Visual:**
- [ ] Spacing consistent
- [ ] Alignment correct
- [ ] Cards render properly
- [ ] Icons display correctly
- [ ] Text readable at all sizes

**Performance:**
- [ ] Page loads quickly
- [ ] Scrolling smooth
- [ ] No layout shift
- [ ] No console errors

**Compatibility:**
- [ ] Works in Chrome
- [ ] Works in Firefox
- [ ] Works in Safari
- [ ] Works in Edge
- [ ] Works on iOS
- [ ] Works on Android

**Accessibility:**
- [ ] Keyboard navigation works
- [ ] Screen reader friendly
- [ ] Zoom levels supported
- [ ] Focus indicators visible

---

## 🎉 SUCCESS CRITERIA

**All tests must pass:**
- ✅ 30/30 test cases passed
- ✅ 0 critical bugs
- ✅ 0 high-severity bugs
- ✅ <3 medium bugs (acceptable)
- ✅ Performance maintained
- ✅ Accessibility maintained

**If all green:**
→ **Ready for production deployment! 🚀**

---

*Testing Guide for Two-Column Layout*  
*Version: v2.8.0*  
*30 Comprehensive Test Cases*  
*Next: Implementation Complete Document*
