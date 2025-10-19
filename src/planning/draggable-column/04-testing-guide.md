# Draggable Columns - Testing Guide

## Pre-Testing Setup

### Test Accounts
- **User A**: Primary test account
- **User B**: Secondary account (for multi-user testing)
- **Admin**: Account with admin privileges

### Test Data
- Create 10+ projects with varied data
- Include projects with:
  - Different statuses
  - Multiple types/verticals
  - Various deliverables
  - Different date ranges
  - Different collaborators

### Browser Matrix
- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)

---

## Test Cases

### TC-001: Basic Drag & Drop

**Objective:** Verify columns can be reordered via drag & drop

**Steps:**
1. Navigate to Table View
2. Hover over "Status" column header
3. Click and hold on "Status" header
4. Drag to position between "Deliverables" and "Assets"
5. Release mouse

**Expected Results:**
- [x] Cursor changes to grab icon on hover
- [x] Column header shows visual feedback (opacity, shadow) when dragging
- [x] Drop indicator appears between columns
- [x] Column smoothly moves to new position on drop
- [x] All table cells reorder accordingly
- [x] No layout breaks

**Priority:** High

---

### TC-002: Locked Column (Project Name)

**Objective:** Verify first column cannot be dragged

**Steps:**
1. Navigate to Table View
2. Hover over "Project Name" column header
3. Attempt to drag "Project Name" column

**Expected Results:**
- [x] No grab cursor on hover (cursor-default)
- [x] Lock icon visible in column header
- [x] Column does not move when attempting drag
- [x] Tooltip shows "This column is locked"

**Priority:** High

---

### TC-003: Cannot Drop at Position 0

**Objective:** Verify columns cannot be moved to first position

**Steps:**
1. Navigate to Table View
2. Drag "Status" column
3. Attempt to drop before "Project Name" column

**Expected Results:**
- [x] No drop indicator appears before "Project Name"
- [x] Column returns to original position on invalid drop
- [x] No error in console

**Priority:** High

---

### TC-004: Persistence After Refresh

**Objective:** Verify column order persists after page reload

**Steps:**
1. Reorder columns (e.g., move "Deliverables" to position 2)
2. Refresh the page (F5)
3. Observe column order

**Expected Results:**
- [x] Column order remains as customized
- [x] No flash of default order before loading custom order
- [x] Loading state shows briefly (if network is slow)

**Priority:** Critical

---

### TC-005: Persistence Across Sessions

**Objective:** Verify column order persists after logout/login

**Steps:**
1. Login as User A
2. Reorder columns
3. Logout
4. Login again as User A
5. Navigate to Table View

**Expected Results:**
- [x] Custom column order is preserved
- [x] Same order as before logout

**Priority:** Critical

---

### TC-006: Multi-User Isolation

**Objective:** Verify each user has independent column order

**Steps:**
1. Login as User A
2. Reorder columns (e.g., Deliverables → position 2)
3. Logout
4. Login as User B
5. Navigate to Table View
6. Note default column order
7. Reorder columns differently (e.g., Type → position 5)
8. Logout
9. Login as User A again

