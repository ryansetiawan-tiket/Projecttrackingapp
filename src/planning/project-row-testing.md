# Project Row Component Testing Checklist

## Phase 5 Integration Testing

### General Functionality ✅
- [x] Component created and integrated
- [x] Duplicate code removed (67% reduction)
- [x] No syntax errors
- [x] TypeScript types are correct
- [x] All imports are valid

### Status Group Mode (Group by Status)
**Config:** `showVerticalBadge: true, indentLevel: 'status-subgroup'`

Test these features:
- [ ] Projects render in correct status groups
- [ ] Vertical badge is shown for each project
- [ ] Vertical badge has correct color
- [ ] Row indentation is correct (pl-8)
- [ ] Clicking project opens detail panel
- [ ] Row background color reflects urgency (overdue, due today, etc.)
- [ ] Draft badge shows for draft projects
- [ ] Status groups can collapse/expand
- [ ] + button creates project with correct status

### Vertical Group Mode (Group by Vertical)
**Config:** `showVerticalBadge: false, indentLevel: 'status-subgroup'`

Test these features:
- [ ] Projects render in correct vertical groups
- [ ] Vertical badge is NOT shown (already in group header)
- [ ] Row indentation is correct (pl-8)
- [ ] Status subheaders show correctly
- [ ] Status subgroups can collapse/expand
- [ ] Clicking project opens detail panel
- [ ] Row background color reflects urgency
- [ ] Draft badge shows for draft projects
- [ ] + button creates project with correct vertical+status

### Cell Components Testing

#### Date Cell
- [ ] Due date displays correctly
- [ ] Quarter badge displays when applicable
- [ ] Clicking date opens popover
- [ ] Popover allows date editing
- [ ] Date changes save correctly
- [ ] Quarter badge updates after date change
- [ ] Past due dates show warning styling
- [ ] Public view: date is read-only (no popover)

#### Links Cell
- [ ] Labeled links display (first 2)
- [ ] Icons render for known link types (Figma, GSheets)
- [ ] Custom SVG icons from database render
- [ ] Custom emoji icons render
- [ ] Text links display correctly
- [ ] +N badge shows for > 2 links
- [ ] Hovering shows link URL in tooltip
- [ ] Clicking link opens in new tab
- [ ] "-" shows when no links
- [ ] Public view: links still clickable

#### Deliverables Cell
- [ ] Lightroom badge shows when assets exist
- [ ] GDrive badge shows when assets exist
- [ ] Clicking Lightroom badge navigates to Lightroom page
- [ ] Clicking GDrive badge navigates to GDrive page
- [ ] Both badges can show simultaneously
- [ ] "-" shows when no deliverables
- [ ] Public view: badges still clickable (view only)

#### Collaborator Avatars
- [ ] Avatars display (first 3)
- [ ] Initials show correctly
- [ ] Background colors are distinct
- [ ] +N badge shows for > 3 collaborators
- [ ] Avatars have correct size (h-6 w-6)
- [ ] "-" shows when no collaborators

#### Asset Progress Bar
- [ ] Progress bar displays with correct percentage
- [ ] Completed assets are counted correctly
- [ ] Color reflects completion (red → yellow → green)
- [ ] Clicking expands asset list
- [ ] Asset list shows all assets with checkboxes
- [ ] Checkboxes are interactive (not in public view)
- [ ] Asset popover allows inline editing
- [ ] Changes save correctly
- [ ] Public view: checkboxes are disabled
- [ ] Empty state shows "-" correctly

#### Actions Cell
- [ ] Three-dot menu appears (not in public view)
- [ ] Edit option works
- [ ] Delete option works
- [ ] Menu closes after action
- [ ] Public view: actions cell is hidden

### Edge Cases
- [ ] Projects with no due date
- [ ] Projects with no links
- [ ] Projects with no collaborators
- [ ] Projects with no assets
- [ ] Projects with very long names
- [ ] Projects with very long descriptions
- [ ] Draft projects vs published projects
- [ ] Overdue projects (red background)
- [ ] Due today projects (yellow background)
- [ ] Future projects (normal background)

### Responsive Design
- [ ] Mobile view works correctly
- [ ] Tablet view works correctly
- [ ] Desktop view works correctly
- [ ] Table is scrollable horizontally on small screens
- [ ] All interactive elements have proper touch targets (44px)

### Performance
- [ ] Large project lists render smoothly
- [ ] No flickering during state updates
- [ ] Popovers open/close smoothly
- [ ] Expanding asset lists is smooth
- [ ] No console errors
- [ ] No console warnings

### Accessibility
- [ ] Keyboard navigation works
- [ ] Screen reader labels are correct
- [ ] Focus states are visible
- [ ] Color contrast meets WCAG standards
- [ ] Interactive elements have proper ARIA labels

## Known Issues
None at this time.

## Testing Notes
- Test with both authenticated and public (logged out) views
- Test with different data states (empty, partial, full)
- Test with different screen sizes
- Check browser console for any errors or warnings

## Sign-off
- [ ] All critical features tested
- [ ] No blocking issues found
- [ ] Performance is acceptable
- [ ] Ready for production use
