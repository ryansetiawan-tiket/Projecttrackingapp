# GDrive Phase 5 - Quick Testing Guide

**Purpose:** Quick manual testing guide untuk verify Phase 5 features  
**Time Required:** ~10-15 minutes  
**Tested:** Phase 5 Polish & Optional Features

---

## 🎯 Quick Test Scenarios

### 1. ⌨️ **Keyboard Navigation Test** (3 mins)

**Setup:**
1. Navigate to any project dengan GDrive assets
2. Create at least 8-10 files/folders untuk test grid navigation

**Test Steps:**
```
✅ 1. Ensure NO lightbox is open (close if open)
✅ 2. Ensure "Group by Asset" toggle is OFF
✅ 3. Press Arrow Down → First item should get blue ring + scale
✅ 4. Press Arrow Right → Focus moves to next item
✅ 5. Press Arrow Left → Focus moves to previous item
✅ 6. Press Arrow Down → Focus moves down one row
✅ 7. Press Arrow Up → Focus moves up one row
✅ 8. Press Enter on a FOLDER → Should navigate into folder
✅ 9. Press Backspace → Should go back to parent
✅ 10. Press Enter on a FILE (with preview) → Should open lightbox
```

**Expected Results:**
- Blue ring dengan `scale-[1.02]` effect on focused item
- Smooth transitions between items
- Auto-scroll when focused item goes off-screen
- Grid-aware navigation (jumps correct number of columns)

**Desktop vs Mobile:**
- Desktop: 4 columns (xl), 3 columns (lg), 2 columns (md)
- Mobile: 1 column
- Navigation should adapt to column count

---

### 2. 🔍 **Search Within Folder Test** (2 mins)

**Test Steps:**
```
✅ 1. Navigate to a folder dengan multiple files
✅ 2. Locate search input (has Search icon on left)
✅ 3. Type partial filename (e.g., "test")
✅ 4. Verify only matching items show
✅ 5. Check folder info shows "X items in this folder (filtered)"
✅ 6. Click X button in search input
✅ 7. Verify search clears and all items show
✅ 8. Search again, then navigate to parent folder
✅ 9. Verify search is auto-cleared
```

**Expected Results:**
- Real-time filtering (instant)
- Clear button (X) visible when typing
- "(filtered)" indicator in folder info
- Search clears on folder navigation
- Search input has left padding untuk icon

---

### 3. ⚡ **Performance Test** (2 mins)

**Test Steps:**
```
✅ 1. Create project dengan 50+ GDrive items (or use existing)
✅ 2. Navigate between folders rapidly
✅ 3. Type in search rapidly
✅ 4. Toggle filters (type, asset) rapidly
✅ 5. Toggle "Group by Asset" on/off
✅ 6. Use keyboard navigation rapidly
```

**Expected Results:**
- No lag or stuttering
- Smooth 60fps transitions
- Instant search results
- No console errors
- No visible re-render flashing

**Performance Indicators:**
- Open browser DevTools → Performance tab
- Record while testing
- Check for:
  - No long tasks (>50ms)
  - Consistent 60fps
  - Low memory usage

---

### 4. 🎨 **Visual Polish Test** (2 mins)

**Test Steps:**
```
✅ 1. Navigate into a folder
✅ 2. Observe fade-out → fade-in transition (300ms)
✅ 3. Check keyboard shortcuts hint banner displays
✅ 4. Hover over cards → smooth shadow transition
✅ 5. Focus card dengan keyboard → smooth ring + scale
✅ 6. Check breadcrumbs are clickable dan styled
✅ 7. Verify folder info panel looks polished
```

**Expected Results:**
- Smooth opacity transition when navigating
- Keyboard hint visible (blue border, light background)
- `<kbd>` tags styled dengan border
- Focus ring is `ring-primary` (blue)
- Scale effect is subtle (`scale-[1.02]`)

**Visual Checklist:**
- [ ] Fade transition smooth (not jarring)
- [ ] Focus ring visible but not overwhelming
- [ ] Hover effects smooth
- [ ] Icons properly sized
- [ ] Spacing consistent

---

### 5. 📱 **Mobile Touch Test** (3 mins)

**Required:** Real mobile device or Chrome DevTools mobile emulation