**Expected Results:**
- [x] User B sees default order initially (not User A's order)
- [x] User B can set their own order
- [x] User A's custom order is unchanged when logging back in
- [x] No crosstalk between user preferences

**Priority:** Critical

---

### TC-007: Reset to Default

**Objective:** Verify reset button works correctly

**Steps:**
1. Reorder columns (multiple changes)
2. Click "Reset Column Order" button
3. Observe column order

**Expected Results:**
- [x] All columns return to default order
- [x] Reset button disappears (hasCustomOrder = false)
- [x] Toast notification: "Column order reset to default"
- [x] Database entry deleted (verify in backend)

**Priority:** High

---

### TC-008: Reset Button Visibility

**Objective:** Verify reset button only shows when order is customized

**Steps:**
1. Navigate to Table View (default order)
2. Observe header area
3. Reorder one column
4. Observe header area
5. Reset column order
6. Observe header area

**Expected Results:**
- [x] Reset button NOT visible with default order
- [x] Reset button VISIBLE after reordering
- [x] Reset button disappears after reset

**Priority:** Medium

---

### TC-009: Multiple Rapid Reorders

**Objective:** Verify performance with rapid column reordering

**Steps:**
1. Drag "Status" to position 5
2. Immediately drag "Type" to position 3
3. Immediately drag "Deliverables" to position 7
4. Wait 2 seconds
5. Refresh page

**Expected Results:**
- [x] All drags execute smoothly
- [x] No lag or janky animations
- [x] Final order persists correctly
- [x] Only one save to database (debounced)

**Priority:** Medium

---

### TC-010: Drag While Scrolling

**Objective:** Verify drag works with scrollable table

**Steps:**
1. Ensure table has scrollbar (many projects)
2. Scroll to middle of table
3. Drag a column header
4. Move mouse near top/bottom of viewport

**Expected Results:**
- [x] Drag preview follows cursor correctly
- [x] Table auto-scrolls when near edge (if implemented)
- [x] Drop works correctly after scrolling
- [x] No position glitches

**Priority:** Low

---

### TC-011: Network Failure During Save

**Objective:** Verify graceful handling of save failures

**Steps:**
1. Open DevTools → Network tab
2. Set throttling to "Offline"
3. Reorder a column
4. Observe behavior
5. Set throttling back to "Online"
6. Wait a few seconds

**Expected Results:**
- [x] Column reorders immediately (optimistic update)
- [x] Error toast appears: "Failed to save column order"
- [x] Column order remains in UI (not reverted)
- [x] Retry save when back online (optional)

**Priority:** Medium

---

### TC-012: Keyboard Navigation

**Objective:** Verify keyboard accessibility

**Steps:**
1. Click on "Status" column header (focus)
2. Press Arrow Right key
3. Press Arrow Right key again
4. Press Arrow Left key
5. Press Tab to next column

**Expected Results:**
- [x] Arrow Right: Column moves one position right
- [x] Multiple Arrow Right: Cumulative movement
- [x] Arrow Left: Column moves one position left
- [x] Tab: Focus moves to next column header
- [x] Cannot move Project Name column
- [x] Cannot move column to position 0

**Priority:** High (Accessibility)

---

### TC-013: Screen Reader Compatibility

**Objective:** Verify screen reader announces column changes

**Steps:**
1. Enable screen reader (NVDA/JAWS/VoiceOver)
2. Navigate to table
3. Focus on "Status" column header
4. Drag column to new position (or use keyboard)

**Expected Results:**
- [x] Header announced as "Status, draggable column header"
- [x] Locked column announced as "Project Name, locked column header"
- [x] Position change announced: "Status moved to position 3"

**Priority:** Medium (Accessibility)

---

### TC-014: Visual Feedback During Drag

**Objective:** Verify all visual states are clear

**Steps:**
1. Hover over draggable column
2. Click and hold
3. Drag over valid drop zone
4. Drag over invalid drop zone (position 0)
5. Release on valid zone

**Expected Results:**
- [x] Hover: Background color changes, grip icon appears
- [x] Drag start: Column semi-transparent, elevated shadow
- [x] Valid drop zone: Drop indicator visible (blue line)
- [x] Invalid drop zone: No drop indicator
- [x] Drop: Smooth animation to final position

**Priority:** Medium

---

### TC-015: Dark Mode Compatibility

**Objective:** Verify drag & drop works in dark mode

**Steps:**
1. Switch to dark mode
2. Perform basic drag & drop
3. Observe all visual states

**Expected Results:**
- [x] All colors visible in dark mode
- [x] Drop indicator visible
- [x] Hover states clear
- [x] No contrast issues

**Priority:** Medium

---

### TC-016: Table Cell Content After Reorder

**Objective:** Verify table data matches reordered headers

**Steps:**
1. Note data in row 1 (e.g., Status = "In Progress", Type = "Video")
2. Reorder columns (swap Status and Type positions)
3. Observe row 1 data

**Expected Results:**
- [x] Data still matches correct project
- [x] Status cell now in Type column position
- [x] Type cell now in Status column position
- [x] All data integrity maintained
- [x] No data swap or corruption

**Priority:** Critical

---

### TC-017: Sorting Compatibility

**Objective:** Verify sorting still works after reordering columns

**Steps:**
1. Reorder columns
2. Click on a sortable column header (e.g., Start Date)
3. Sort ascending/descending
4. Observe sorting behavior

**Expected Results:**
- [x] Sorting works normally
- [x] Sort indicators appear correctly
- [x] Data sorts properly
- [x] Column order unchanged by sorting

**Priority:** High

---

### TC-018: Filter Compatibility

**Objective:** Verify filters work after reordering columns

**Steps:**
1. Reorder columns
2. Apply filters (Status, Type, etc.)
3. Observe filtered results

**Expected Results:**
- [x] Filters apply correctly
- [x] Filtered data displays in custom column order
- [x] No filter malfunction

**Priority:** High

---

### TC-019: Search Compatibility

**Objective:** Verify search works after reordering columns

**Steps:**
1. Reorder columns
2. Use search bar to find project
3. Observe search results

**Expected Results:**
- [x] Search results display in custom column order
- [x] Search functionality unchanged

**Priority:** Medium

---

### TC-020: Mobile View (Feature Disabled)

**Objective:** Verify drag & drop disabled on mobile

**Steps:**
1. Resize browser to mobile width (< 1024px)
2. Observe table view (should switch to card view)
3. If table visible, attempt drag

**Expected Results:**
- [x] Table view switches to card view on mobile
- [x] Drag & drop not applicable (cards don't have columns)
- [x] No errors in console

**Priority:** Low

---

## Performance Benchmarks

### Drag Performance
```
Target: < 16ms per frame (60fps)
Test: Measure reorderColumn() execution time
```

**Test:**
```javascript
console.time('reorder');
reorderColumn(2, 7);
console.timeEnd('reorder');
```

**Expected:** < 16ms

---

### Database Save Performance
```
Target: < 500ms for save operation
Test: Measure API call time
```

**Test:**
```javascript
console.time('save');
await saveColumnOrder(newOrder);
console.timeEnd('save');
```

**Expected:** < 500ms (network dependent)

---

### Initial Load Performance
```
Target: < 1s to load and apply column order
Test: Measure from page load to columns rendered
```

**Expected:** < 1s

---

## Edge Cases

### EC-001: Empty Column Order in Database
**Scenario:** Database returns null/empty array  
**Expected:** Falls back to DEFAULT_TABLE_COLUMNS

### EC-002: Corrupted Column Order Data
**Scenario:** Database has invalid column IDs  
**Expected:** Filters invalid IDs, falls back to default for missing

### EC-003: New Column Added to App
**Scenario:** Future update adds new column (e.g., "Priority")  
**Expected:** New column appears at end of custom order

### EC-004: Column Removed from App
**Scenario:** Future update removes column (e.g., "Links")  
**Expected:** Saved order ignores removed column, no errors

### EC-005: Simultaneous Reorder on Multiple Tabs
**Scenario:** User has app open in 2 tabs, reorders in both  
**Expected:** Last save wins, no data corruption

---

## Regression Testing

Verify these existing features still work:

- [ ] Project creation
- [ ] Project editing
- [ ] Project deletion
- [ ] Status changes
- [ ] Asset progress updates
- [ ] Deliverables editing
- [ ] Collaborator management
- [ ] Date changes
- [ ] Link management
- [ ] Archive/unarchive
- [ ] Mobile card view
- [ ] Timeline view
- [ ] Deliverables view

---

## Bug Report Template

```markdown
**Bug ID:** BUG-DND-001
**Severity:** High/Medium/Low
**Title:** [Brief description]

**Steps to Reproduce:**
1. 
2. 
3. 

**Expected Result:**
[What should happen]

**Actual Result:**
[What actually happened]

**Screenshots:**
[If applicable]

**Console Errors:**
[Any errors in console]

**Environment:**
- Browser: Chrome 120
- OS: Windows 11
- Screen size: 1920x1080
```

---

## Sign-Off Checklist

Before marking feature as complete:

### Functionality
- [ ] All test cases pass (TC-001 to TC-020)
- [ ] All edge cases handled (EC-001 to EC-005)
- [ ] Performance benchmarks met
- [ ] No regression issues

### Quality
- [ ] Zero console errors
- [ ] Zero console warnings
- [ ] Code reviewed
- [ ] Type safety verified

### Accessibility
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Focus indicators clear
- [ ] ARIA labels present

### Cross-Browser
- [ ] Chrome tested
- [ ] Firefox tested
- [ ] Safari tested
- [ ] Edge tested

### Documentation
- [ ] User guide created
- [ ] Code comments added
- [ ] Planning docs updated
- [ ] Changelog updated

---

## Post-Launch Monitoring

### Week 1
- Monitor error logs for drag-related errors
- Check database for column order saves
- Gather user feedback

### Metrics to Track
- % users using custom column order
- Most commonly moved columns
- Average time to first reorder
- Save success rate (should be ~100%)

---

## Known Limitations

Document these for users:

1. **Project Name locked** - Cannot be moved from first position
2. **Desktop only** - Feature not available on mobile/tablet
3. **Per-user preference** - Each user has separate column order
4. **No presets** - Cannot save multiple column layouts (future feature)
5. **Width not customizable** - Can only reorder, not resize (future feature)