**Test Steps:**
```
✅ 1. Open on mobile device (or emulate)
✅ 2. Tap a card → Should see scale-down effect
✅ 3. Verify no double-tap zoom on cards
✅ 4. Test search input with mobile keyboard
✅ 5. Check breadcrumbs are readable
✅ 6. Verify buttons are touch-friendly (min 44px)
✅ 7. Test swipe in lightbox (should still work)
✅ 8. Check keyboard hint shows mobile version
```

**Expected Results:**
- Active state: `active:scale-95` (slight press effect)
- `touch-manipulation` prevents zoom
- Search input opens keyboard smoothly
- All buttons easily tappable
- Lightbox swipe gestures preserved
- Keyboard hint shows "Use keyboard to navigate" (shortened)

---

### 6. 🔄 **Integration Test** (3 mins)

**Test all features together:**
```
✅ 1. Create nested folder structure (3-4 levels deep)
✅ 2. Navigate into nested folder using mouse
✅ 3. Use keyboard (Arrow + Enter) to navigate further
✅ 4. Search for specific file
✅ 5. Filter by file type
✅ 6. Use Backspace to go back
✅ 7. Click breadcrumb to jump to root
✅ 8. Verify all features work together
```

**Expected Results:**
- All features coexist without conflicts
- Keyboard nav + search + filters = works
- Breadcrumb + keyboard + search = works
- No state conflicts
- Smooth UX throughout

---

## 🐛 Common Issues & Fixes

### Issue: Keyboard nav not working
**Fix:** 
- Ensure lightbox is closed
- Ensure "Group by Asset" is OFF
- Check browser console for errors

### Issue: Search not filtering
**Fix:**
- Check search query state
- Verify `filteredGDriveAssets` useMemo deps
- Check case-insensitive match logic

### Issue: Transitions not smooth
**Fix:**
- Check `isNavigating` state timing
- Verify CSS `transition-opacity duration-300`
- Ensure no competing animations

### Issue: Focus ring not showing
**Fix:**
- Verify `focusedIndex` state
- Check `data-card-index` attribute on cards
- Ensure Tailwind classes applied: `ring-2 ring-primary`

### Issue: Mobile active state not working
**Fix:**
- Verify `active:scale-95` class
- Check `touch-manipulation` CSS
- Test on real device (not just emulator)

---

## ✅ Acceptance Criteria

### Must Pass (Critical):
- [x] Keyboard navigation works in all directions
- [x] Enter opens folders and files correctly
- [x] Backspace goes to parent folder
- [x] Search filters items in real-time
- [x] Search clears on folder navigation
- [x] Performance is smooth (no lag)
- [x] Mobile touch feedback works
- [x] No console errors

### Should Pass (Important):
- [x] Focus indicator visible and smooth
- [x] Fade transition when navigating
- [x] Keyboard hint displays
- [x] Auto-scroll works for focused items
- [x] Search with filters works together
- [x] Grid columns adapt to screen size

### Nice to Have (Polish):
- [x] Hover effects smooth
- [x] Icons properly sized
- [x] Spacing consistent
- [x] Mobile keyboard hint shortened
- [x] Clear button in search input

---

## 📊 Test Results Template

**Date Tested:** ___________  
**Tester:** ___________  
**Browser:** ___________  
**Device:** ___________  

| Feature | Pass/Fail | Notes |
|---------|-----------|-------|
| Keyboard Navigation | ⬜ | |
| Search Within Folder | ⬜ | |
| Performance | ⬜ | |
| Visual Polish | ⬜ | |
| Mobile Touch | ⬜ | |
| Integration | ⬜ | |

**Overall Result:** ⬜ PASS / ⬜ FAIL  
**Production Ready:** ⬜ YES / ⬜ NO

**Issues Found:**
1. 
2. 
3. 

**Notes:**


---

## 🚀 Quick Smoke Test (1 minute)

**Fastest way to verify Phase 5 is working:**

1. ✅ Open GDrive tab
2. ✅ Press Arrow Down (should see focus ring)
3. ✅ Type in search box (should filter)
4. ✅ Click card on mobile (should see press effect)
5. ✅ Navigate folder (should see fade transition)

**If all 5 work → Phase 5 is working! ✅**

---

**End of Testing Guide**
